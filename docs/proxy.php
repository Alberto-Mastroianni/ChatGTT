<?php
// Avvia una sessione per tenere traccia di chi sta facendo le richieste (serve per l'anti-spam)
session_start(); 

header('Content-Type: application/json');

// La tua API Key di Gemini (INSERISCI LA TUA QUI)
$apiKey = 'AIzaSyAjcV8bhkfDSavxoo855JmxMlIAxbJ0FJg'; 

// 1. RATE LIMITING (Anti-Spam)
// Permette massimo 1 messaggio ogni 2 secondi per ogni singolo utente
if (isset($_SESSION['last_request_time'])) {
    $time_since_last = time() - $_SESSION['last_request_time'];
    if ($time_since_last < 2) {
        http_response_code(429);
        echo json_encode(['error' => 'Stai inviando messaggi troppo velocemente. Attendi un attimo.']);
        exit;
    }
}
$_SESSION['last_request_time'] = time();

// Ricevi i dati dal javascript
$input = file_get_contents('php://input');
$clientData = json_decode($input, true);

// 2. VALIDAZIONE INPUT E LIMITE LUNGHEZZA
if (!isset($clientData['messaggio']) || trim($clientData['messaggio']) === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Nessun messaggio fornito']);
    exit;
}

$userMessage = trim($clientData['messaggio']);

// Se il messaggio supera i 300 caratteri, lo blocchiamo per risparmiare Token
if (strlen($userMessage) > 300) {
    http_response_code(400);
    echo json_encode(['error' => 'Il messaggio è troppo lungo (massimo 300 caratteri).']);
    exit;
}

// 3. VALIDAZIONE LINGUA (Whitelist)
$lang = isset($clientData['lingua']) ? $clientData['lingua'] : 'it';
$allowedLangs = ['it', 'en', 'es', 'fr', 'de'];

// Se qualcuno manomette il JS e invia una lingua inesistente, forziamo l'italiano
if (!in_array($lang, $allowedLangs)) {
    $lang = 'it';
}

// 4. COSTRUZIONE DEL PROMPT
$knowledgeBase = "
=== CHI SIAMO ===
ChatGTT è un assistente virtuale per i trasporti pubblici di Torino, creato da Alberto Mastroianni e Matteo Licciardino, due studenti di 5° superiore. Contatto: assistenza@chatgtt.it

=== GTT - GRUPPO TORINESE TRASPORTI ===
GTT (Gruppo Torinese Trasporti) gestisce il trasporto pubblico di Torino e area metropolitana. Sito ufficiale: https://gtt.to.it
Servizi: autobus urbani, tram, metropolitana (linea 1), servizi extraurbani, parcheggi di interscambio.

=== BIGLIETTI E TARIFFE ===
Biglietto City (cartaceo): 2,00€ — valido 100 minuti dalla convalida, include 1 corsa in metro, utilizzabile da 1 persona, da validare ad ogni cambio mezzo.
Biglietto City (digitale app To Move): 1,90€ — stesse condizioni del cartaceo.
MultiCity (10 corse): 11,80€ — equivale a 10 biglietti City.
Daily (giornaliero cartaceo): 4,50€ — valido per l'intera giornata solare.
Daily (giornaliero digitale): 3,70€.
Daily x4 (4 giornalieri cartacei): 14,80€.
Daily x4 (digitale): 12,00€.
MultiDaily 7 (7 giorni): 21,00€ — valido 7 giorni consecutivi.
Biglietto Tour 48h (cartaceo): 9,50€ — valido 48 ore consecutive, ideale per turisti.
Biglietto Tour 48h (digitale): 7,80€.
Biglietto Tour 72h (cartaceo): 12,50€ — valido 72 ore consecutive.
Biglietto Tour 72h (digitale): 10,30€.
Biglietto Integrato A: 3,70€ — include zona urbana + 1 zona extraurbana.
Biglietto Integrato B: 4,20€ — include zona urbana + 2 zone extraurbane.
Abbonamento mensile ordinario: circa 35,00€ — valido su tutta la rete urbana GTT per 1 mese.
Abbonamento annuale ordinario: circa 308,00€.
Abbonamento mensile agevolato (under 26 / over 65 / disabili): tariffe ridotte disponibili sul sito GTT.
I biglietti si acquistano: alle edicole, tabaccherie, biglietterie GTT, app To Move, totem automatici alle fermate metro.

=== METROPOLITANA M1 ===
La linea M1 è l'unica linea metropolitana di Torino, gestita da GTT.
Percorso: Fermi (Collegno) ↔ Bengasi (Torino), con 21 stazioni.
Stazioni principali: Fermi, Collegno Centro, Leumann, Paradiso, Marche, Massaua, Pozzo Strada, Monte Grappa, Rivoli, Racconigi, Bernini, Principi d'Acaja, XVIII Dicembre, Porta Susa, Re Umberto, Vinzaglio, Porta Nuova, Nizza, Lingotto, Bengasi.
Orari M1: Lun-Gio 5:30-21:30 | Ven-Sab 5:30-1:00 | Dom/Festivi 7:00-21:30.
Frequenza: ogni 7 minuti circa nelle ore di punta, ogni 15 minuti nelle ore serali.
Fuori orario metro è attivo il servizio sostitutivo M1S (bus).
Il biglietto City include 1 corsa in metropolitana.

=== LINEE BUS E TRAM PRINCIPALI ===
Linea 4 (tram): Collegno ↔ Villarbasse, attraversa il centro di Torino.
Linea 9 (tram): Nizza Millefonti ↔ San Salvario / Stampalia, linea storica.
Linea 10 (tram): Piazza Castello ↔ Grugliasco.
Linea 13 (tram): Piazza Castello ↔ Borgata Vittoria.
Linea 15 (tram): Piazza Castello ↔ Pecetto.
Linea 16 (tram): Piazza Castello ↔ Falchera.
Linea 18 (tram): Piazza Castello ↔ Barriera di Milano.
Linea 3 (bus): Collegno ↔ Moncalieri.
Linea 36 (bus): Torino centro ↔ Venaria Reale.
Linea 55 (bus): Torino centro ↔ Rivoli.
Linea 72 (bus): Torino ↔ Chieri.
STAR 1, STAR 2, STAR 3: linee di forza ad alta frequenza nel centro di Torino.
Linee notturne NM1, NM2, NM3, NM4, NM7: attive nei fine settimana di notte.

=== SMART CARD BIP ===
La BIP (Biglietto Integrato Piemonte) è la smart card ricaricabile per i trasporti GTT e di tutto il Piemonte.
Si acquista presso le biglietterie GTT e i punti vendita autorizzati.
Permette di caricare abbonamenti, biglietti e credito scalare.
Validità biglietti caricati su BIP: 730 giorni dall'acquisto.
App To Move: permette di acquistare e usare biglietti digitali direttamente dallo smartphone.

=== PARCHEGGI DI INTERSCAMBIO ===
GTT gestisce parcheggi di interscambio vicino alle stazioni metro per favorire il park & ride.
Principali: Fermi (Collegno), Paradiso, Bengasi, Lingotto.
Tariffe agevolate per chi usa i mezzi pubblici GTT.

=== SERVIZI SPECIALI ===
Servizio a chiamata: disponibile in alcune zone periferiche, prenotabile telefonicamente.
Servizio disabili: tutti i mezzi GTT sono accessibili. Per info: numero verde GTT.
Bici sui mezzi: le biciclette pieghevoli sono ammesse gratuitamente su tutti i mezzi.
Numero verde GTT: 800-019152 (gratuito da rete fissa).
Uffici GTT: Via Fiochetto 14, Torino. Orari: Lun-Ven 8:30-17:00.

=== CONVALIDA E CONTROLLI ===
I biglietti vanno sempre convalidati all'inizio del viaggio nelle apposite macchinette gialle.
I controllori GTT effettuano controlli a bordo. La sanzione per evasione è di 40,00€ + costo biglietto.
Sui tram e bus è obbligatorio convalidare anche in caso di abbonamento BIP (avvicinare la card al lettore).
";

$systemMessages = [
    $knowledgeBase
];
$contextString = implode("\n\n", $systemMessages);

// Istruzioni in base alla lingua validata
$aiInstructions = [
    'it' => "Sei ChatGTT, un assistente virtuale per i trasporti di Torino. Rispondi SEMPRE in italiano.",
    'en' => "You are ChatGTT, a virtual assistant for Turin transport. ALWAYS respond in English.",
    'es' => "Eres ChatGTT, un asistente virtual para el transporte de Turín. Responde SIEMPRE en español.",
    'fr' => "Tu es ChatGTT, un assistant virtuel pour les transports de Turin. Réponds TOUJOURS en français.",
    'de' => "Du bist ChatGTT, ein virtueller Assistent für den Turiner Verkehr. Antworte IMMER auf Deutsch."
];

$selectedInstruction = $aiInstructions[$lang];

$instruction = "
    $selectedInstruction
    Usa le informazioni fornite sopra come knowledge base per rispondere.
    
    REGOLE FONDAMENTALI:
    1. Rispondi ESCLUSIVAMENTE nella lingua " . strtoupper($lang) . ".
    2. Rispondi solo a domande riguardanti i trasporti pubblici di Torino, GTT, biglietti, linee, orari, metro, abbonamenti, BIP, parcheggi, servizi GTT.
    3. Se la domanda non riguarda i trasporti GTT di Torino, rispondi gentilmente che puoi aiutare solo su argomenti GTT.
    4. Tono gentile e sintetico. Risposte brevi e dirette.
    5. Formato: testo semplice, senza markdown (* o #).
    6. Se non conosci la risposta, suggerisci di visitare https://gtt.to.it o chiamare il numero verde 800-019152.
";

$fullPrompt = $contextString . "\n\n" . $instruction . "\n\nUser: " . $userMessage;

$geminiPayload = json_encode([
    "contents" => [
        [
            "parts" => [
                [
                    "text" => $fullPrompt
                ]
            ]
        ]
    ]
]);

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $geminiPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => curl_error($ch)]);
} else {
    echo $response;
}
?>