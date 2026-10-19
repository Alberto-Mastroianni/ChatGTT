const inputField = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');
const clearButton = document.getElementById("clear");
const agreeButton = document.getElementById("agree");
const declineButton = document.getElementById("decline");

// --- STATO CONVERSAZIONE PER RICERCA PER LINEA ---
let gtfsData = null;
let avvisiData = null;
let convState = null;
let botMode = false;
let botSessionId = 0; // incrementato ad ogni reset, invalida i setTimeout pendenti

async function loadGtfsData() {
    if (gtfsData) return gtfsData;
    try {
        const r = await fetch('gtfs-data.json');
        gtfsData = await r.json();
    } catch(e) { gtfsData = {}; }
    return gtfsData;
}

async function loadAvvisi() {
    if (avvisiData) return avvisiData;
    try {
        const r = await fetch('scraper.php');
        avvisiData = await r.json();
    } catch(e) { avvisiData = { gtt: [], tram: [] }; }
    return avvisiData;
}

// Cerca deviazioni GTT per una linea specifica
function getAvvisiPerLinea(line) {
    if (!avvisiData) return [];
    const lineNorm = line.trim().toLowerCase();
    return (avvisiData.gtt || []).filter(a => {
        const linee = a.linea.toLowerCase().split(/[\s\-–&]+/);
        return linee.some(l => l.trim() === lineNorm);
    });
}

// Cerca stato tram per una linea
function getStatoTram(line) {
    if (!avvisiData) return null;
    const lineNorm = line.trim().toLowerCase().replace(/^linea\s*/i, '');
    return (avvisiData.tram || []).find(t => t.linea.toLowerCase().replace(/^linea\s*/i, '') === lineNorm) || null;
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

// Sanitizza HTML rimuovendo tag e attributi pericolosi
function sanitizeHTML(html) {
    const allowed = document.createElement('div');
    allowed.innerHTML = html;
    allowed.querySelectorAll('script, iframe, object, embed, form').forEach(el => el.remove());
    allowed.querySelectorAll('*').forEach(el => {
        ['onclick','onerror','onload','onmouseover','onfocus','onblur'].forEach(attr => el.removeAttribute(attr));
    });
    return allowed.innerHTML;
}

// Event delegation per pulsanti dinamici dentro messaggi HTML
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.dev-toggle');
    if (!btn) return;
    const msg = btn.closest('.bot-message');
    if (!msg) return;
    const extra = msg.querySelector('.dev-extra');
    if (!extra) return;
    const hidden = extra.style.display === 'none';
    extra.style.display = hidden ? 'block' : 'none';
    const count = btn.dataset.count;
    btn.textContent = hidden ? `\u25b2 Nascondi` : `\u25bc Mostra altre ${count} variazioni`;
});

// Aggiunge un messaggio bot con HTML (per tabelle ecc.)
function addMessageHTML(html) {
    const message = document.createElement('div');
    message.classList.add('message', 'bot-message');
    message.innerHTML = sanitizeHTML(html);
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
            botMode = false;
            setInputEnabled(true);
            addMessage(t ? t.get('searchByLine') : 'Cerca per linea', true);
            addMessage(t ? t.get('enterLineNumber') : 'Inserisci il numero della linea (es. 4, 36, M1):', false);
        }},
        { label: t ? t.get('searchByStop') : 'Cerca per fermata', onClick: () => {
            convState = null;
            botMode = false;
            setInputEnabled(true);
            addMessage(t ? t.get('searchByStop') : 'Cerca per fermata', true);
            addMessage(t ? t.get('enterStopNumberPrompt') : 'Nome o numero fermata:', false);
        }},
        { label: t ? t.get('askBot') : 'Chiedi al bot', onClick: () => {
            convState = null;
            botMode = true;
            setInputEnabled(true);
            addMessage(t ? t.get('askBot') : 'Chiedi al bot', true);
            addMessage(t ? t.get('askBotPrompt') : 'Puoi chiedermi qualsiasi cosa sui trasporti GTT di Torino!', false);
        }}
    ]);
}

// Mostra/nascondi fermate con toggle, filtro direzione e fermate cliccabili
function addStopsToggle(stops, line, dirs) {
    const chatBody = document.querySelector('.chat-body');
    const t = window.translator;
    const wrap = document.createElement('div');
    wrap.className = 'chat-buttons stops-toggle-wrap';

    // Pulsante toggle mostra/nascondi
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'chat-btn expand';
    toggleBtn.textContent = t ? t.get('showStops') : '▼ Mostra tutte le fermate';
    wrap.appendChild(toggleBtn);

    // Contenitore collassabile
    const collapsible = document.createElement('div');
    collapsible.className = 'stops-collapsible';
    collapsible.style.display = 'none';

    // Calcola i 2 capolinea per direzione
    const dirInfos = dirs.map(([dirId, dirData]) => {
        const cap1 = dirData.firstCap || dirData.stops[0].name.replace(/Fermata \d+ - /, '');
        const cap2 = dirData.lastCap || dirData.stops[dirData.stops.length-1].name.replace(/Fermata \d+ - /, '');
        return { dirId, dirData, cap1, cap2, label: `${cap1} → ${cap2}` };
    });

    // Filtri direzione
    const filterWrap = document.createElement('div');
    filterWrap.className = 'stops-filter';
    let activeDirIdx = 0;

    const stopsContainer = document.createElement('div');
    stopsContainer.className = 'stops-list';

    function renderStops(dirIdx) {
        stopsContainer.innerHTML = '';
        const { dirId, dirData } = dirInfos[dirIdx];
        dirData.stops.forEach(s => {
            const name = s.name.replace(/Fermata \d+ - /, '');
            const btn = document.createElement('button');
            btn.className = 'chat-btn stop-item';
            btn.textContent = `${name} (${s.code})`;
            btn.addEventListener('click', () => {
                const dirMatches = dirs
                    .map(([dId, dData]) => {
                        const stop = dData.stops.find(st => st.code === s.code);
                        return stop ? { dirId: dId, dirData: dData, stop } : null;
                    })
                    .filter(Boolean);
                if (dirMatches.length === 0) return;
                addMessage(`${name} (${s.code})`, true);
                addMessage(t ? t.get('chooseDirection') : 'Scegli la direzione:', false);
                const lineSaved = line;
                convState = { step: 'awaiting_dir', line: lineSaved };
                addButtons(dirMatches.map(({ dirId: dId, dirData: dData, stop }) => {
                    const c1 = dData.firstCap || dData.stops[0].name.replace(/Fermata \d+ - /, '');
                    const c2 = dData.lastCap || dData.stops[dData.stops.length-1].name.replace(/Fermata \d+ - /, '');
                    const lbl = `${c1} → ${c2}`;
                    return { label: lbl, onClick: () => fetchLineAtStop(lineSaved, stop.code, name, dId, lbl) };
                }));
            });
            stopsContainer.appendChild(btn);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    dirInfos.forEach(({ label }, idx) => {
        const fb = document.createElement('button');
        fb.className = 'chat-btn stop-filter-btn' + (idx === 0 ? ' active' : '');
        fb.textContent = label;
        fb.addEventListener('click', () => {
            activeDirIdx = idx;
            filterWrap.querySelectorAll('.stop-filter-btn').forEach((b, i) =>
                b.classList.toggle('active', i === idx)
            );
            renderStops(idx);
        });
        filterWrap.appendChild(fb);
    });

    collapsible.appendChild(filterWrap);
    collapsible.appendChild(stopsContainer);
    renderStops(0);

    toggleBtn.addEventListener('click', () => {
        const hidden = collapsible.style.display === 'none';
        collapsible.style.display = hidden ? 'block' : 'none';
        toggleBtn.textContent = hidden
            ? (t ? t.get('hideStops') : '▲ Nascondi fermate')
            : (t ? t.get('showStops') : '▼ Mostra tutte le fermate');
        if (hidden) chatBody.scrollTop = chatBody.scrollHeight;
    });

    wrap.appendChild(collapsible);
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
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
        const allDirs = Object.entries(dirs);
        const has01 = allDirs.some(([id]) => id === '0') && allDirs.some(([id]) => id === '1');
        const emptyDir = allDirs.find(([id, v]) => id === '' && v.firstCap !== v.lastCap);
        let validDirs;
        if (has01) {
            validDirs = allDirs
                .filter(([id]) => id === '0' || id === '1')
                .map(([id, v]) => {
                    if (!emptyDir) return [id, v];
                    const capA = emptyDir[1].firstCap;
                    const capB = emptyDir[1].lastCap;
                    // Cerca capA e capB nelle fermate della direzione, vince quello più vicino alla fine
                    const codes = v.stops.map(s => s.name.replace(/Fermata \d+ - /, ''));
                    const idxA = codes.map((n,i) => n.includes(capA.replace(' CAP','')) ? i : -1).filter(i=>i>=0).pop() ?? -1;
                    const idxB = codes.map((n,i) => n.includes(capB.replace(' CAP','')) ? i : -1).filter(i=>i>=0).pop() ?? -1;
                    if (idxA === -1 && idxB === -1) return [id, v]; // fallback: usa i CAP originali della direzione
                    const endsAtB = idxB >= idxA;
                    const fc = endsAtB ? capA : capB;
                    const lc = endsAtB ? capB : capA;
                    return [id, { ...v, firstCap: fc, lastCap: lc }];
                });
        } else {
            if (emptyDir) {
                const [, v] = emptyDir;
                validDirs = [
                    ['0', { ...v, firstCap: v.firstCap, lastCap: v.lastCap }],
                    ['1', { ...v, stops: [...v.stops].reverse(), firstCap: v.lastCap, lastCap: v.firstCap }]
                ];
            } else {
                validDirs = allDirs.filter(([id]) => id === '0');
            }
        }
        convState = { step: 'awaiting_stop', line: lineKey, dirs: validDirs };
        const t = window.translator;
        addMessage(`${t ? t.get('searchByLine') : 'Linea'} ${lineKey} ${t ? t.get('lineFound') : 'trovata. Scrivi il nome (o parte) della fermata:'}`, false);

        // Fermate ordinate: prendi la prima direzione come riferimento d'ordine,
        // poi aggiungi le fermate delle altre direzioni non ancora viste
        const seenCodes = new Set();
        const orderedStops = [];
        validDirs.forEach(([, dirData]) => {
            dirData.stops.forEach(s => {
                if (!seenCodes.has(s.code)) {
                    seenCodes.add(s.code);
                    orderedStops.push({ code: s.code, name: s.name.replace(/Fermata \d+ - /, '') });
                }
            });
        });

        addStopsToggle(orderedStops, lineKey, validDirs);
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
        const lineSaved = convState.line;
        convState = { step: 'awaiting_dir', line: lineSaved };
        addButtons(dirMatches.map(({ dirId, dirData, stop }) => {
            const stops = dirData.stops;
            const cap1 = dirData.firstCap || stops[0].name.replace(/Fermata \d+ - /, '');
            const cap2 = dirData.lastCap || stops[stops.length - 1].name.replace(/Fermata \d+ - /, '');
            const label = `${cap1} → ${cap2}`;
            return {
                label,
                onClick: () => fetchLineAtStop(lineSaved, stop.code, stop.name.replace(/Fermata \d+ - /, ''), dirId, label)
            };
        }));
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

    // Avviso deviazione contestuale
    loadAvvisi().then(() => {
        const avvisi = getAvvisiPerLinea(line);
        const statoTram = getStatoTram(line);
        if (avvisi.length > 0 || (statoTram && statoTram.anomalia)) {
            const msgs = [];
            if (statoTram && statoTram.anomalia) msgs.push(`⚠️ Tram di Torino: ${statoTram.stato}`);
            avvisi.slice(0, 2).forEach(a => msgs.push(`⚠️ GTT: ${a.descrizione.substring(0, 120)}${a.descrizione.length > 120 ? '…' : ''}`));
            addMessage(msgs.join('\n'), false);
        }
    });

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
        const mySession = ++botSessionId;
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = ".";
        chatBody.appendChild(loadingMessage);

        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);

        const dotsInterval = setInterval(() => {
            loadingDots.textContent += ".";
            if (loadingDots.textContent.length > 3) loadingDots.textContent = "";
        }, 500);

        setTimeout(() => {
            if (botSessionId !== mySession) return;
            clearInterval(dotsInterval);
            if (chatBody.contains(loadingMessage)) chatBody.removeChild(loadingMessage);
            const botResponse = window.translator ? window.translator.get('welcomeMessage') : "Ciao! Io sono ChatGTT, come posso aiutarti?";
            addMessage(botResponse, false);
        }, 1300);

        setTimeout(() => {
            if (botSessionId !== mySession) return;
            const tryStopMsg = window.translator ? window.translator.get('tryStopNumber') : "Scegli come vuoi cercare:";
            addMessage(tryStopMsg, false);
        }, 2300);

        setTimeout(() => {
            if (botSessionId !== mySession) return;
            showModeButtons();
        }, 3100);
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
        return;
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
        return;
    }

    // Comando deviazioni
    const devRegex = /^(deviazioni|avvisi|variazioni|disruptions|alerts|desvios|alertes|ablenkungen)$/i;
    if (devRegex.test(inputValue) && !convState) {
        loadAvvisi().then(data => {
            const t = window.translator;
            const gtt = data.gtt || [];
            const tram = (data.tram || []).filter(t => t.anomalia);
            if (gtt.length === 0 && tram.length === 0) {
                addMessage('✅ Nessuna deviazione attiva al momento.', false);
                return;
            }

            let html = `<strong>⚠️ Deviazioni attive</strong> <small>(agg. ${data.aggiornato})</small><br><br>`;

            if (tram.length > 0) {
                html += '<strong>🚋 Tram di Torino:</strong><br>';
                tram.forEach(t => { html += `• Linea ${t.linea}: ${t.stato}<br>`; });
                html += '<br>';
            }

            if (gtt.length > 0) {
                html += '<strong>🟡 GTT Variazioni:</strong><br>';

                // Versione corta: prima frase o max 60 char
                function shortDesc(desc) { return desc; }

                const shown = gtt.slice(0, 10);
                const hidden = gtt.slice(10);

                shown.forEach(a => {
                    html += `• <strong>Linea ${a.linea}:</strong> ${shortDesc(a.descrizione)}<br>`;
                });

                if (hidden.length > 0) {
                    html += `<span class="dev-extra" style="display:none">`;
                    hidden.forEach(a => {
                        html += `• <strong>Linea ${a.linea}:</strong> ${shortDesc(a.descrizione)}<br>`;
                    });
                    html += `</span>`;
                    html += `<br><button class="chat-btn expand dev-toggle" data-count="${hidden.length}">▼ Mostra altre ${hidden.length} variazioni</button>`;
                }
            }

            addMessageHTML(html);
        });
        return;
    }

    if (!match && !match2 && !match3 && !devRegex.test(inputValue) && !convState && !botMode && inputValue.length >= 2) {
        loadGtfsData().then(data => {
            const query = inputValue.toLowerCase();
            const found = new Map();
            Object.values(data).forEach(dirs => {
                Object.values(dirs).forEach(dirData => {
                    dirData.stops.forEach(s => {
                        const clean = s.name.replace(/Fermata \d+ - /, '');
                        if (clean.toLowerCase().includes(query) && !found.has(s.code)) {
                            found.set(s.code, clean);
                        }
                    });
                });
            });
            if (found.size === 0) {
                const t = window.translator;
                addMessage(t ? t.get('noStopFound') : 'Nessuna fermata trovata. Riprova con un altro nome:', false);
                return;
            }
            const t = window.translator;
            addMessage(t ? t.get('chooseStop') : 'Fermate trovate, scegli:', false);
            const buttons = [];
            found.forEach((name, code) => {
                buttons.push({ label: `${name} (${code})`, onClick: () => fetchStopSchedule(code, name) });
            });
            addButtons(buttons);
        });
        return;
    }

    if (match && !convState) {
        const stopNumber = match[1];
        fetchStopSchedule(stopNumber, stopNumber);
    }
}

function fetchStopSchedule(stopNumber, stopLabel) {
    const chatBody = document.querySelector('.chat-body');
    const t = window.translator;

    // Cerca il nome della fermata nel GTFS se non già fornito come nome
    loadGtfsData().then(data => {
        let displayName = stopLabel;
        // Se stopLabel è uguale al numero (ricerca per numero), cerca il nome nel GTFS
        if (stopLabel === stopNumber) {
            outer: for (const dirs of Object.values(data)) {
                for (const dirData of Object.values(dirs)) {
                    const found = dirData.stops.find(s => s.code === String(stopNumber));
                    if (found) {
                        displayName = found.name.replace(/Fermata \d+ - /, '');
                        break outer;
                    }
                }
            }
        }

        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message');
        loadingMessage.textContent = '.';
        chatBody.appendChild(loadingMessage);
        const loadingDots = document.createElement('span');
        loadingDots.classList.add('loading-dots');
        loadingMessage.appendChild(loadingDots);
        const dotsInterval = setInterval(() => {
            loadingDots.textContent += '.';
            if (loadingDots.textContent.length > 3) loadingDots.textContent = '';
        }, 500);

        const tramLines = new Set(['3','4','7','9','10','13','15','16','sassi-superga','9/stadio']);
        fetch(getBusInfoUrl(stopNumber))
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data)) throw new Error('Dati non validi');
                const busInfoMessage = window.translator ? window.translator.formatSchedule(JSON.stringify(data)) : formattaOrari(JSON.stringify(data));
                const lines = [...new Set(data.map(d => d.line.toLowerCase()))];
                const allTram = lines.length > 0 && lines.every(l => tramLines.has(l));
                const anyTram = lines.some(l => tramLines.has(l));
                const vehicleLabel = allTram ? 'tram' : anyTram ? 'mezzi' : 'bus';
                setTimeout(() => {
                    clearInterval(dotsInterval);
                    chatBody.removeChild(loadingMessage);
                    addMessage(`Ecco i ${vehicleLabel} che passano nella fermata ${displayName} (${stopNumber}):`, false);
                }, 500);
                setTimeout(() => {
                    if (busInfoMessage === '') {
                        addMessage(t ? t.get('wrongStopNumber') : 'Hai sbagliato inserire il numero della fermata!', false);
                    } else {
                        addMessage(busInfoMessage, false);
                    }
                    setTimeout(showModeButtons, 500);
                }, 1500);
            })
            .catch(error => console.error('Errore durante la richiesta API:', error));
    });
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
    loadAvvisi(); // precarica avvisi in background
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
    botMode = false;
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
