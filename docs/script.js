const inputField = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');

// Funzione per aggiungere un nuovo messaggio alla chat
function addMessage(text, isUser) {
    const message = document.createElement('div');
    message.classList.add('message');

    (isUser) ? message.classList.add('user-message') : message.classList.add('bot-message'); // Aggiungi questa classe per i messaggi della chatbot

    message.textContent = text;

    const chatBody = document.querySelector('.chat-body');
    chatBody.appendChild(message);

    // Scorri fino in fondo alla chat per mostrare l'ultimo messaggio
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Funzione per gestire l'invio di un messaggio
function sendMessage() {
    const input = document.querySelector('.chat-input input');
    const text = input.value.trim();

    if (text) {
        addMessage(text, true);

        // Simula la risposta della chatbot
        simulateBotResponse(text);

        input.value = '';
    }
}

function simulateBotResponse() {
    const chatBody = document.querySelector('.chat-body');

    // Controlla se ci sono già messaggi nel chatBody
    if (chatBody.children.length === 0) {
        const botResponse = "Ciao! Io sono ChatGTT come posso aiutarti?";
        addMessage(botResponse, false);
    }
}

// Chiamata alla funzione simulateBotResponse quando la pagina viene caricata
window.onload = function() { simulateBotResponse(); };

// Aggiungi gli event listeners all'input della chat e al pulsante di invio
inputField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') sendMessage();
});

sendButton.addEventListener('click', () => {sendMessage();});