async function getAIResponse(prompt) {
    try {
        const detectedLang = window.translator ? window.translator.detectLanguage(prompt) : 'it';
        const langChanged = window.translator && detectedLang !== window.translator.currentLanguage;
        
        if (langChanged) {
            window.translator.currentLanguage = detectedLang;
            window.translator.updateInterface();
        }

        const stopRegex = /^(\d+)$/i;
        const stopRegex2 = /^(ciao|buongiorno|hey|salve|hello|hi|hola|salut|bonjour|hallo)$/i;
        const stopRegex3 = /^(grazie|grazie mille|ti ringrazio|grato|grata|thank|thanks|gracias|merci|danke)$/i;
        const stopRegex4 = /^(deviazion[ei]|disruptions?|desvios?|alertes?|ablenkungen?)$/i;

        if (stopRegex.test(prompt) || stopRegex2.test(prompt) || stopRegex3.test(prompt) || stopRegex4.test(prompt)) {
            return null;
        }

        const currentLang = window.translator ? window.translator.currentLanguage : 'it';

        const response = await axios.post('proxy.php', {
            messaggio: prompt,
            lingua: currentLang
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 65000
        });

        if (response.data && response.data.candidates && response.data.candidates[0]?.content) {
            let text = response.data.candidates[0].content.parts[0].text;
            text = text.replace(/\*\*|__|[\*_]/g, '').replace(/^[*\-+#]+\s*/gm, '');
            return text.trim();
        }

        console.warn('Risposta Gemini inattesa:', JSON.stringify(response.data));
        
        if (response.data?.error) {
            const errMsg = typeof response.data.error === 'object'
                ? (response.data.error.message || JSON.stringify(response.data.error))
                : response.data.error;
            
            // MODIFICA QUI: Creiamo un errore personalizzato e gli assegniamo il codice
            const customError = new Error(errMsg);
            customError.statusCode = response.data.error.code; // Salva il 429 di Gemini
            throw customError;
        }

        throw new Error('Risposta non valida dal proxy.');

    } catch (error) {
        console.error('Errore AI:', error);

        const currentLang = window.translator ? window.translator.currentLanguage : 'it';

        // MODIFICA QUI: Controlliamo sia l'errore HTTP di Axios, sia il nostro errore personalizzato
        if (error.response?.status === 429 || error.statusCode === 429) {
            const msgs = {
                it: 'Hai superato il limite di messaggi (o messaggi troppo veloci). Riprova più tardi.',
                en: 'You have exceeded the message limit (or sending too fast). Please try again later.',
                es: 'Has superado el límite de mensajes. Vuelve a intentarlo más tarde.',
                fr: 'Vous avez dépassé la limite de messages. Veuillez réessayer plus tard.',
                de: 'Sie haben das Nachrichtenlimit überschritten. Bitte versuchen Sie es später noch einmal.'
            };
            return msgs[currentLang] || msgs['it'];
        }

        if (error.code === 'ECONNABORTED') {
            const msgs = {
                it: 'La richiesta ha impiegato troppo tempo. Riprova.',
                en: 'The request took too long. Please try again.',
                es: 'La solicitud tardó demasiado. Inténtalo de nuevo.',
                fr: 'La requête a pris trop de temps. Veuillez réessayer.',
                de: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.'
            };
            return msgs[currentLang] || msgs['it'];
        }

        return null;
    }
}
