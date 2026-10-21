const fs = require('fs');
const routes = fs.readFileSync('gtt_gtfs/routes.txt','utf8').split('\n');
const rh = routes[0].replace(/"/g,'').split(',');
const rid = rh.indexOf('route_id'), rn = rh.indexOf('route_short_name');
const rm = {};
routes.slice(1).forEach(r => { const v = r.replace(/"/g,'').split(','); rm[v[rid]] = v[rn]; });

const trips = fs.readFileSync('gtt_gtfs/trips.txt','utf8').split('\n');
const th = trips[0].replace(/"/g,'').split(',');
const di = th.indexOf('direction_id'), hi = th.indexOf('trip_headsign'), ri = th.indexOf('route_id');
const seen = new Set();
trips.slice(1).forEach(l => {
    const v = l.replace(/"/g,'').split(',');
    const name = rm[v[ri]];
    if (name === '36') {
        const key = v[di]+'|'+v[hi];
        if (!seen.has(key)) { seen.add(key); console.log('dir=['+v[di]+'] headsign=['+v[hi]+']'); }
    }
});
