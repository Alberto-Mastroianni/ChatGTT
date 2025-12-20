async function getAIResponse(prompt) {
    try {
        // Ho corretto la sintassi delle Regex che avevano qualche errore di battitura
        const stopRegex = /^(\d+)$/i;
        const stopRegex2 = /^(ciao|buongiorno|hey|salve)$/i;
        const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata)$/i;

        // Controllo se il prompt corrisponde alle parole di stop
        if (stopRegex.test(prompt) || stopRegex2.test(prompt) || stopRegex3.test(prompt)) {
            return null;
        }

        const ticketsInfo = [
            "Ecco la lista dei biglietti urbani e le loro caratteristiche:",
            "Biglietto City: Costo 2,00€.",
            "Valido per 100 minuti dalla convalida, include una corsa in Metropolitana. Utilizzabile da una sola persona e deve essere validato ad ogni cambio mezzo. Validità su smart card BIP: 730 giorni dall'acquisto. Validità con app To Move: 365 giorni dall'acquisto.",
            "MultiCity: Costo 11,80€.",
            "Daily: Costo 4,50€.",
            "MultiDaily 7: Costo 21,00€.",
            "Biglietto Speciale 'Tour': Valido per 48 ore a 9,50€ o per 72 ore a 12,50€.",
            "Biglietto Integrato A e B: Biglietto Integrato A costa 3,70€. Biglietto Integrato B costa 4,20€."
        ];
        
        const ticketsContext = ticketsInfo.join('\n');

        const systemMessages = [
            "Puoi contattarci all'indirizzo e-mail: assistenza@chatgtt.it Proveremo a soddisfare ogni tua richiesta!",
            "L'idea è nata da un progetto di 5° superiore, realizzato da Alberto Mastroianni e Matteo Licciardino. Benvenuti su ChatGTT, il vostro aiutante virtuale.",
            ticketsContext 
        ];

        // --- QUI ABBIAMO AGGIUNTO L'ISTRUZIONE PER LA LINGUA ---
        const instruction = `
            Sei ChatGTT, un assistente virtuale per i trasporti di Torino.
            Usa le informazioni fornite sopra (CONTESTO) per rispondere alla domanda dell'utente.
            
            REGOLE FONDAMENTALI:
            1. Rileva la lingua dell'utente. Rispondi ESCLUSIVAMENTE nella stessa lingua dell'utente (Italiano, Inglese, Francese, Spagnolo, ecc.).
            2. Se l'utente chiede il prezzo di un biglietto specifico, rispondi SOLO con quel prezzo e le sue caratteristiche. NON elencare tutti gli altri biglietti o i creatori del progetto se non richiesto.
            3. Se l'utente chiede chi ha creato il progetto o l'email, usa le informazioni dei creatori.
            4. Tono gentile e sintetico.
            5. Formato: testo semplice, senza markdown (* o #).
        `;
        
        const fullPrompt = systemMessages.join('\n\n') + '\n\n' + instruction + '\n\nUser: ' + prompt;

        const data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": fullPrompt
                        }
                    ]
                }
            ]
        };

        let responseText;

        // Ricorda di inserire la TUA chiave API qui sotto al posto di 'LA_TUA_NUOVA_API_KEY'
        await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': 'AIzaSyAhaqPUhCKF3ZeotLLRoBhuwshQZ65YsM4', 
                }
            }
        ).then(response => {
            if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
                responseText = response.data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Risposta non valida dall'API Gemini.");
            }
        });

        let cleanedResponse = responseText.replace(/\*\*|__|\*|_/g, '');
        cleanedResponse = cleanedResponse.replace(/^[*-]\s*|^\+\s*|^#+\s*/gm, '');

        return cleanedResponse;

    } catch (error) {
        console.error("Errore durante la richiesta AI:", error.response ? error.response.data : error.message);
        throw new Error("Si è verificato un errore durante la richiesta AI.");
    }
}

function simulateLoading(delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}
