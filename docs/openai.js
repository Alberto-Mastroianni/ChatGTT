async function getAIResponse(prompt) {
    try {
        // Rileva la lingua dell'utente
        const detectedLang = window.translator ? window.translator.detectLanguage(prompt) : 'it';
        const langChanged = window.translator && detectedLang !== window.translator.currentLanguage;
        
        if (langChanged) {
            window.translator.currentLanguage = detectedLang;
            window.translator.updateInterface();
        }
        
        // Ho corretto la sintassi delle Regex che avevano qualche errore di battitura
        const stopRegex = /^(\d+)$/i;
        const stopRegex2 = /^(ciao|buongiorno|hey|salve|hello|hi|hola|salut|bonjour|hallo)$/i;
        const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata|thank|thanks|gracias|merci|danke)$/i;

        // Controllo se il prompt corrisponde alle parole di stop
        if (stopRegex.test(prompt) || stopRegex2.test(prompt) || stopRegex3.test(prompt)) {
            return null;
        }
        
        // Prova prima con risposte offline
        if (window.translator) {
            const offlineResponse = window.translator.getOfflineResponse(prompt);
            if (offlineResponse) {
                return offlineResponse;
            }
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

        // Traduzioni per le istruzioni AI in base alla lingua rilevata
        const aiInstructions = {
            it: `Sei ChatGTT, un assistente virtuale per i trasporti di Torino. Rispondi SEMPRE in italiano.`,
            en: `You are ChatGTT, a virtual assistant for Turin transport. ALWAYS respond in English.`,
            es: `Eres ChatGTT, un asistente virtual para el transporte de Turin. Responde SIEMPRE en español.`,
            fr: `Tu es ChatGTT, un assistant virtuel pour les transports de Turin. Réponds TOUJOURS en français.`,
            de: `Du bist ChatGTT, ein virtueller Assistent für den Turiner Verkehr. Antworte IMMER auf Deutsch.`
        };
        
        const currentLang = window.translator ? window.translator.currentLanguage : 'it';
        const instruction = `
            ${aiInstructions[currentLang] || aiInstructions['it']}
            Usa le informazioni fornite sopra (CONTESTO) per rispondere alla domanda dell'utente.
            
            REGOLE FONDAMENTALI:
            1. Rispondi ESCLUSIVAMENTE nella lingua ${currentLang.toUpperCase()}.
            2. Se l'utente chiede il prezzo di un biglietto specifico, rispondi SOLO con quel prezzo e le sue caratteristiche.
            3. Se l'utente chiede chi ha creato il progetto o l'email, usa le informazioni dei creatori.
            4. Tono gentile e sintetico.
            5. Formato: testo semplice, senza markdown (* o #).
            6. Se l'utente scrive solo un numero (fermata), non rispondere - il sistema gestirà automaticamente.
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

        // Aggiungi delay più lungo per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Ricorda di inserire la TUA chiave API qui sotto al posto di 'LA_TUA_NUOVA_API_KEY'
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': CONFIG.API_KEY, 
                },
                timeout: 10000
            }
        );

        if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
            responseText = response.data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Risposta non valida dall'API Gemini.");
        }

        let cleanedResponse = responseText.replace(/\*\*|__|\*|_/g, '');
        cleanedResponse = cleanedResponse.replace(/^[*-]\s*|^\+\s*|^#+\s*/gm, '');

        return cleanedResponse;

    } catch (error) {
        console.error("Errore durante la richiesta AI:", error);
        
        // Gestione errori specifici con fallback
        if (error.response && error.response.status === 429) {
            // Mostra il selettore lingua quando l'API è limitata
            if (window.translator && !document.querySelector('.language-selector')) {
                window.translator.createLanguageSelector();
            }
            
            // Fallback con risposte predefinite multilingue
            const fallbackResponses = {
                it: "Mi dispiace, ho raggiunto il limite di richieste API per oggi. Puoi usare il selettore lingua (bandiera) per cambiare lingua e continuare a usare il bot con risposte offline. Prova a scrivere 'biglietti' o il numero di una fermata.",
                en: "Sorry, I've reached the API request limit for today. You can use the language selector (flag) to change language and continue using the bot with offline responses. Try writing 'tickets' or a stop number.",
                es: "Lo siento, he alcanzado el límite de solicitudes de API por hoy. Puedes usar el selector de idioma (bandera) para cambiar idioma y seguir usando el bot con respuestas offline. Prueba escribiendo 'billetes' o un número de parada.",
                fr: "Désolé, j'ai atteint la limite de requêtes API pour aujourd'hui. Vous pouvez utiliser le sélecteur de langue (drapeau) pour changer de langue et continuer à utiliser le bot avec des réponses hors ligne. Essayez d'écrire 'billets' ou un numéro d'arrêt.",
                de: "Entschuldigung, ich habe das API-Anfragenlimit für heute erreicht. Sie können den Sprachselektor (Flagge) verwenden, um die Sprache zu ändern und den Bot mit Offline-Antworten weiter zu nutzen. Versuchen Sie 'Tickets' oder eine Haltestellen-Nummer zu schreiben."
            };
            
            const currentLang = window.translator ? window.translator.currentLanguage : 'it';
            return fallbackResponses[currentLang] || fallbackResponses['it'];
        }
        
        if (error.code === 'ECONNABORTED') {
            const timeoutResponses = {
                it: "La richiesta ha impiegato troppo tempo. Riprova.",
                en: "The request took too long. Please try again.",
                es: "La solicitud tardó demasiado. Inténtalo de nuevo.",
                fr: "La requête a pris trop de temps. Veuillez réessayer.",
                de: "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut."
            };
            
            const currentLang = window.translator ? window.translator.currentLanguage : 'it';
            return timeoutResponses[currentLang] || timeoutResponses['it'];
        }
        
        const errorResponses = {
            it: "Mi dispiace, si è verificato un errore temporaneo. Posso comunque aiutarti con informazioni sui trasporti. Prova a scrivere il numero di una fermata.",
            en: "Sorry, a temporary error occurred. I can still help you with transport information. Try writing a stop number.",
            es: "Lo siento, ocurrió un error temporal. Aún puedo ayudarte con información de transporte. Prueba escribiendo un número de parada.",
            fr: "Désolé, une erreur temporaire s'est produite. Je peux encore vous aider avec les informations de transport. Essayez d'écrire un numéro d'arrêt.",
            de: "Entschuldigung, ein temporärer Fehler ist aufgetreten. Ich kann Ihnen trotzdem mit Verkehrsinformationen helfen. Versuchen Sie eine Haltestellen-Nummer zu schreiben."
        };
        
        const currentLang = window.translator ? window.translator.currentLanguage : 'it';
        return errorResponses[currentLang] || errorResponses['it'];
    }
}

function simulateLoading(delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}
