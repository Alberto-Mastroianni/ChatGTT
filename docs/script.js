const inputField = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');
const clearButton = document.getElementById("clear");
const agreeButton = document.getElementById("agree");
const declineButton = document.getElementById("decline");

// Funzione per ottenere una risposta casuale di ringraziamento
function getRispostaCasuale() {
    return window.translator ? window.translator.getRandomThankYou() : "Prego! Se hai altre domande, sono qui per aiutarti.";
}

// Funzione per aggiungere un nuovo messaggio alla chat
function addMessage(text, isUser) {
    const message = document.createElement('div');
    message.classList.add('message');

    (isUser) ? message.classList.add('user-message') : message.classList.add('bot-message');

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

        // Chiamata alla funzione per ottenere una risposta AI basata sul prompt fornito dall'utente
        getAIResponse(text)
        .then(response => {
            // Aggiungi il messaggio della chatbot solo se la risposta non è null o vuota
            if (response && response.trim() !== "") {
                addMessage(response, false);
            }
        })
         .catch(error => {
            console.error("Errore durante la richiesta alla AI:", error);
        });

        input.value = '';
    }
}

function simulateBotResponse() {
    const chatBody = document.querySelector('.chat-body');

    // Controlla se ci sono già messaggi nel chatBody
    if (chatBody.children.length === 0) {
        // Aggiungi un messaggio di caricamento con puntini
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        // Aggiungi l'animazione dei puntini di caricamento
        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        // Inizia l'animazione dei puntini di caricamento
        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) {
                loadingDots.textContent = "";
            }
        }, 500); // Cambia la velocità degli aggiornamenti dei puntini a tua discrezione

        // Aggiungi un ritardo prima di visualizzare il messaggio del bot
        setTimeout(() => {
            // Interrompi l'animazione dei puntini di caricamento
            clearInterval(dotsInterval);

            // Rimuovi il messaggio di caricamento
            chatBody.removeChild(loadingMessage);

            // Aggiungi il messaggio del bot reale
            const botResponse = window.translator ? window.translator.get('welcomeMessage') : "Ciao! Io sono ChatGTT, come posso aiutarti?";
            addMessage(botResponse, false);
        }, 1300); 
        
        setTimeout(() => {
            const tryStopMsg = window.translator ? window.translator.get('tryStopNumber') : "Prova a digitare il numero della tua fermata per vedere quando passa il tuo bus o tram";
            addMessage(tryStopMsg, false);
        }, 2300); // Ritardo di 1 secondo (puoi regolare il valore in base alle tue esigenze)  
    }

    // Analizza l'input dell'utente per identificare la richiesta sulla fermata
    const stopRegex = /^(\d+)$/i;  // Modificata per intercettare solo numeri isolati
    const stopRegex2 = /^(ciao|Ciao|buongiorno|Buongiorno|Hey|hey|Salve|salve)$/;  // Match esatti
    const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata)$/i;  // Match esatti
    const match = inputField.value.trim().match(stopRegex);
    const match2 = inputField.value.trim().match(stopRegex2);
    const match3 = inputField.value.trim().match(stopRegex3);

    const rispostaCasuale = getRispostaCasuale();

    if(match3){
        // Aggiungi un messaggio di caricamento con puntini
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        // Aggiungi l'animazione dei puntini di caricamento
        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        // Inizia l'animazione dei puntini di caricamento
        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) {
                loadingDots.textContent = "";
            }
        }, 500); // Cambia la velocità degli aggiornamenti dei puntini a tua discrezione

        setTimeout(() => {
            // Interrompi l'animazione dei puntini di caricamento
            clearInterval(dotsInterval);

            // Rimuovi il messaggio di caricamento
            chatBody.removeChild(loadingMessage);

            addMessage(rispostaCasuale, false);
        }, 1500); // Ritardo di 1 secondo (puoi regolare il valore in base alle tue esigenze)
    }

    if(match2){
        // Aggiungi un messaggio di caricamento con puntini
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        // Aggiungi l'animazione dei puntini di caricamento
        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        // Inizia l'animazione dei puntini di caricamento
        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) {
                loadingDots.textContent = "";
            }
        }, 500);

        setTimeout(() => {
            // Interrompi l'animazione dei puntini di caricamento
            clearInterval(dotsInterval);

            // Rimuovi il messaggio di caricamento
            chatBody.removeChild(loadingMessage);

            const botIntro = window.translator ? window.translator.get('botIntro') : "Salve, sono un bot con IA e sono qui per darti una mano su tutta la rete di Torino";
            addMessage(botIntro, false);
        }, 1500); // Ritardo di 1 secondo (puoi regolare il valore in base alle tue esigenze)

        setTimeout(() => {
            const creators = window.translator ? window.translator.get('creators') : "Sono stato creato da due ragazzi di 5° superiore, Alberto Mastroianni e Matteo Licciardino";
            addMessage(creators, false);
        }, 2000); // Ritardo di 1 secondo (puoi regolare il valore in base alle tue esigenze)    

        setTimeout(() => {
            const enterStop = window.translator ? window.translator.get('enterStopNumber') : "Scrivi il numero della fermata, vediamo quando passa il tuo bus o tram";
            addMessage(enterStop, false);
        }, 4000);
    }

    if (match) {
        // Aggiungi un messaggio di caricamento con puntini
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        // Aggiungi l'animazione dei puntini di caricamento
        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        // Inizia l'animazione dei puntini di caricamento
        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) {
                loadingDots.textContent = "";
            }
        }, 500);

        const stopNumber = match[1];
        const busInfoUrl = getBusInfoUrl(stopNumber);

        // Effettua una richiesta AJAX per ottenere i dati dalla tua API
        fetch(busInfoUrl)
        .then(response => response.json())
        .then(data => {
            const busInfoMessage = window.translator ? window.translator.formatSchedule(JSON.stringify(data)) : formattaOrari(JSON.stringify(data), inputField);
            setTimeout(() => {
                // Interrompi l'animazione dei puntini di caricamento
                clearInterval(dotsInterval);

                // Rimuovi il messaggio di caricamento
                chatBody.removeChild(loadingMessage);

                const busesAtStop = window.translator ? window.translator.get('busesAtStop') : "Ecco i bus che passano nella fermata";
                addMessage(`${busesAtStop} ${stopNumber}:`, false);
            }, 500); // Ritardo di 1 secondo (puoi regolare il valore in base alle tue esigenze)

            setTimeout(() => {
                if(busInfoMessage == ""){
                    setTimeout(() => {
                        const wrongStop = window.translator ? window.translator.get('wrongStopNumber') : "Hai sbagliato inserire il numero della fermata!";
                        addMessage(wrongStop, false);
                    }, 250);

                    setTimeout(() => {
                        const retryStop = window.translator ? window.translator.get('retryStopNumber') : "Riprova a inserire correttamente il numero della fermata!";
                        addMessage(retryStop, false);
                    }, 900);
                } else {
                    addMessage(busInfoMessage, false);
                }
            }, 1500); // Ritardo di 1 secondo (puoi regolare il valore in base alle tue esigenze)
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
            // Determina il simbolo in base al valore di "realtime"
            const spunta = orario.realtime ? '✔️' : '❌';
            // Crea una stringa per ciascun orario
            return `Linea: ${orario.line} - Ora: ${orario.hour} - In tempo reale: ${spunta}`;
        }).join('\n'); // Unisci gli elementi in una singola stringa

        return orariFormattati;
    } catch (errore) {
        console.error("Errore durante il parsing degli orari JSON:", errore);
        return "Errore durante il parsing degli orari JSON.";
    }
}

// Chiamata alla funzione simulateBotResponse quando la pagina viene caricata
window.onload = function() { 
    // Inizializza l'interfaccia con le traduzioni
    if (window.translator) {
        window.translator.updateInterface();
    }
    simulateBotResponse(""); 
};

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
    let confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'block';
})

agreeButton.addEventListener("click", () => {
    // Cancellare i messaggi
    let chatBody = document.querySelector('.chat-body');

    // Rimuovi tutti i messaggi
    while (chatBody.firstChild) {
        chatBody.removeChild(chatBody.firstChild);
    }

    simulateBotResponse()

    // Nascondi il box di conferma
    let confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'none';
})

declineButton.addEventListener("click", () => {
    // Nascondi il box di conferma
    let confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'none';
})


// Funzione per controllare se il dispositivo è in modalità ritratto
function controllaOrientamento() {
    // Verifica se il dispositivo non è un desktop
    if (window.matchMedia("(pointer: coarse)").matches) {
        // Verifica se il dispositivo è in modalità ritratto
        if (window.matchMedia("(orientation: landscape)").matches) {
            // Mostra il messaggio se il dispositivo è in modalità ritratto
            document.querySelector('.rotate-message').style.display = 'block';
        } else {
            // Nasconde il messaggio se il dispositivo non è in modalità ritratto
            document.querySelector('.rotate-message').style.display = 'none';
        }
    } else {
        // Nasconde il messaggio se il dispositivo è un desktop
        document.querySelector('.rotate-message').style.display = 'none';
    }
}

// Esegui la funzione al cambio di orientamento del dispositivo
window.addEventListener('resize', controllaOrientamento);
window.addEventListener('DOMContentLoaded', controllaOrientamento); // Esegui la funzione al caricamento della pagina

// Funzione per verificare se il dispositivo è uno smartphone
function isSmartphone() {
    // Controlla se la larghezza dello schermo è inferiore a 768px (tipico per smartphone)
    // e se il dispositivo ha un puntatore "coarse" (touch screen)
    return window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches;
}

// Funzione per nascondere il cestino
function hideClearButton() {
    if (isSmartphone()) {
        clearButton.style.display = 'none';
    }
}

// Funzione per mostrare il cestino
function showClearButton() {
    if (isSmartphone()) {
        clearButton.style.display = 'block';
    }
}

// Nascondi il cestino quando l'input è in focus (utente sta scrivendo)
inputField.addEventListener('focus', hideClearButton);

// Mostra il cestino quando l'input perde il focus (utente smette di scrivere)
inputField.addEventListener('blur', showClearButton);

// Mostra il cestino dopo aver inviato il messaggio
sendButton.addEventListener('click', showClearButton);
