const inputField = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');
const clearButton = document.getElementById("clear");
const agreeButton = document.getElementById("agree");
const declineButton = document.getElementById("decline");

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
        const botResponse = "Ciao! Io sono ChatGTT";
        addMessage(botResponse, false);
    }

    // Analizza l'input dell'utente per identificare la richiesta sulla fermata
    const stopRegex = /(\d+)/i;
    const stopRegex2 = /(ciao|Ciao|buongiorno|Buongiorno)/;
    const match = inputField.value.trim().match(stopRegex);
    const match2 = inputField.value.trim().match(stopRegex2);

    if(match2){
        addMessage("Salve utente!", false);
        addMessage("Come posso aiutarti?", false);
    }

    if (match) {
        const stopNumber = match[1];
        const busInfoUrl = getBusInfoUrl(stopNumber);

        // Effettua una richiesta AJAX per ottenere i dati dalla tua API
        fetch(busInfoUrl)
        .then(response => response.json())
        .then(data => {
            const busInfoMessage = formattaOrari(JSON.stringify(data), inputField);
            addMessage(`Ecco a te i bus che passano nella fermata ${stopNumber}:`, false);
            addMessage(busInfoMessage, false);
        })
        .catch(error => {
            console.error('Errore durante la richiesta API:', error);
        });
    }
}

// Funzione per formattare gli orari in modo più pulito
function formattaOrari(orariTestuali) {
    try {
        const orariArray = JSON.parse(orariTestuali);

        const orariFormattati = orariArray.map(orario => {
            // Crea una stringa per ciascun orario
            return `Linea: ${orario.line} - Ora: ${orario.hour} - In tempo reale: ${orario.realtime}`;
        }).join('\n'); // Unisci gli elementi in una singola stringa

        return orariFormattati;
    } catch (errore) {
        console.error("Errore durante il parsing degli orari JSON:", errore);
        return "Errore durante il parsing degli orari JSON.";
    }
}

// Chiamata alla funzione simulateBotResponse quando la pagina viene caricata
window.onload = function() { simulateBotResponse(""); };

// Funzione per ottenere l'URL con le informazioni sui bus per una fermata specifica
function getBusInfoUrl(stopNumber) {return `https://gpa.madbob.org/query.php?stop=${stopNumber}`;}

// Aggiungi gli event listeners all'input della chat e al pulsante di invio
inputField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') sendMessage();
});

sendButton.addEventListener('click', () => {sendMessage();});

// Pulire la chat tra il bot e l'utente 
clearButton.addEventListener("click", () => {
    // Visualizza il box di conferma personalizzato
    var confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'block';
})

agreeButton.addEventListener("click", () => {
    // Cancellare i messaggi
    var chatBody = document.querySelector('.chat-body');

    // Rimuovi tutti i messaggi
    while (chatBody.firstChild) {
        chatBody.removeChild(chatBody.firstChild);
    }

    simulateBotResponse()

    // Nascondi il box di conferma
    var confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'none';
})

declineButton.addEventListener("click", () => {
    // Nascondi il box di conferma
    var confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'none';
})