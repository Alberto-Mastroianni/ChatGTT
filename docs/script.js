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
        }, 500);

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
        }, 2300); 
    }

    // Analizza l'input dell'utente
    const stopRegex = /^(\d+)$/i;  
    const stopRegex2 = /^(ciao|buongiorno|hey|salve)$/i; // Regex ottimizzata
    const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata)$/i;  
    
    const inputValue = inputField.value.trim();
    const match = inputValue.match(stopRegex);
    const match2 = inputValue.match(stopRegex2);
    const match3 = inputValue.match(stopRegex3);

    const rispostaCasuale = getRispostaCasuale();

    if(match3){
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) {
                loadingDots.textContent = "";
            }
        }, 500); 

        setTimeout(() => {
            clearInterval(dotsInterval);
            chatBody.removeChild(loadingMessage);
            addMessage(rispostaCasuale, false);
        }, 1500); 
    }

    if(match2){
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) {
                loadingDots.textContent = "";
            }
        }, 500);

        setTimeout(() => {
            clearInterval(dotsInterval);
            chatBody.removeChild(loadingMessage);
            const botIntro = window.translator ? window.translator.get('botIntro') : "Salve, sono un bot con IA e sono qui per darti una mano su tutta la rete di Torino";
            addMessage(botIntro, false);
        }, 1500); 

        setTimeout(() => {
            const creators = window.translator ? window.translator.get('creators') : "Sono stato creato da due ragazzi di 5° superiore, Alberto Mastroianni e Matteo Licciardino";
            addMessage(creators, false);
        }, 2000);   

        setTimeout(() => {
            const enterStop = window.translator ? window.translator.get('enterStopNumber') : "Scrivi il numero della fermata, vediamo quando passa il tuo bus o tram";
            addMessage(enterStop, false);
        }, 4000);
    }

    if (match) {
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) {
                loadingDots.textContent = "";
            }
        }, 500);

        const stopNumber = match[1];
        const busInfoUrl = getBusInfoUrl(stopNumber);

        fetch(busInfoUrl)
        .then(response => response.json())
        .then(data => {
            const busInfoMessage = window.translator ? window.translator.formatSchedule(JSON.stringify(data)) : formattaOrari(JSON.stringify(data), inputField);
            setTimeout(() => {
                clearInterval(dotsInterval);
                chatBody.removeChild(loadingMessage);

                const busesAtStop = window.translator ? window.translator.get('busesAtStop') : "Ecco i bus che passano nella fermata";
                addMessage(`${busesAtStop} ${stopNumber}:`, false);
            }, 500); 

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
            }, 1500); 
        })
        .catch(error => {
            console.error('Errore durante la richiesta API:', error);
        });
    }
}

function formattaOrari(orariTestuali) {
    try {
        const orariArray = JSON.parse(orariTestuali);

       const orariFormattati = orariArray.map(orario => {
            const spunta = orario.realtime ? '✔️' : '❌';
            return `Linea: ${orario.line} - Ora: ${orario.hour} - In tempo reale: ${spunta}`;
        }).join('\n'); 

        return orariFormattati;
    } catch (errore) {
        console.error("Errore durante il parsing degli orari JSON:", errore);
        return "Errore durante il parsing degli orari JSON.";
    }
}

window.onload = function() { 
    if (window.translator) {
        window.translator.updateInterface();
    }
    simulateBotResponse(""); 
};

function getBusInfoUrl(stopNumber) {return `https://gpa.madbob.org/query.php?stop=${stopNumber}`;}

inputField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') sendMessage();
});

sendButton.addEventListener('click', () => {sendMessage();});

clearButton.addEventListener("click", () => {
    let confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'block';
})

agreeButton.addEventListener("click", () => {
    let chatBody = document.querySelector('.chat-body');
    
    // Ottimizzato la cancellazione dei messaggi
    chatBody.innerHTML = '';

    simulateBotResponse()

    let confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'none';
})

declineButton.addEventListener("click", () => {
    let confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'none';
})


function controllaOrientamento() {
    if (window.matchMedia("(pointer: coarse)").matches) {
        if (window.matchMedia("(orientation: landscape)").matches) {
            document.querySelector('.rotate-message').style.display = 'block';
        } else {
            document.querySelector('.rotate-message').style.display = 'none';
        }
    } else {
        document.querySelector('.rotate-message').style.display = 'none';
    }
}

window.addEventListener('resize', controllaOrientamento);
window.addEventListener('DOMContentLoaded', controllaOrientamento); 

function isSmartphone() {
    return window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches;
}

function hideClearButton() {
    if (isSmartphone()) {
        clearButton.style.display = 'none';
    }
}

function showClearButton() {
    if (isSmartphone()) {
        clearButton.style.display = 'block';
    }
}

inputField.addEventListener('focus', hideClearButton);
inputField.addEventListener('blur', showClearButton);
sendButton.addEventListener('click', showClearButton);

document.addEventListener('DOMContentLoaded', () => {
    // Seleziona gli elementi dal DOM
    const btnCerchio = document.querySelector('.btn-cerchio');
    const sidebar = document.getElementById('mySidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('closeSidebar');

    // Funzione per aprire la sidebar
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }

    // Funzione per chiudere la sidebar
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    // Event listener per aprire
    btnCerchio.addEventListener('click', openSidebar);

    // Event listener per chiudere (cliccando sulla X o fuori dalla sidebar)
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
});

// --- GESTIONE TEMA CHIARO/SCURO ---
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('checkbox-theme');
    
    // Controlla se c'è un tema salvato precedentemente nella memoria del browser
    const currentTheme = localStorage.getItem('theme');

    // Se esiste, applicalo subito al caricamento
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'dark-theme') {
            themeToggle.checked = true;
        }
    }

    // Ascolta i cambiamenti dell'interruttore
    themeToggle.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme'); // Salva preferenza scura
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light-theme'); // Salva preferenza chiara
        }
    });
});
