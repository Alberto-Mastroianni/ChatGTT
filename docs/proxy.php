<?php
session_start();
header('Content-Type: application/json');

// Chiave API da file di configurazione separato (non su GitHub)
require_once 'config.php';

function sendError($code, $message) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

try {
    // 1. RATE LIMITING
    if (isset($_SESSION['last_request_time'])) {
        if ((time() - $_SESSION['last_request_time']) < 2) {
            sendError(429, 'Stai inviando messaggi troppo velocemente. Attendi un attimo.');
        }
    }
    $_SESSION['last_request_time'] = time();

    // 2. VALIDAZIONE INPUT
    $input = file_get_contents('php://input');
    $clientData = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($clientData['messaggio']) || trim($clientData['messaggio']) === '') {
        sendError(400, 'Nessun messaggio fornito.');
    }

    $userMessage = htmlspecialchars(trim($clientData['messaggio']), ENT_QUOTES, 'UTF-8');

    if (mb_strlen($userMessage) > 300) {
        sendError(400, 'Il messaggio è troppo lungo (massimo 300 caratteri).');
    }

    // 3. VALIDAZIONE LINGUA
    $lang = isset($clientData['lingua']) ? $clientData['lingua'] : 'it';
    $allowedLangs = ['it', 'en', 'es', 'fr', 'de'];
    if (!in_array($lang, $allowedLangs, true)) {
        $lang = 'it';
    }

    // 4. KNOWLEDGE BASE
    $knowledgeBase = "
=== CHI SIAMO ===
ChatGTT è un assistente virtuale per i trasporti pubblici di Torino, creato da Alberto Mastroianni e Matteo Licciardino, due studenti di 5° superiore. Contatto: assistenza@chatgtt.it

=== GTT - GRUPPO TORINESE TRASPORTI ===
GTT (Gruppo Torinese Trasporti) gestisce il trasporto pubblico di Torino e area metropolitana.
Servizi: autobus urbani, tram, metropolitana (linea 1), servizi extraurbani, parcheggi di interscambio.

=== BIGLIETTI E TARIFFE ===
Biglietto City (cartaceo): 2,00€ — valido 100 minuti dalla convalida, include 1 corsa in metro, da validare ad ogni cambio mezzo.
Biglietto City (digitale app To Move): 1,90€ — stesse condizioni del cartaceo.
MultiCity (10 corse): 11,80€.
Daily (giornaliero cartaceo): 4,50€ — valido per l'intera giornata solare.
Daily (giornaliero digitale): 3,70€.
Daily x4 (cartaceo): 14,80€.
Daily x4 (digitale): 12,00€.
MultiDaily 7 (7 giorni): 21,00€ — valido 7 giorni consecutivi.
Biglietto Tour 48h (cartaceo): 9,50€.
Biglietto Tour 48h (digitale): 7,80€.
Biglietto Tour 72h (cartaceo): 12,50€.
Biglietto Tour 72h (digitale): 10,30€.
Biglietto Integrato A: 3,70€ — zona urbana + 1 zona extraurbana.
Biglietto Integrato B: 4,20€ — zona urbana + 2 zone extraurbane.
Abbonamento mensile ordinario: circa 35,00€.
Abbonamento annuale ordinario: circa 308,00€.
Abbonamento agevolato (under 26 / over 65 / disabili): tariffe ridotte.
Acquisto: edicole, tabaccherie, biglietterie GTT, app To Move, totem alle fermate metro.

=== METROPOLITANA M1 ===
Unica linea metropolitana di Torino. Percorso: Fermi (Collegno) — Bengasi (Torino), 21 stazioni.
Stazioni: Fermi, Collegno Centro, Leumann, Paradiso, Marche, Massaua, Pozzo Strada, Monte Grappa, Rivoli, Racconigi, Bernini, Principi d'Acaja, XVIII Dicembre, Porta Susa, Re Umberto, Vinzaglio, Porta Nuova, Nizza, Lingotto, Bengasi.
Orari: Lun-Gio 5:30-21:30 | Ven-Sab 5:30-1:00 | Dom/Festivi 7:00-21:30.
Frequenza: ogni 7 minuti in orario di punta, ogni 15 minuti la sera.
Fuori orario è attivo il bus sostitutivo M1S.
Il biglietto City include 1 corsa in metropolitana.

=== LINEE BUS E TRAM PRINCIPALI ===
Linea 4 (tram): Collegno — Villarbasse.
Linea 9 (tram): Nizza Millefonti — San Salvario / Stampalia.
Linea 10 (tram): Piazza Castello — Grugliasco.
Linea 13 (tram): Piazza Castello — Borgata Vittoria.
Linea 15 (tram): Piazza Castello — Pecetto.
Linea 16 (tram): Piazza Castello — Falchera.
Linea 18 (tram): Piazza Castello — Barriera di Milano.
Linea 3 (bus): Collegno — Moncalieri.
Linea 36 (bus): Torino centro — Venaria Reale.
Linea 55 (bus): Torino centro — Rivoli.
Linea 72 (bus): Torino — Chieri.
STAR 1, STAR 2, STAR 3: linee ad alta frequenza nel centro.
Linee notturne NM1, NM2, NM3, NM4, NM7: attive nei fine settimana di notte.

=== SMART CARD BIP ===
BIP (Biglietto Integrato Piemonte): smart card ricaricabile per GTT e tutta la rete piemontese.
Acquisto: biglietterie GTT e punti vendita autorizzati.
Validità biglietti su BIP: 730 giorni dall'acquisto.
App To Move: acquisto e uso biglietti digitali da smartphone.

=== PARCHEGGI DI INTERSCAMBIO ===
Parcheggi park & ride vicino alle stazioni metro.
Principali: Fermi (Collegno), Paradiso, Bengasi, Lingotto.
Tariffe agevolate per chi usa i mezzi GTT.

=== SERVIZI SPECIALI ===
Servizio a chiamata: disponibile in zone periferiche.
Accessibilità: tutti i mezzi GTT sono accessibili ai disabili.
Bici pieghevoli: ammesse gratuitamente su tutti i mezzi.

=== CONVALIDA E CONTROLLI ===
I biglietti vanno convalidati all'inizio del viaggio nelle macchinette gialle.
Sanzione per evasione: 40,00€ + costo biglietto.
Abbonamento BIP: va comunque avvicinato al lettore ad ogni salita.
";

    // 5. COSTRUZIONE PROMPT
    $aiInstructions = [
        'it' => "Sei ChatGTT, un assistente virtuale per i trasporti di Torino. Rispondi SEMPRE in italiano.",
        'en' => "You are ChatGTT, a virtual assistant for Turin transport. ALWAYS respond in English.",
        'es' => "Eres ChatGTT, un asistente virtual para el transporte de Turín. Responde SIEMPRE en español.",
        'fr' => "Tu es ChatGTT, un assistant virtuel pour les transports de Turin. Réponds TOUJOURS en français.",
        'de' => "Du bist ChatGTT, ein virtueller Assistent für den Turiner Verkehr. Antworte IMMER auf Deutsch."
    ];

    $instruction = "
    {$aiInstructions[$lang]}
    Usa le informazioni fornite come knowledge base.

    REGOLE:
    1. Rispondi ESCLUSIVAMENTE nella lingua " . strtoupper($lang) . ".
    2. Rispondi solo su argomenti GTT Torino (trasporti, biglietti, linee, orari, metro, abbonamenti, BIP).
    3. Se la domanda non riguarda GTT, di' gentilmente che puoi aiutare solo su trasporti GTT.
    4. Tono gentile e sintetico. Risposte brevi e dirette.
    5. Testo semplice, senza markdown (* o #).
    6. Se non conosci la risposta, di' che non hai questa informazione disponibile.
    ";

    $fullPrompt = $knowledgeBase . "\n\n" . $instruction . "\n\nUser: " . $userMessage;

    $geminiPayload = json_encode([
        "contents" => [[
            "parts" => [["text" => $fullPrompt]]
        ]]
    ]);

    // 6. CHIAMATA API GEMINI
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . GEMINI_API_KEY;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $geminiPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $curlError = curl_errno($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('Errore di connessione al servizio AI.');
    }

    echo $response;

} catch (Exception $e) {
    sendError(500, $e->getMessage());
}
?>
