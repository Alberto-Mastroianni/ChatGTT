async function getAIResponse(prompt) {
    try {

        const stopRegex = /^(\d+)$/i;  // Modificata per intercettare solo numeri isolati (fermata)
        const stopRegex2 = /^(ciao|Ciao|buongiorno|Buongiorno|Hey|hey|Salve|salve)$/;  // Aggiunti ^ e $ per match esatti
        const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata)$/i;  // Aggiunti ^ e $ per match esatti

        if (stopRegex.test(prompt) || stopRegex2.test(prompt) || stopRegex3.test(prompt)) {
            return null;
        }

        const tickets = [
            "Ecco a te la lista dei biglietti urbani:",
            "Biglietto City (2,00€)",
            "MultiCity (11,80€)",
            "Daily (4,50€)",
            "MultiDaily 7 (21,00€)",
            "Biglietto Speciale 'Tour' valido per 48 o 72 ore (9,50€ o 12,50€)",
            "Biglietto Integrato A e B (A = 3,70€ o B = 4,20€)",
            "Biglietto City: Vale per 100 minuti dal momento della convalida compresa una corsa in Metropolitana.",
            "E' utilizzabile solo da una persona e deve essere validato ogni volta che si cambia mezzo.",
            "Il biglietto City caricato su smart card BIP ha validità 730 giorni dal momento dell'acquisto e di 365 giorni se acquistato con app To Move."
        ].join(', ');

        const data = {
            model: "gpt-4o",
            messages: [
                {
                    "role": "system",
                    "content": "Puoi contattarci all'indirizzo e-mail: assistenza@chatgtt.it Proveremo a soddisfare ogni tua richiesta!"
                },
                {
                    "role": "system",
                    "content": "L'idea è nata da un progetto di 5° superiore, realizzato da Alberto Mastroianni e Matteo Licciardino, appartenti all'Istituto tecnico E. Agnelli Indirizzo informatico. In particolare Alberto ha sempre avuto la passione per i mezzi locali, focalizzandosi sull'azienda di trasporti pubblici locali GTT (Gruppo Torinese Trasporti) dove ha mostrato un grande interesse; così ha coinvolto il suo compagno Matteo e insieme hanno tirato fuori un'idea innovativa, che consente di aiutare i torinesi e i turisti a poter usare i servizi pubblici in modo comodo e veloce. Benvenuti su ChatGTT, il vostro aiutante virtuale."
                },
                {
                   "role": "system",
                   "content": tickets
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        }

        let lesponjse;

        await axios.post("https://api.zukijourney.com/v1/chat/completions",data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '2f65474cf2b153f78e026c051d5c6b53c664e0aa07c9f7ee7a2f539fd322783c057108bfe9e7cdb2c44bebb75f136faa71200ec3ceb074f7b23e6be3f6866a08', // Replace with your OpenAI API key
            }
        }).then(response => {
            // Restituisco solo il testo della risposta
            lesponjse = response.data.choices[0].message.content.replace(/<SYSTEM>.*?<\/SYSTEM>|System:|Assistant:/gi, '').replace(/\*\*(.*?)\*\*/g, '$1');
        });
        //console.log(lesponjse);
        return lesponjse;

        } catch (error) {
            console.error("Errore durante la richiesta AI:", error);
            throw new Error("Si è verificato un errore durante la richiesta AI.");
        }
    }
  
  // Funzione per simulare un caricamento con un ritardo
    function simulateLoading(delay) {
        return new Promise(resolve => {
        setTimeout(resolve, delay);
        });
    }
