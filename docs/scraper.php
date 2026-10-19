<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

define('CACHE_FILE', __DIR__ . '/avvisi_cache.json');
define('CACHE_TTL', 900); // 15 minuti

function isCacheValid() {
    return file_exists(CACHE_FILE) && (time() - filemtime(CACHE_FILE)) < CACHE_TTL;
}

function fetchGTT() {
    $url = 'https://www.gtt.to.it/cms/variazioni/list/10';
    $html = @file_get_contents($url, false, stream_context_create([
        'http' => ['timeout' => 10, 'header' => "User-Agent: Mozilla/5.0\r\n"]
    ]));
    if (!$html) return [];

    $avvisi = [];
    // Estrai righe tabella
    preg_match_all('/<tr[^>]*class="fabrik_row[^"]*"[^>]*>(.*?)<\/tr>/s', $html, $rows);
    foreach ($rows[1] as $row) {
        $linea      = strip_tags(extractTd($row, 'variazioni___desclinea'));
        $inizio     = strip_tags(extractTd($row, 'variazioni___data_inizio'));
        $fine       = strip_tags(extractTd($row, 'variazioni___data_fine'));
        $descrizione = html_entity_decode(strip_tags(extractTd($row, 'variazioni___descrizione')), ENT_QUOTES, 'UTF-8');
        $motivo     = html_entity_decode(strip_tags(extractTd($row, 'variazioni___motivo')), ENT_QUOTES, 'UTF-8');

        $linea = trim($linea);
        if (!$linea) continue;

        $avvisi[] = [
            'fonte'       => 'GTT',
            'linea'       => $linea,
            'inizio'      => trim(preg_replace('/\s+/', ' ', $inizio)),
            'fine'        => trim($fine) ?: '-',
            'descrizione' => trim(preg_replace('/\s+/', ' ', $descrizione)),
            'motivo'      => trim($motivo),
        ];
    }
    return $avvisi;
}

function extractTd($html, $class) {
    preg_match('/<td[^>]*class="[^"]*' . preg_quote($class, '/') . '[^"]*"[^>]*>(.*?)<\/td>/s', $html, $m);
    return $m[1] ?? '';
}

function fetchTramTorino() {
    $url = 'https://www.tramditorino.it/';
    $html = @file_get_contents($url, false, stream_context_create([
        'http' => ['timeout' => 10, 'header' => "User-Agent: Mozilla/5.0\r\n"]
    ]));
    if (!$html) return [];

    // Estrai il blocco marquee con la situazione attuale
    preg_match('/<marquee[^>]*>(.*?)<\/marquee>/s', $html, $m);
    if (empty($m[1])) return [];

    $stato = [];
    // Ogni linea è preceduta da un commento <!-- LINEA X -->
    preg_match_all('/<!--\s*LINEA\s*([\w\/\s]+?)\s*-->\s*.*?<font[^>]*color=(?:navy|black|green|red)[^>]*>([^<]+)<\/font>/s', $m[1], $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $linea   = trim($match[1]);
        $statoTx = trim($match[2]);
        if (!$linea || !$statoTx) continue;
        $stato[] = [
            'fonte' => 'TramTorino',
            'linea' => $linea,
            'stato' => $statoTx,
            'anomalia' => (stripos($statoTx, 'non in servizio') !== false || stripos($statoTx, 'deviat') !== false || stripos($statoTx, 'limitata') !== false || stripos($statoTx, 'sostitutivo') !== false),
        ];
    }
    return $stato;
}

// Serve cache o rigenera
if (isCacheValid()) {
    echo file_get_contents(CACHE_FILE);
    exit;
}

$data = [
    'aggiornato' => date('d/m/Y H:i'),
    'gtt'        => fetchGTT(),
    'tram'       => fetchTramTorino(),
];

$json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
file_put_contents(CACHE_FILE, $json);
echo $json;
