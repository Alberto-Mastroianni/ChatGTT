const inputField = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');
const clearButton = document.getElementById("clear");
const agreeButton = document.getElementById("agree");
const declineButton = document.getElementById("decline");

// --- STATO CONVERSAZIONE PER RICERCA PER LINEA ---
let gtfsData = null;
let convState = null; // null | {step:'awaiting_line'} | {step:'awaiting_stop', line, stops} | {step:'awaiting_dir', line, stopCode, stopName, dirs}

async function loadGtfsData() {
    if (gtfsData) return gtfsData;
    try {
        const r = await fetch('gtfs-data.json');
        gtfsData = await r.json();
    } catch(e) { gtfsData = {}; }
    return gtfsData;
}

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
        simulateBotResponse(text, text);

        // Chiamata AI solo se NON siamo in un flusso strutturato
        if (!convState) {
            getAIResponse(text)
            .then(response => {
                if (response && response.trim() !== "") {
                    addMessage(response, false);
                }
            })
            .catch(error => {
                console.error("Errore durante la richiesta alla AI:", error);
            });
        }

        input.value = '';
    }
}

// Aggiunge un messaggio bot con HTML (per tabelle ecc.)
function addMessageHTML(html) {
    const message = document.createElement('div');
    message.classList.add('message', 'bot-message');
    message.innerHTML = html;
    const chatBody = document.querySelector('.chat-body');
    chatBody.appendChild(message);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Aggiunge pulsanti di scelta alla chat
function addButtons(buttons) {
    const chatBody = document.querySelector('.chat-body');
    const wrap = document.createElement('div');
    wrap.className = 'chat-buttons';
    buttons.forEach(({ label, onClick, expand }) => {
        const btn = document.createElement('button');
        btn.className = 'chat-btn' + (expand ? ' expand' : '');
        btn.textContent = label;
        btn.addEventListener('click', () => {
            wrap.remove();
            onClick();
        });
        wrap.appendChild(btn);
    });
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function setInputEnabled(enabled) {
    inputField.disabled = !enabled;
    sendButton.disabled = !enabled;
    inputField.style.opacity = enabled ? '' : '0.4';
    sendButton.style.opacity = enabled ? '' : '0.4';
}

// Mostra i pulsanti iniziali di scelta modalità
function showModeButtons() {
    setInputEnabled(false);
    const t = window.translator;
    addButtons([
        { label: t ? t.get('searchByLine') : 'Cerca per linea', onClick: () => {
            convState = { step: 'awaiting_line' };
            setInputEnabled(true);
            addMessage(t ? t.get('searchByLine') : 'Cerca per linea', true);
            addMessage(t ? t.get('enterLineNumber') : 'Inserisci il numero della linea (es. 4, 36, M1):', false);
        }},
        { label: t ? t.get('searchByStop') : 'Cerca per fermata', onClick: () => {
            convState = null;
            setInputEnabled(true);
            addMessage(t ? t.get('searchByStop') : 'Cerca per fermata', true);
            addMessage(t ? t.get('enterStopNumberPrompt') : 'Inserisci il numero della fermata:', false);
        }}
    ]);
}

// Gestisce il flusso di ricerca per linea
async function handleLineSearch(text) {
    if (!convState) return false;

    const chatBody = document.querySelector('.chat-body');

    if (convState.step === 'awaiting_line') {
        const data = await loadGtfsData();
        const lineKey = Object.keys(data).find(k => k.toLowerCase() === text.toLowerCase());
        if (!lineKey) {
        addMessage(`Linea "${text}" non trovata. Riprova (es. 4, 36, M1, STAR 1):`, false);
            return true;
        }
        const dirs = data[lineKey];
        const validDirs = Object.entries(dirs);
        // Raccoglie tutte le fermate di tutte le direzioni (deduplicate per code)
        convState = { step: 'awaiting_stop', line: lineKey, dirs: validDirs };
        const t = window.translator;
        addMessage(`${t ? t.get('searchByLine') : 'Linea'} ${lineKey} ${t ? t.get('lineFound') : 'trovata. Scrivi il nome (o parte) della fermata:'}`, false);
        const allStopNames = [];
        const seenNames = new Set();
        validDirs.forEach(([, dirData]) => {
            dirData.stops.forEach(s => {
                const clean = s.name.replace(/Fermata \d+ - /, '');
                if (!seenNames.has(clean)) { seenNames.add(clean); allStopNames.push(`${s.code} - ${clean}`); }
            });
        });
        addButtons([{ label: '▼ Mostra tutte le fermate', expand: true, onClick: () => {
            addMessage(allStopNames.join('\n'), false);
        }}]);
        return true;
    }

    if (convState.step === 'awaiting_stop') {
        const query = text.toLowerCase();
        // Per ogni direzione, trova la prima fermata che matcha
        const dirMatches = convState.dirs
            .map(([dirId, dirData]) => {
                const stop = dirData.stops.find(s =>
                    s.name.toLowerCase().includes(query) || s.code === query
                );
                return stop ? { dirId, dirData, stop } : null;
            })
            .filter(Boolean);

        if (dirMatches.length === 0) {
            const t = window.translator;
            addMessage(t ? t.get('noStopFound') : 'Nessuna fermata trovata. Riprova con un altro nome:', false);
            return true;
        }

        const t = window.translator;
        addMessage(t ? t.get('chooseDirection') : 'Scegli la direzione:', false);
        convState = { step: 'awaiting_dir', line: convState.line };
        addButtons(dirMatches.map(({ dirId, dirData, stop }) => ({
            label: dirData.headsign || 'Direzione ' + dirId,
            onClick: () => fetchLineAtStop(convState.line, stop.code, stop.name.replace(/Fermata \d+ - /, ''), dirId, dirData.headsign)
        })));
        return true;
    }

    if (convState.step === 'awaiting_dir') {
        return false; // gestito dai pulsanti
    }

    return false;
}

function fetchLineAtStop(line, stopCode, stopName, dirId, headsign) {
    convState = null;
    const t = window.translator;
    addMessage(`${t ? t.get('searchingLine') : 'Cerco la linea'} ${line} ${t ? t.get('searchingAtStop') : 'alla fermata'} ${stopName}...`, false);

    fetch(`https://gpa.madbob.org/query.php?stop=${stopCode}`)
        .then(r => r.json())
        .then(data => {
            const filtered = data.filter(d => d.line === line);
            if (filtered.length === 0) {
                const isMetro = /^M\d+$/i.test(line);
                if (isMetro) {
                    const day = new Date().getDay();
                    addMessageHTML(`
                        <strong>Orari ${line}</strong>
                        <table class="metro-table">
                            <thead><tr><th>Giorno</th><th>Prima partenza</th><th>Ultima corsa</th><th>Bus sost. M1S</th></tr></thead>
                            <tbody>
                                <tr${day >= 1 && day <= 4 ? ' class="today"' : ''}><td>Lun-Gio</td><td>5:30</td><td>21:30</td><td>22:00-00:30*</td></tr>
                                <tr${day === 5 || day === 6 ? ' class="today"' : ''}><td>Ven-Sab</td><td>5:30</td><td>1:00</td><td>-</td></tr>
                                <tr${day === 0 ? ' class="today"' : ''}><td>Dom/Festivi</td><td>7:00</td><td>21:30</td><td>5:30-7:00 e 22:00-00:30*</td></tr>
                            </tbody>
                        </table>
                        <small>* Ultime partenze M1S dai capolinea alle 00:00</small>
                    `);
                    addButtons([{ label: 'Cerca linea M1S', onClick: async () => {
                        const d = await loadGtfsData();
                        convState = { step: 'awaiting_stop', line: 'M1S', dirs: Object.entries(d['M1S'] || {}) };
                        addMessage('Cerca linea M1S', true);
                        addMessage(`Linea M1S ${t ? t.get('lineFound') : 'trovata. Scrivi il nome (o parte) della fermata:'}`, false);
                    }}]);
                } else {
                    addMessage(`${t ? t.get('noPassages') : 'Nessun passaggio trovato per la linea'} ${line} ${t ? t.get('atStop') : 'alla fermata'} ${stopName} (${stopCode}) ${t ? t.get('atThisTime') : 'in questo momento.'}`, false);
                    setTimeout(showModeButtons, 500);
                }
            } else {
                const rows = filtered.map(d => {
                    const rt = d.realtime ? '\u2714\ufe0f' : '\u274c';
                    return `${t ? t.get('line') : 'Linea'}: ${d.line} - ${t ? t.get('time') : 'Ora'}: ${d.hour} - ${t ? t.get('realTime') : 'Tempo reale'}: ${rt}`;
                }).join('\n');
                addMessage(`${t ? t.get('searchByLine') : 'Linea'} ${line} \u2192 ${headsign}\n${t ? t.get('searchingAtStop') : 'Fermata'}: ${stopName} (${stopCode})\n\n${rows}`, false);
                setTimeout(showModeButtons, 500);
            }
        })
        .catch(() => {
            addMessage(t ? t.get('requestError') : 'Errore nella richiesta. Riprova.', false);
            convState = null;
        });
}

function simulateBotResponse(_, inputText) {
    const chatBody = document.querySelector('.chat-body');

    // Rimuovi il welcome message statico se presente
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

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
            const tryStopMsg = window.translator ? window.translator.get('tryStopNumber') : "Scegli come vuoi cercare:";
            addMessage(tryStopMsg, false);
        }, 2300);

        setTimeout(() => showModeButtons(), 3100);
    }

    // Analizza l'input dell'utente
    const stopRegex = /^(\d+)$/i;  
    const stopRegex2 = /^(ciao|buongiorno|hey|salve)$/i;
    const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata)$/i;  
    
    const inputValue = (inputText || inputField.value).trim();
    const match = inputValue.match(stopRegex);
    const match2 = inputValue.match(stopRegex2);
    const match3 = inputValue.match(stopRegex3);

    // Se siamo in un flusso ricerca per linea, gestiscilo e basta
    if (convState) {
        handleLineSearch(inputValue);
        return;
    }

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

    if (match && !convState) {
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
    setInputEnabled(false);
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
    chatBody.innerHTML = '';
    convState = null;
    setInputEnabled(false);
    simulateBotResponse();
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
    const btnCerchio = document.querySelector('.btn-cerchio');
    const sidebar = document.getElementById('mySidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('closeSidebar');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    btnCerchio.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
});

// --- SWIPE PER APRIRE/CHIUDERE SIDEBAR ---
(function() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;

        // Ignora se il movimento è più verticale che orizzontale
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;

        const sidebar = document.getElementById('mySidebar');
        const overlay = document.getElementById('sidebarOverlay');

        // Swipe da sinistra (partendo dal bordo) → apre
        if (deltaX > 50 && touchStartX < 80) {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        }

        // Swipe verso sinistra con sidebar aperta → chiude
        if (deltaX < -60 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        }
    }, { passive: true });
})();

// --- GESTIONE TEMA CHIARO/SCURO ---
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('checkbox-theme');
    
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'dark-theme') {
            themeToggle.checked = true;
        }
    }

    themeToggle.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light-theme');
        }
    });
});
