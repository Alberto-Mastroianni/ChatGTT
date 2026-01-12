// Funzioni globali per il selettore lingua
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageOptions');
    dropdown.classList.toggle('show');
}

function selectLanguage(lang) {
    if (window.translator) {
        window.translator.setLanguage(lang);
    } else {
        window.translator = new TranslationManager();
        window.translator.setLanguage(lang);
    }
    document.getElementById('languageOptions').classList.remove('show');
}

// Chiudi dropdown cliccando fuori
document.addEventListener('click', function(e) {
    const selector = document.querySelector('.language-selector');
    const dropdown = document.getElementById('languageOptions');
    if (selector && !selector.contains(e.target)) {
        dropdown?.classList.remove('show');
    }
});

// Sistema di traduzione multilingue per ChatGTT
class TranslationManager {
    constructor() {
        this.currentLanguage = 'it'; // Lingua predefinita
        this.translations = {
            it: {
                // Interfaccia
                chatTitle: "Chat",
                messagePlaceholder: "Messaggio ChatGTT",
                rotateMessage: "Ruota lo schermo per una migliore esperienza",
                confirmDelete: "Sei sicuro di voler cancellare i messaggi?",
                
                // Messaggi bot
                welcomeMessage: "Ciao! Io sono ChatGTT, come posso aiutarti?",
                tryStopNumber: "Prova a digitare il numero della tua fermata per vedere quando passa il tuo bus o tram",
                botIntro: "Salve, sono un bot con IA e sono qui per darti una mano su tutta la rete di Torino",
                creators: "Sono stato creato da due ragazzi di 5° superiore, Alberto Mastroianni e Matteo Licciardino",
                enterStopNumber: "Scrivi il numero della fermata, vediamo quando passa il tuo bus o tram",
                busesAtStop: "Ecco i bus che passano nella fermata",
                wrongStopNumber: "Hai sbagliato inserire il numero della fermata!",
                retryStopNumber: "Riprova a inserire correttamente il numero della fermata!",
                
                // Risposte ringraziamenti
                thankYouResponses: [
                    "Prego! Se hai altre domande, sono qui per aiutarti.",
                    "Di nulla! Se c'è qualcos'altro di cui hai bisogno, chiedi pure.",
                    "Figurati! Se serve altro, non esitare a farmelo sapere.",
                    "È stato un piacere aiutarti! Se hai ulteriori dubbi, sono a tua disposizione.",
                    "Non c'è di che! Se ci sono altre informazioni di cui hai bisogno, sono qui.",
                    "Felice di poterti assistere! Fammi sapere se posso aiutarti in altro modo.",
                    "È stato un piacere! Se hai altre richieste, sono pronto a rispondere.",
                    "Nessun problema! Per qualsiasi altra cosa, sono a tua disposizione.",
                    "Sono qui per questo! Se hai domande aggiuntive, sono pronto a rispondere.",
                    "Di niente! Se hai ulteriori chiarimenti da richiedere, sono qui per aiutarti."
                ],
                
                // Informazioni biglietti
                line: "Linea",
                time: "Ora",
                realTime: "In tempo reale"
            },
            
            en: {
                // Interface
                chatTitle: "Chat",
                messagePlaceholder: "Message ChatGTT",
                rotateMessage: "Rotate your screen for a better experience",
                confirmDelete: "Are you sure you want to delete the messages?",
                
                // Bot messages
                welcomeMessage: "Hello! I'm ChatGTT, how can I help you?",
                tryStopNumber: "Try typing your stop number to see when your bus or tram arrives",
                botIntro: "Hello, I'm an AI bot and I'm here to help you with the entire Turin transport network",
                creators: "I was created by two high school students, Alberto Mastroianni and Matteo Licciardino",
                enterStopNumber: "Enter the stop number, let's see when your bus or tram arrives",
                busesAtStop: "Here are the buses that stop at stop",
                wrongStopNumber: "You entered the wrong stop number!",
                retryStopNumber: "Please try entering the stop number correctly!",
                
                // Thank you responses
                thankYouResponses: [
                    "You're welcome! If you have other questions, I'm here to help.",
                    "No problem! If there's anything else you need, feel free to ask.",
                    "Don't mention it! If you need anything else, don't hesitate to let me know.",
                    "It was a pleasure helping you! If you have further questions, I'm at your disposal.",
                    "Not at all! If there's other information you need, I'm here.",
                    "Happy to assist you! Let me know if I can help you in any other way.",
                    "It was a pleasure! If you have other requests, I'm ready to respond.",
                    "No problem! For anything else, I'm at your disposal.",
                    "I'm here for this! If you have additional questions, I'm ready to answer.",
                    "You're welcome! If you need further clarification, I'm here to help."
                ],
                
                // Ticket information
                line: "Line",
                time: "Time",
                realTime: "Real time"
            },
            
            es: {
                // Interfaz
                chatTitle: "Chat",
                messagePlaceholder: "Mensaje ChatGTT",
                rotateMessage: "Gira la pantalla para una mejor experiencia",
                confirmDelete: "¿Estás seguro de que quieres eliminar los mensajes?",
                
                // Mensajes del bot
                welcomeMessage: "¡Hola! Soy ChatGTT, ¿cómo puedo ayudarte?",
                tryStopNumber: "Prueba escribiendo el número de tu parada para ver cuándo pasa tu autobús o tranvía",
                botIntro: "Hola, soy un bot con IA y estoy aquí para ayudarte con toda la red de transporte de Turín",
                creators: "Fui creado por dos estudiantes de secundaria, Alberto Mastroianni y Matteo Licciardino",
                enterStopNumber: "Escribe el número de la parada, veamos cuándo pasa tu autobús o tranvía",
                busesAtStop: "Aquí están los autobuses que pasan por la parada",
                wrongStopNumber: "¡Has introducido mal el número de la parada!",
                retryStopNumber: "¡Intenta introducir correctamente el número de la parada!",
                
                // Respuestas de agradecimiento
                thankYouResponses: [
                    "¡De nada! Si tienes otras preguntas, estoy aquí para ayudarte.",
                    "¡No hay problema! Si necesitas algo más, pregunta sin dudarlo.",
                    "¡No es nada! Si necesitas algo más, no dudes en decírmelo.",
                    "¡Ha sido un placer ayudarte! Si tienes más dudas, estoy a tu disposición.",
                    "¡No hay de qué! Si necesitas más información, estoy aquí.",
                    "¡Feliz de poder asistirte! Dime si puedo ayudarte de otra manera.",
                    "¡Ha sido un placer! Si tienes otras solicitudes, estoy listo para responder.",
                    "¡No hay problema! Para cualquier otra cosa, estoy a tu disposición.",
                    "¡Estoy aquí para esto! Si tienes preguntas adicionales, estoy listo para responder.",
                    "¡De nada! Si necesitas más aclaraciones, estoy aquí para ayudarte."
                ],
                
                // Información de billetes
                line: "Línea",
                time: "Hora",
                realTime: "Tiempo real"
            },
            
            fr: {
                // Interface
                chatTitle: "Chat",
                messagePlaceholder: "Message ChatGTT",
                rotateMessage: "Tournez votre écran pour une meilleure expérience",
                confirmDelete: "Êtes-vous sûr de vouloir supprimer les messages?",
                
                // Messages du bot
                welcomeMessage: "Salut! Je suis ChatGTT, comment puis-je vous aider?",
                tryStopNumber: "Essayez de taper le numéro de votre arrêt pour voir quand votre bus ou tram arrive",
                botIntro: "Salut, je suis un bot IA et je suis là pour vous aider avec tout le réseau de transport de Turin",
                creators: "J'ai été créé par deux lycéens, Alberto Mastroianni et Matteo Licciardino",
                enterStopNumber: "Écrivez le numéro de l'arrêt, voyons quand votre bus ou tram arrive",
                busesAtStop: "Voici les bus qui passent à l'arrêt",
                wrongStopNumber: "Vous avez mal saisi le numéro de l'arrêt!",
                retryStopNumber: "Veuillez réessayer de saisir correctement le numéro de l'arrêt!",
                
                // Réponses de remerciement
                thankYouResponses: [
                    "De rien! Si vous avez d'autres questions, je suis là pour vous aider.",
                    "Pas de problème! S'il y a autre chose dont vous avez besoin, n'hésitez pas à demander.",
                    "Il n'y a pas de quoi! Si vous avez besoin d'autre chose, n'hésitez pas à me le faire savoir.",
                    "C'était un plaisir de vous aider! Si vous avez d'autres questions, je suis à votre disposition.",
                    "Il n'y a pas de quoi! S'il y a d'autres informations dont vous avez besoin, je suis là.",
                    "Heureux de pouvoir vous aider! Faites-moi savoir si je peux vous aider d'une autre manière.",
                    "C'était un plaisir! Si vous avez d'autres demandes, je suis prêt à répondre.",
                    "Pas de problème! Pour toute autre chose, je suis à votre disposition.",
                    "Je suis là pour ça! Si vous avez des questions supplémentaires, je suis prêt à répondre.",
                    "De rien! Si vous avez besoin de plus d'éclaircissements, je suis là pour vous aider."
                ],
                
                // Informations sur les billets
                line: "Ligne",
                time: "Heure",
                realTime: "Temps réel"
            },
            
            de: {
                // Benutzeroberfläche
                chatTitle: "Chat",
                messagePlaceholder: "Nachricht ChatGTT",
                rotateMessage: "Drehen Sie Ihren Bildschirm für eine bessere Erfahrung",
                confirmDelete: "Sind Sie sicher, dass Sie die Nachrichten löschen möchten?",
                
                // Bot-Nachrichten
                welcomeMessage: "Hallo! Ich bin ChatGTT, wie kann ich Ihnen helfen?",
                tryStopNumber: "Versuchen Sie, Ihre Haltestellen-Nummer einzugeben, um zu sehen, wann Ihr Bus oder Ihre Straßenbahn kommt",
                botIntro: "Hallo, ich bin ein KI-Bot und bin hier, um Ihnen mit dem gesamten Turiner Verkehrsnetz zu helfen",
                creators: "Ich wurde von zwei Oberschülern erstellt, Alberto Mastroianni und Matteo Licciardino",
                enterStopNumber: "Geben Sie die Haltestellen-Nummer ein, schauen wir, wann Ihr Bus oder Ihre Straßenbahn kommt",
                busesAtStop: "Hier sind die Busse, die an der Haltestelle",
                wrongStopNumber: "Sie haben die falsche Haltestellen-Nummer eingegeben!",
                retryStopNumber: "Bitte versuchen Sie, die Haltestellen-Nummer korrekt einzugeben!",
                
                // Dankesantworten
                thankYouResponses: [
                    "Gern geschehen! Wenn Sie weitere Fragen haben, bin ich hier, um zu helfen.",
                    "Kein Problem! Wenn Sie etwas anderes brauchen, fragen Sie gerne.",
                    "Nichts zu danken! Wenn Sie etwas anderes brauchen, zögern Sie nicht, es mir zu sagen.",
                    "Es war mir eine Freude, Ihnen zu helfen! Wenn Sie weitere Fragen haben, stehe ich zur Verfügung.",
                    "Gern geschehen! Wenn Sie weitere Informationen benötigen, bin ich hier.",
                    "Freut mich, Ihnen helfen zu können! Lassen Sie mich wissen, wenn ich Ihnen auf andere Weise helfen kann.",
                    "Es war mir eine Freude! Wenn Sie weitere Anfragen haben, bin ich bereit zu antworten.",
                    "Kein Problem! Für alles andere stehe ich zur Verfügung.",
                    "Dafür bin ich da! Wenn Sie zusätzliche Fragen haben, bin ich bereit zu antworten.",
                    "Gern geschehen! Wenn Sie weitere Klärungen benötigen, bin ich hier, um zu helfen."
                ],
                
                // Ticket-Informationen
                line: "Linie",
                time: "Zeit",
                realTime: "Echtzeit"
            }
        };
    }
    
    // Rileva la lingua dall'input dell'utente
    detectLanguage(text) {
        const patterns = {
            en: /\b(hello|hi|hey|thank|thanks|bus|stop|when|time|help|please)\b/i,
            es: /\b(hola|gracias|autobús|parada|cuándo|hora|ayuda|por favor|línea)\b/i,
            fr: /\b(salut|bonjour|merci|bus|arrêt|quand|heure|aide|s'il vous plaît|ligne)\b/i,
            de: /\b(hallo|danke|bus|haltestelle|wann|zeit|hilfe|bitte|linie)\b/i,
            it: /\b(ciao|grazie|autobus|fermata|quando|ora|aiuto|per favore|linea)\b/i
        };
        
        // Controlla i pattern per ogni lingua
        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                return lang;
            }
        }
        
        // Se non trova pattern specifici, mantiene la lingua corrente
        return this.currentLanguage;
    }
    
    // Imposta la lingua
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            this.updateInterface();
            // Ricarica i messaggi nella nuova lingua
            this.reloadWelcomeMessages();
        }
    }
    
    // Ottiene una traduzione
    get(key) {
        return this.translations[this.currentLanguage][key] || this.translations['it'][key] || key;
    }
    
    // Sistema di risposte offline per domande comuni
    getOfflineResponse(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        
        // Risposte sui biglietti
        if (lowerPrompt.includes('bigliett') || lowerPrompt.includes('ticket') || lowerPrompt.includes('billete') || lowerPrompt.includes('billet')) {
            const ticketResponses = {
                it: "Ecco i principali biglietti GTT:\n\n• Biglietto City: 2,00€ (100 minuti)\n• Daily: 4,50€ (giornaliero)\n• MultiCity: 11,80€ (10 corse)\n• MultiDaily 7: 21,00€ (7 giorni)\n• Tour 48h: 9,50€\n• Tour 72h: 12,50€",
                en: "Here are the main GTT tickets:\n\n• City Ticket: €2.00 (100 minutes)\n• Daily: €4.50 (daily)\n• MultiCity: €11.80 (10 rides)\n• MultiDaily 7: €21.00 (7 days)\n• Tour 48h: €9.50\n• Tour 72h: €12.50",
                es: "Aquí están los principales billetes GTT:\n\n• Billete City: 2,00€ (100 minutos)\n• Daily: 4,50€ (diario)\n• MultiCity: 11,80€ (10 viajes)\n• MultiDaily 7: 21,00€ (7 días)\n• Tour 48h: 9,50€\n• Tour 72h: 12,50€",
                fr: "Voici les principaux billets GTT:\n\n• Billet City: 2,00€ (100 minutes)\n• Daily: 4,50€ (journalier)\n• MultiCity: 11,80€ (10 trajets)\n• MultiDaily 7: 21,00€ (7 jours)\n• Tour 48h: 9,50€\n• Tour 72h: 12,50€",
                de: "Hier sind die wichtigsten GTT-Tickets:\n\n• City-Ticket: 2,00€ (100 Minuten)\n• Daily: 4,50€ (täglich)\n• MultiCity: 11,80€ (10 Fahrten)\n• MultiDaily 7: 21,00€ (7 Tage)\n• Tour 48h: 9,50€\n• Tour 72h: 12,50€"
            };
            return ticketResponses[this.currentLanguage] || ticketResponses['it'];
        }
        
        // Risposte sui creatori
        if (lowerPrompt.includes('chi') || lowerPrompt.includes('creato') || lowerPrompt.includes('who') || lowerPrompt.includes('created') || lowerPrompt.includes('quién') || lowerPrompt.includes('créé')) {
            const creatorResponses = {
                it: "Sono stato creato da Alberto Mastroianni e Matteo Licciardino, due studenti di 5° superiore. È un progetto scolastico per aiutare con i trasporti di Torino!",
                en: "I was created by Alberto Mastroianni and Matteo Licciardino, two high school students. It's a school project to help with Turin transport!",
                es: "Fui creado por Alberto Mastroianni y Matteo Licciardino, dos estudiantes de secundaria. ¡Es un proyecto escolar para ayudar con el transporte de Turín!",
                fr: "J'ai été créé par Alberto Mastroianni et Matteo Licciardino, deux lycéens. C'est un projet scolaire pour aider avec les transports de Turin!",
                de: "Ich wurde von Alberto Mastroianni und Matteo Licciardino erstellt, zwei Oberschulschülern. Es ist ein Schulprojekt zur Hilfe beim Turiner Verkehr!"
            };
            return creatorResponses[this.currentLanguage] || creatorResponses['it'];
        }
        
        // Risposte di aiuto
        if (lowerPrompt.includes('aiuto') || lowerPrompt.includes('help') || lowerPrompt.includes('ayuda') || lowerPrompt.includes('aide') || lowerPrompt.includes('hilfe')) {
            const helpResponses = {
                it: "Posso aiutarti con:\n\n• Informazioni sui biglietti GTT (scrivi 'biglietti')\n• Orari delle fermate (scrivi il numero della fermata)\n• Informazioni sui trasporti di Torino\n\nCosa ti serve?",
                en: "I can help you with:\n\n• GTT ticket information (write 'tickets')\n• Stop schedules (write the stop number)\n• Turin transport information\n\nWhat do you need?",
                es: "Puedo ayudarte con:\n\n• Información sobre billetes GTT (escribe 'billetes')\n• Horarios de paradas (escribe el número de parada)\n• Información sobre transporte de Turín\n\n¿Qué necesitas?",
                fr: "Je peux vous aider avec:\n\n• Informations sur les billets GTT (écrivez 'billets')\n• Horaires des arrêts (écrivez le numéro d'arrêt)\n• Informations sur les transports de Turin\n\nQue vous faut-il?",
                de: "Ich kann Ihnen helfen mit:\n\n• GTT-Ticket-Informationen (schreiben Sie 'Tickets')\n• Haltestellen-Fahrpläne (schreiben Sie die Haltestellen-Nummer)\n• Turin-Verkehrsinformationen\n\nWas brauchen Sie?"
            };
            return helpResponses[this.currentLanguage] || helpResponses['it'];
        }
        
        return null; // Nessuna risposta offline trovata
    }
    
    // Ottiene una risposta casuale di ringraziamento
    getRandomThankYou() {
        const responses = this.get('thankYouResponses');
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Aggiorna l'interfaccia con la lingua corrente
    updateInterface() {
        const input = document.querySelector('.chat-input input');
        if (input) input.placeholder = this.get('messagePlaceholder');
        
        const rotateMsg = document.querySelector('.rotate-message p');
        if (rotateMsg) rotateMsg.textContent = this.get('rotateMessage');
        
        const confirmMsg = document.querySelector('.confirmation-content p');
        if (confirmMsg) confirmMsg.textContent = this.get('confirmDelete');
        
        const chatTitle = document.querySelector('.chat-header p');
        if (chatTitle) chatTitle.textContent = this.get('chatTitle');
        
        this.updateLanguageSelector();
    }
    
    // Ricarica i messaggi di benvenuto nella lingua corrente
    reloadWelcomeMessages() {
        const chatBody = document.querySelector('.chat-body');
        if (!chatBody) return;
        
        const messages = [];
        const messageElements = chatBody.querySelectorAll('.message');
        
        messageElements.forEach(msg => {
            const isUser = msg.classList.contains('user-message');
            const text = msg.textContent;
            messages.push({ text, isUser });
        });
        
        while (chatBody.firstChild) {
            chatBody.removeChild(chatBody.firstChild);
        }
        
        if (window.addMessage) {
            messages.forEach((msg, index) => {
                setTimeout(() => {
                    const translatedText = msg.isUser ? msg.text : this.translateBotMessage(msg.text);
                    window.addMessage(translatedText, msg.isUser);
                }, index * 20);
            });
        }
    }
    
    // Traduce un messaggio bot nella lingua corrente
    translateBotMessage(text) {
        const normalizedText = text.trim();
        
        // Se contiene righe multiple (orari), traduci riga per riga
        if (normalizedText.includes('\n')) {
            const lines = normalizedText.split('\n');
            const translatedLines = lines.map(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return '';
                return this.translateSingleLine(trimmedLine);
            });
            return translatedLines.join('\n');
        }
        
        return this.translateSingleLine(normalizedText);
    }
    
    // Traduce una singola riga
    translateSingleLine(text) {
        const normalizedText = text.trim();
        
        // Messaggi comuni da tradurre - versioni in tutte le lingue
        const messagePatterns = [
            {
                patterns: [
                    'Ciao! Io sono ChatGTT, come posso aiutarti?',
                    'Hello! I\'m ChatGTT, how can I help you?',
                    'Hallo! Ich bin ChatGTT, wie kann ich Ihnen helfen?',
                    '¡Hola! Soy ChatGTT, ¿cómo puedo ayudarte?',
                    'Salut! Je suis ChatGTT, comment puis-je vous aider?'
                ],
                key: 'welcomeMessage'
            },
            {
                patterns: [
                    'Prova a digitare il numero della tua fermata per vedere quando passa il tuo bus o tram',
                    'Try typing your stop number to see when your bus or tram arrives',
                    'Versuchen Sie, Ihre Haltestellen-Nummer einzugeben, um zu sehen, wann Ihr Bus oder Ihre Straßenbahn kommt',
                    'Prueba escribiendo el número de tu parada para ver cuándo pasa tu autobús o tranvía',
                    'Essayez de taper le numéro de votre arrêt pour voir quand votre bus ou tram arrive'
                ],
                key: 'tryStopNumber'
            },
            {
                patterns: [
                    'Salve, sono un bot con IA e sono qui per darti una mano su tutta la rete di Torino',
                    'Hello, I\'m an AI bot and I\'m here to help you with the entire Turin transport network',
                    'Hallo, ich bin ein KI-Bot und bin hier, um Ihnen mit dem gesamten Turiner Verkehrsnetz zu helfen',
                    'Hola, soy un bot con IA y estoy aquí para ayudarte con toda la red de transporte de Turín',
                    'Salut, je suis un bot IA et je suis là pour vous aider avec tout le réseau de transport de Turin'
                ],
                key: 'botIntro'
            },
            {
                patterns: [
                    'Sono stato creato da due ragazzi di 5° superiore, Alberto Mastroianni e Matteo Licciardino',
                    'I was created by two high school students, Alberto Mastroianni and Matteo Licciardino',
                    'Ich wurde von zwei Oberschülern erstellt, Alberto Mastroianni und Matteo Licciardino',
                    'Fui creado por dos estudiantes de secundaria, Alberto Mastroianni y Matteo Licciardino',
                    'J\'ai été créé par deux lycéens, Alberto Mastroianni et Matteo Licciardino'
                ],
                key: 'creators'
            },
            {
                patterns: [
                    'Scrivi il numero della fermata, vediamo quando passa il tuo bus o tram',
                    'Enter the stop number, let\'s see when your bus or tram arrives',
                    'Geben Sie die Haltestellen-Nummer ein, schauen wir, wann Ihr Bus oder Ihre Straßenbahn kommt',
                    'Escribe el número de la parada, veamos cuándo pasa tu autobús o tranvía',
                    'Écrivez le numéro de l\'arrêt, voyons quand votre bus ou tram arrive'
                ],
                key: 'enterStopNumber'
            }
        ];
        
        // Cerca corrispondenza nei pattern
        for (const msgPattern of messagePatterns) {
            if (msgPattern.patterns.some(p => normalizedText === p)) {
                return this.get(msgPattern.key);
            }
        }
        
        // Gestisci messaggi con numero fermata - tutte le varianti
        const busStopPatterns = [
            /Ecco i bus che passano nella fermata (\d+):/,
            /Here are the buses that stop at stop (\d+):/,
            /Hier sind die Busse, die an der Haltestelle (\d+):/,
            /Aquí están los autobuses que pasan por la parada (\d+):/,
            /Voici les bus qui passent à l'arrêt (\d+):/
        ];
        
        for (const pattern of busStopPatterns) {
            const match = normalizedText.match(pattern);
            if (match) {
                return `${this.get('busesAtStop')} ${match[1]}:`;
            }
        }
        
        // Traduci etichette orari - pattern per linea/ora/tempo reale
        if (normalizedText.includes('Linea:') || normalizedText.includes('Line:') || 
            normalizedText.includes('Linie:') || normalizedText.includes('Línea:') || 
            normalizedText.includes('Ligne:')) {
            
            // Estrai i dati con regex più robusta
            const lineMatch = normalizedText.match(/(?:Linea|Line|Linie|Línea|Ligne):\s*([^-]+?)\s*-/);
            const timeMatch = normalizedText.match(/-\s*(?:Ora|Time|Zeit|Hora|Heure):\s*([^-]+?)\s*-/);
            const realtimeMatch = normalizedText.match(/-\s*(?:In tempo reale|Real time|Echtzeit|Tiempo real|Temps réel):\s*(.+)$/);
            
            if (lineMatch && timeMatch && realtimeMatch) {
                return `${this.get('line')}: ${lineMatch[1].trim()} - ${this.get('time')}: ${timeMatch[1].trim()} - ${this.get('realTime')}: ${realtimeMatch[1].trim()}`;
            }
        }
        
        // Se non trova corrispondenza, restituisci il testo originale
        return text;
    }
    
    // Aggiorna il selettore lingua per mostrare la lingua corrente
    updateLanguageSelector() {
        const flags = {
            it: '🇮🇹',
            en: '🇬🇧', 
            es: '🇪🇸',
            fr: '🇫🇷',
            de: '🇩🇪'
        };
        
        const currentFlag = document.getElementById('currentFlag');
        if (currentFlag) {
            currentFlag.textContent = flags[this.currentLanguage] || flags['it'];
        }
    }
    
    // Formatta gli orari nella lingua corrente
    formatSchedule(scheduleData) {
        try {
            const scheduleArray = JSON.parse(scheduleData);
            
            const formattedSchedule = scheduleArray.map(schedule => {
                const checkmark = schedule.realtime ? '✔️' : '❌';
                return `${this.get('line')}: ${schedule.line} - ${this.get('time')}: ${schedule.hour} - ${this.get('realTime')}: ${checkmark}`;
            }).join('\n');
            
            return formattedSchedule;
        } catch (error) {
            console.error("Errore durante il parsing degli orari JSON:", error);
            return "Errore durante il parsing degli orari JSON.";
        }
    }
}

// Istanza globale del gestore traduzioni
window.translator = new TranslationManager();