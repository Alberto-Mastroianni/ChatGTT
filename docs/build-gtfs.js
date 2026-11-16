const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const OUTPUT_FILE = path.join(__dirname, 'gtfs-data.json');
const ZIP_FILE = path.join(__dirname, 'gtt_gtfs.zip');
const EXTRACT_DIR = path.join(__dirname, 'gtt_gtfs');

/**
 * Usa gtt_gtfs.zip come sorgente principale (estraendolo in ./gtt_gtfs se manca
 * o se lo ZIP è più recente della cartella estratta). Usa eventuali cartelle mdb-*
 * solo come fallback se gtt_gtfs.zip non è presente.
 */
function resolveGtfsDir() {
  const requiredFile = 'routes.txt';

  if (fs.existsSync(ZIP_FILE)) {
    const zipMtime = fs.statSync(ZIP_FILE).mtimeMs;
    const extractedRoute = path.join(EXTRACT_DIR, requiredFile);
    const needsExtract =
      !fs.existsSync(extractedRoute) ||
      zipMtime > fs.statSync(extractedRoute).mtimeMs;

    if (needsExtract) {
      fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
      fs.mkdirSync(EXTRACT_DIR, { recursive: true });

      if (process.platform === 'win32') {
        execFileSync('tar', ['-xf', ZIP_FILE, '-C', EXTRACT_DIR]);
      } else {
        execFileSync('unzip', ['-oq', ZIP_FILE, '-d', EXTRACT_DIR]);
      }
    }

    if (fs.existsSync(extractedRoute)) {
      return EXTRACT_DIR;
    }
  }

  // Fallback: cerca cartelle già estratte (es. gtt_gtfs o mdb-*)
  const entries = fs.readdirSync(__dirname, { withFileTypes: true });
  const candidateDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map((e) => path.join(__dirname, e.name))
    .sort((a, b) => b.localeCompare(a));

  for (const dir of candidateDirs) {
    if (fs.existsSync(path.join(dir, requiredFile))) {
      return dir;
    }
  }

  throw new Error('Nessun file gtt_gtfs.zip o cartella GTFS valida trovata.');
}

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

function cleanCapName(name) {
  return (name || '').replace(/^Fermata\s+\d+\s*-\s*/i, '').trim();
}

async function streamGtfsFile(gtfsDir, filename, onRow, optional = false) {
  const filePath = path.join(gtfsDir, filename);
  if (optional && !fs.existsSync(filePath)) return;

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

function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function computeActiveServices(calendars, exceptions, targetDate) {
  const ymd = formatYMD(targetDate);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayCol = dayNames[targetDate.getDay()];

  const active = new Set();

  for (const [serviceId, cal] of calendars.entries()) {
    if (ymd >= cal.start_date && ymd <= cal.end_date && cal[dayCol] === '1') {
      active.add(serviceId);
    }
  }

  for (const ex of exceptions) {
    if (ex.date !== ymd) continue;
    if (ex.exception_type === '1') {
      active.add(ex.service_id);
    } else if (ex.exception_type === '2') {
      active.delete(ex.service_id);
    }
  }

  return active;
}

async function buildGtfs() {
  const gtfsDir = resolveGtfsDir();
  console.log(`Lettura dati GTFS da: ${path.basename(gtfsDir)}`);

  // 0. Carica calendar.txt e calendar_dates.txt per filtrare i servizi attivi oggi
  const calendars = new Map();
  await streamGtfsFile(gtfsDir, 'calendar.txt', (cols, idx) => {
    const serviceId = cols[idx.service_id];
    if (!serviceId) return;
    calendars.set(serviceId, {
      start_date: cols[idx.start_date],
      end_date: cols[idx.end_date],
      monday: cols[idx.monday],
      tuesday: cols[idx.tuesday],
      wednesday: cols[idx.wednesday],
      thursday: cols[idx.thursday],
      friday: cols[idx.friday],
      saturday: cols[idx.saturday],
      sunday: cols[idx.sunday],
    });
  }, true);

  const exceptions = [];
  await streamGtfsFile(gtfsDir, 'calendar_dates.txt', (cols, idx) => {
    const serviceId = cols[idx.service_id];
    const date = cols[idx.date];
    const exceptionType = cols[idx.exception_type];
    if (serviceId && date && exceptionType) {
      exceptions.push({ service_id: serviceId, date, exception_type: exceptionType });
    }
  }, true);

  const today = new Date();
  const activeServices = computeActiveServices(calendars, exceptions, today);

  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    for (const sid of computeActiveServices(calendars, exceptions, d)) {
      activeServices.add(sid);
    }
  }

  if (activeServices.size > 0) {
    console.log(`Servizi attivi nella settimana corrente (${formatYMD(today)}): ${activeServices.size}`);
  } else {
    console.warn('Nessun servizio attivo trovato per la data odierna: uso tutti i servizi disponibili.');
  }

  // 1. Carica routes.txt
  const routesMap = new Map();
  await streamGtfsFile(gtfsDir, 'routes.txt', (cols, idx) => {
    const routeId = cols[idx.route_id];
    const shortName = cols[idx.route_short_name] || cols[idx.route_long_name];
    if (routeId && shortName) {
      routesMap.set(routeId, shortName.trim());
    }
  });

  // 2. Carica stops.txt
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

  // 3. Carica trips.txt (solo service_id attivi)
  const tripsMap = new Map();
  await streamGtfsFile(gtfsDir, 'trips.txt', (cols, idx) => {
    const tripId = cols[idx.trip_id];
    const routeId = cols[idx.route_id];
    const serviceId = cols[idx.service_id];
    const line = routesMap.get(routeId);
    if (!tripId || !line) return;

    if (activeServices.size > 0 && serviceId && !activeServices.has(serviceId)) {
      return;
    }

    tripsMap.set(tripId, line);
  });

  // 4. Carica stop_times.txt
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

  // 5. Raggruppa per sequenza esatta delle fermate (così le varianti con stessi capolinea restano distinte)
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
    const patternKey = rawStops.map((s) => s.stopId).join('>');

    if (!lineBuckets.has(line)) {
      lineBuckets.set(line, new Map());
    }
    const patternsMap = lineBuckets.get(line);

    let bucket = patternsMap.get(patternKey);
    if (!bucket) {
      const resolvedStops = rawStops
        .map((s) => stopsMap.get(s.stopId))
        .filter(Boolean);

      bucket = {
        firstId,
        lastId,
        firstName: firstStopObj.name,
        lastName: lastStopObj.name,
        count: 0,
        bestTrip: {
          tripId,
          stops: resolvedStops,
        },
      };
      patternsMap.set(patternKey, bucket);
    }

    bucket.count += 1;
  }

  // 6. Seleziona le 2 direzioni principali opposte privilegiando la frequenza (b.count)
  const output = {};

  for (const [line, patternsMap] of lineBuckets.entries()) {
    const candidates = Array.from(patternsMap.values());
    if (candidates.length === 0) continue;

    candidates.sort(
      (a, b) =>
        b.count - a.count || b.bestTrip.stops.length - a.bestTrip.stops.length
    );

    const dir0 = candidates[0];

    const dir1 =
      candidates.find(
        (c) => c !== dir0 && c.firstId === dir0.lastId && c.lastId === dir0.firstId
      ) ||
      candidates.find(
        (c) =>
          c !== dir0 &&
          c.firstName === dir0.lastName &&
          c.lastName === dir0.firstName
      ) ||
      candidates.find(
        (c) =>
          c !== dir0 && c.firstId !== dir0.firstId && c.lastId !== dir0.lastId
      );

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

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output), 'utf8');
  console.log(`Generato ${OUTPUT_FILE} con ${Object.keys(output).length} linee.`);
}

buildGtfs().catch((err) => {
  console.error('Errore durante la generazione GTFS:', err);
  process.exit(1);
});