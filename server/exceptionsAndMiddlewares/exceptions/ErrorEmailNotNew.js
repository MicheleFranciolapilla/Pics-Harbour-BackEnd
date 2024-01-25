/**
 * Exception relativa all'inserimento di email non valida, in fase di registrazione di un nuovo utente. L'eccezione viene generata se l'email inserita è già presente del db
 * @class
 * @extends Error
 */
class ErrorEmailNotNew extends Error
{
    /**
     * Creazione di una nuova istanza della classe
     * @param {string} message - Messaggio di errore comunicato al client e mostrato nella console del server.
     * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server.
     */
    constructor(message, errBlock)
    {
        super(message);
        this.status = 409;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorEmailNotNew;