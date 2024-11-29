async function getAIResponse(prompt) {
    try {
        // Controllo se l'utente chiede assistenza
        if (prompt.toLowerCase().includes("assistenza")) {
            // Simulo un caricamento con un ritardo di 2 secondi
            await simulateLoading(2000);
            return "Puoi contattarci all'indirizzo e-mail: assistenza@chatgtt.it Proveremo a soddisfare ogni tua richiesta!";
        }
        if (prompt.toLowerCase().includes("bigliett")) { // se l'utente scrive biglietto o biglietti
             await simulateLoading(2000);
             const messages = [
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
            ];

            return messages.join(', ').replaceAll(", ", "\n")
         }
      
      // Altrimenti, utilizzo OpenAI per ottenere una risposta
      /*const response = await openai.chatCompletion.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "user",
            "content": prompt
          }
        ],
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });*/
        const data = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": "L'idea è nata da un progetto di 5° superiore, realizzato da Alberto Mastroianni e Matteo Licciardino, appartenti all'Istituto tecnico E. Agnelli Indirizzo informatico. In particolare Alberto ha sempre avuto la passione per i mezzi locali, focalizzandosi sull'azienda di trasporti pubblici locali GTT (Gruppo Torinese Trasporti) dove ha mostrato un grande interesse; così ha coinvolto il suo compagno Matteo e insieme hanno tirato fuori un'idea innovativa, che consente di aiutare i torinesi e i turisti a poter usare i servizi pubblici in modo comodo e veloce. Benvenuti su ChatGTT, il vostro aiutante virtuale."
                },
/*                {
                   "role": "system",
                     "content": "Ecco a te la lista dei biglietti urbani: Biglietto City (2,00€). MultiCity (11,80€). Daily (4,50€). MultiDaily 7 (21,00€). Biglietto Speciale 'Tour' valido per 48 o 72 ore (9,50€ o 12,50€). Biglietto Integrato A e B (A = 3,70€ o B = 4,20€). Biglietto City: Vale per 100 minuti dal momento della convalida compresa una corsa in Metropolitana e' utilizzabile solo da una persona e deve essere validato ogni volta che si cambia mezzo. Il biglietto City caricato su smart card BIP ha validità 730 giorni dal momento dell'acquisto e di 365 giorni se acquistato con app To Move."
                },*/
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
                'Authorization': 'Bearer zu-1cb96e195fbc12e7e840af310806a242', // Replace with your OpenAI API key
            }
        }).then(response => {
            // Restituisco solo il testo della risposta
            lesponjse = response.data.choices[0].message.content;

        });
        await simulateLoading(2000);
        console.log(lesponjse);
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