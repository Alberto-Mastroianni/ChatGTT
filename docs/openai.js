const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.sk-proj-GkqoCy0IHLTHnkA2iOqKT3BlbkFJektO7FQh34pMZsse1623,
});

async function getAIResponse(prompt) {
    try {
      // Controllo se l'utente chiede assistenza
      if (prompt.toLowerCase().includes("assistenza")) {
        // Simulo un caricamento con un ritardo di 2 secondi
        await simulateLoading(2000);
        return "Puoi contattarci all'indirizzo e-mail: assistenza@chatgtt.it. Proveremo a soddisfare ogni tua richiesta!";
      }
      if (prompt.toLowerCase().includes("info")) {
        // Simulo un caricamento con un ritardo di 2 secondi
        await simulateLoading(2000);
        // Restituisci una risposta di informazioni
        return "L'idea è nata da un progetto di 5^ superiore, realizzato da Alberto Mastroianni e Matteo Licciardino, appartenti all'Istituto tecnico E. Agnelli Indirizzo informatico. In particolare Alberto ha sempre avuto la passione per i mezzi locali, focalizzandosi sull'azienda di trasporti pubblici locali GTT (Gruppo Torinese Trasporti) dove ha mostrato un grande interesse; così ha coinvolto il suo compagno Matteo e insieme hanno tirato fuori un'idea innovativa, che consente di aiutare i torinesi e i turisti a poter usare i servizi pubblici in modo comodo e veloce. Benvenuti su ChatGTT, il vostro aiutante virtuale. ";
      }
      
      // Altrimenti, utilizzo OpenAI per ottenere una risposta
      const response = await openai.chatCompletion.create({
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
      });
      
      // Simulo un caricamento con un ritardo di 2 secondi
      await simulateLoading(2000);
      
      // Restituisco solo il testo della risposta
      return response.data.choices[0].message.content;
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
    
