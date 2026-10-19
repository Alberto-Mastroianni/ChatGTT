const fs = require('fs');
const path = require('path');

const GTFS_DIR = process.env.GTFS_DIR ? path.join(process.cwd(), process.env.GTFS_DIR) : path.join(__dirname, 'gtt_gtfs');

function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const headers = lines[0].replace(/"/g, '').split(',');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.replace(/"/g, '').split(',');
    const obj = {};
    headers.forEach((h, idx) => obj[h.trim()] = (values[idx] || '').trim());
    rows.push(obj);
  }
  return rows;
}

console.log('Lettura routes...');
const routes = parseCSV(path.join(GTFS_DIR, 'routes.txt'));
// route_id -> route_short_name
const routeMap = {};
routes.forEach(r => routeMap[r.route_id] = r.route_short_name);

console.log('Lettura stops...');
const stops = parseCSV(path.join(GTFS_DIR, 'stops.txt'));
// stop_id -> { stop_code, stop_name }
const stopMap = {};
stops.forEach(s => stopMap[s.stop_id] = { code: s.stop_code, name: s.stop_name });

console.log('Lettura trips...');
const trips = parseCSV(path.join(GTFS_DIR, 'trips.txt'));
// trip_id -> { route_short_name, direction_id, headsign }
const tripMap = {};
trips.forEach(t => {
  const lineName = routeMap[t.route_id];
  if (lineName) tripMap[t.trip_id] = { line: lineName, dir: t.direction_id, headsign: t.trip_headsign };
});

console.log('Lettura stop_times (file grande, attendere...)');
const stopTimesRaw = fs.readFileSync(path.join(GTFS_DIR, 'stop_times.txt'), 'utf8');
const stLines = stopTimesRaw.split('\n');
const stHeaders = stLines[0].replace(/"/g, '').split(',');
const tripIdx = stHeaders.indexOf('trip_id');
const stopIdx = stHeaders.indexOf('stop_id');
const seqIdx = stHeaders.indexOf('stop_sequence');

// Per ogni linea+direzione, raccoglie le fermate ordinate per sequence
// Struttura: lineStops[line][dir][trip_id] = [{seq, stop_code, stop_name}]
// Poi per ogni linea+dir prendiamo il trip con più fermate come rappresentativo
const lineTrips = {}; // line -> dir -> trip_id -> Map<seq, {code,name}>

for (let i = 1; i < stLines.length; i++) {
  const line = stLines[i].trim();
  if (!line) continue;
  const vals = line.replace(/"/g, '').split(',');
  const trip_id = vals[tripIdx];
  const stop_id = vals[stopIdx];
  const seq = parseInt(vals[seqIdx]) || 0;
  const tripInfo = tripMap[trip_id];
  if (!tripInfo) continue;
  const stopInfo = stopMap[stop_id];
  if (!stopInfo) continue;

  const { line: lineName, dir } = tripInfo;
  if (!lineTrips[lineName]) lineTrips[lineName] = {};
  if (!lineTrips[lineName][dir]) lineTrips[lineName][dir] = {};
  if (!lineTrips[lineName][dir][trip_id]) lineTrips[lineName][dir][trip_id] = [];
  lineTrips[lineName][dir][trip_id].push({ seq, code: stopInfo.code, name: stopInfo.name });
}

console.log('Costruzione database linee...');
// Per ogni linea+dir, prendi il trip con più fermate
const result = {};
for (const [lineName, dirs] of Object.entries(lineTrips)) {
  result[lineName] = {};
  for (const [dir, tripsObj] of Object.entries(dirs)) {
    // Trova il trip con più fermate
    let bestTrip = null, bestLen = 0;
    for (const [tid, stops] of Object.entries(tripsObj)) {
      if (stops.length > bestLen) { bestLen = stops.length; bestTrip = stops; }
    }
    // Ordina per sequence e deduplica per stop_code
    const seen = new Set();
    const ordered = bestTrip
      .sort((a, b) => a.seq - b.seq)
      .filter(s => { if (seen.has(s.code)) return false; seen.add(s.code); return true; })
      .map(s => ({ code: s.code, name: s.name }));
    // Aggiungi anche headsign (capolinea)
    const headsign = Object.values(tripMap).find(t => t.line === lineName && t.dir === dir)?.headsign || '';
    // Usa headsign come label se disponibile, altrimenti capolinea calcolati
    const firstStop = ordered[0]?.name.replace(/Fermata \d+ - /, '') || '';
    const lastStop = ordered[ordered.length - 1]?.name.replace(/Fermata \d+ - /, '') || '';
    result[lineName][dir] = { headsign: headsign || lastStop, firstStop, lastStop, stops: ordered };
  }
}

const outPath = process.env.GTFS_DIR ? path.join(process.cwd(), 'gtfs-data.json') : path.join(__dirname, 'gtfs-data.json');
fs.writeFileSync(outPath, JSON.stringify(result));
console.log(`✅ gtfs-data.json generato con ${Object.keys(result).length} linee → ${outPath}`);
