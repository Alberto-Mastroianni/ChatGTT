// openai.js

const gpt3 = new OpenAI.GPT("sk-proj-yZsCUovuryINpVyIlBhQT3BlbkFJ0msDlr63W9dBuRYpit04");

// Funzione per inviare una richiesta al modello GPT-3 e ottenere una risposta
async function getAIResponse(prompt) {
    const response = await gpt3.complete({
        engine: "davinci", // Puoi scegliere diversi engine e modelli di linguaggio
        prompt: prompt,
        max_tokens: 150 // Lunghezza massima della risposta
    });
    return response.data.choices[0].text.trim();
}
