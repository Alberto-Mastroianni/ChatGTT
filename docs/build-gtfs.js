const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const OUTPUT_FILE = path.join(__dirname, 'gtfs-data.json');
const ZIP_FILE = path.join(__dirname, 'gtt_gtfs.zip');

/**
 * Individua automaticamente la cartella con i file GTFS (.txt).
 * Se non esiste ancora ma è presente gtt_gtfs.zip, lo estrae.
 */
function resolveGtfsDir() {
  const requiredFile = 'routes.txt';

  const entries = fs.readdirSync(__dirname, { withFileTypes: true });
  const candidateDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map((e) => path.join(__dirname, e.name));

  // Dà priorità a 'gtt_gtfs' o alle cartelle 'mdb-*' più recenti
  candidateDirs.sort((a, b) => b.localeCompare(a));

  for (const dir of candidateDirs) {
    if (fs.existsSync(path.join(dir, requiredFile))) {
      return dir;
    }
  }

  if (fs.existsSync(ZIP_FILE)) {
    const extractDir = path.join(__dirname, 'gtt_gtfs');
    fs.mkdirSync(extractDir, { recursive: true });

    if (process.platform === 'win32') {
      execFileSync('tar', ['-xf', ZIP_FILE, '-C', extractDir]);
    } else {
      execFileSync('unzip', ['-oq', ZIP_FILE, '-d', extractDir]);
    }

    if (fs.existsSync(path.join(extractDir, requiredFile))) {
      return extractDir;
    }
  }

  throw new Error('Nessuna cartella GTFS valida o file gtt_gtfs.zip trovato.');
}

/**
 * Parser di riga nativo che gestisce virgolette e virgole interne
 * senza dipendenze esterne.
 */
function parseLine(rawLine) {
  const line = rawLine.replace(/\r$/, '');
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Rimuove il prefisso "Fermata 123 - " dal nome del capolinea.
 */
function cleanCapName(name) {
  return (name || '').replace(/^Fermata\s+\d+\s*-\s*/i, '').trim();
}

/**
 * Legge un file GTFS in streaming riga per riga.
 */
async function streamGtfsFile(gtfsDir, filename, onRow) {
  const filePath = path.join(gtfsDir, filename);
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let colIndex = null;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseLine(line);

    if (!colIndex) {
      colIndex = {};
      cols.forEach((name, idx) => {
        colIndex[name.replace(/^\uFEFF/, '')] = idx;
      });
      continue;
    }

    onRow(cols, colIndex);
  }
}

async function buildGtfs() {
  const gtfsDir = resolveGtfsDir();
  console.log(`Lettura dati GTFS da: ${path.basename(gtfsDir)}`);

  // 1. Carica routes.txt -> route_id => route_short_name
  const routesMap = new Map();
  await streamGtfsFile(gtfsDir, 'routes.txt', (cols, idx) => {
    const routeId = cols[idx.route_id];
    const shortName = cols[idx.route_short_name] || cols[idx.route_long_name];
    if (routeId && shortName) {
      routesMap.set(routeId, shortName.trim());
    }
  });

  // 2. Carica stops.txt -> stop_id => dati fermata
  const stopsMap = new Map();
  await streamGtfsFile(gtfsDir, 'stops.txt', (cols, idx) => {
    const stopId = cols[idx.stop_id];
    if (!stopId) return;
    stopsMap.set(stopId, {
      id: stopId,
      code: idx.stop_code !== undefined ? cols[idx.stop_code] : stopId,
      name: cols[idx.stop_name] || '',
      lat: parseFloat(cols[idx.stop_lat]),
      lon: parseFloat(cols[idx.stop_lon]),
    });
  });

  // 3. Carica trips.txt -> trip_id => nome linea
  const tripsMap = new Map();
  await streamGtfsFile(gtfsDir, 'trips.txt', (cols, idx) => {
    const tripId = cols[idx.trip_id];
    const routeId = cols[idx.route_id];
    const line = routesMap.get(routeId);
    if (tripId && line) {
      tripsMap.set(tripId, line);
    }
  });

  // 4. Carica stop_times.txt e raggruppa le fermate per trip_id
  const tripStops = new Map();
  await streamGtfsFile(gtfsDir, 'stop_times.txt', (cols, idx) => {
    const tripId = cols[idx.trip_id];
    if (!tripsMap.has(tripId)) return;

    const stopId = cols[idx.stop_id];
    const seq = Number(cols[idx.stop_sequence]);

    let list = tripStops.get(tripId);
    if (!list) {
      list = [];
      tripStops.set(tripId, list);
    }
    list.push({ seq, stopId });
  });

  // 5. Raggruppa i trip per linea e coppia (prima_fermata -> ultima_fermata)
  const lineBuckets = new Map();

  for (const [tripId, rawStops] of tripStops.entries()) {
    if (rawStops.length < 2) continue;

    rawStops.sort((a, b) => a.seq - b.seq);

    const firstId = rawStops[0].stopId;
    const lastId = rawStops[rawStops.length - 1].stopId;
    const firstStopObj = stopsMap.get(firstId);
    const lastStopObj = stopsMap.get(lastId);
    if (!firstStopObj || !lastStopObj) continue;

    const line = tripsMap.get(tripId);
    const pairKey = `${firstId}__${lastId}`;

    if (!lineBuckets.has(line)) {
      lineBuckets.set(line, new Map());
    }
    const pairsMap = lineBuckets.get(line);

    let bucket = pairsMap.get(pairKey);
    if (!bucket) {
      bucket = {
        firstId,
        lastId,
        firstName: firstStopObj.name,
        lastName: lastStopObj.name,
        count: 0,
        bestTrip: null,
      };
      pairsMap.set(pairKey, bucket);
    }

    bucket.count += 1;

    if (!bucket.bestTrip || rawStops.length > bucket.bestTrip.stops.length) {
      const resolvedStops = rawStops
        .map((s) => stopsMap.get(s.stopId))
        .filter(Boolean);

      bucket.bestTrip = {
        tripId,
        stops: resolvedStops,
      };
    }
  }

  // 6. Seleziona le 2 direzioni principali opposte ("0" = Andata, "1" = Ritorno)
  const output = {};

  for (const [line, pairsMap] of lineBuckets.entries()) {
    const candidates = Array.from(pairsMap.values());
    if (candidates.length === 0) continue;

    const maxCount = Math.max(...candidates.map((c) => c.count));
    const regularCandidates = candidates.filter((c) => c.count >= maxCount * 0.15);
    const pool = regularCandidates.length > 0 ? regularCandidates : candidates;

    pool.sort(
      (a, b) =>
        b.bestTrip.stops.length - a.bestTrip.stops.length || b.count - a.count
    );

    const dir0 = pool[0];

    const dir1 =
      pool.find(
        (c) => c !== dir0 && c.firstId === dir0.lastId && c.lastId === dir0.firstId
      ) ||
      pool.find(
        (c) =>
          c !== dir0 &&
          c.firstName === dir0.lastName &&
          c.lastName === dir0.firstName
      ) ||
      pool.find(
        (c) =>
          c !== dir0 && c.firstId !== dir0.firstId && c.lastId !== dir0.lastId
      );

    // Capolinea brevi e simmetrici senza "Fermata XXX - "
    const formatDirection = (bucket) => {
      const stops = bucket.bestTrip.stops;
      const first = stops[0];
      const last = stops[stops.length - 1];
      const cleanFirst = cleanCapName(first.name);
      const cleanLast = cleanCapName(last.name);
      return {
        headsign: cleanLast,
        firstCap: cleanFirst,
        lastCap: cleanLast,
        firstStop: first.id,
        lastStop: last.id,
        stops,
      };
    };

    output[line] = {
      0: formatDirection(dir0),
    };

    if (dir1) {
      output[line]['1'] = formatDirection(dir1);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Generato ${OUTPUT_FILE} con ${Object.keys(output).length} linee.`);
}

buildGtfs().catch((err) => {
  console.error('Errore durante la generazione GTFS:', err);
  process.exit(1);
});
const outPath = process.env.GTFS_DIR ? path.join(process.cwd(), 'gtfs-data.json') : path.join(__dirname, 'gtfs-data.json');
fs.writeFileSync(outPath, JSON.stringify(result));
console.log(`✅ gtfs-data.json generato con ${Object.keys(result).length} linee → ${outPath}`);
