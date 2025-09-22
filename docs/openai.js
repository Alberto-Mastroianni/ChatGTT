async function getAIResponse(prompt) {
    try {
        const stopRegex = /^(\d+)$/i;
        const stopRegex2 = /^(ciao|Ciao|buongiorno|Buongiorno|Hey|hey|Salve|salve)$/;
        const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata)$/i;

        if (stopRegex.test(prompt) || stopRegex2.test(prompt) || stopRegex3.test(prompt)) {
            return null;
        }

        // Modificato l'array 'tickets' per essere più descrittivo e per fornire una chiara struttura all'AI
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
        
        // Unisci le informazioni sui biglietti per darle come contesto all'AI
        const ticketsContext = ticketsInfo.join('\n'); // Unisci con un newline per mantenere la separazione delle righe

        const systemMessages = [
            "Puoi contattarci all'indirizzo e-mail: assistenza@chatgtt.it Proveremo a soddisfare ogni tua richiesta!",
            "L'idea è nata da un progetto di 5° superiore, realizzato da Alberto Mastroianni e Matteo Licciardino, appartenti all'Istituto tecnico E. Agnelli Indirizzo informatico. In particolare Alberto ha sempre avuto la passione per i mezzi locali, focalizzandosi sull'azienda di trasporti pubblici locali GTT (Gruppo Torinese Trasporti) dove ha mostrato un grande interesse; così ha coinvolto il suo compagno Matteo e insieme hanno tirato fuori un'idea innovativa, che consente di aiutare i torinesi e i turisti a poter usare i servizi pubblici in modo comodo e veloce. Benvenuti su ChatGTT, il vostro aiutante virtuale.",
            ticketsContext // Ora passi il contesto dei biglietti qui
        ];

        // Istruzione più specifica per la formattazione desiderata
        const instruction = "Le risposte devono essere in testo semplice, formattate come un elenco chiaro e leggibile riga per riga, senza alcun carattere markdown (come asterischi, trattini, hash, ecc.) per grassetti, elenchi o titoli. Ogni voce dell'elenco deve essere su una nuova riga.";
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

        await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': 'AIzaSyASjUG_-MfRv3Uri6syV3Y3Q2mvJ1f_1Co',
                }
            }
        ).then(response => {
            if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0]) {
                responseText = response.data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Risposta non valida dall'API Gemini.");
            }
        });

        // La post-elaborazione rimane utile come "ultima difesa"
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
