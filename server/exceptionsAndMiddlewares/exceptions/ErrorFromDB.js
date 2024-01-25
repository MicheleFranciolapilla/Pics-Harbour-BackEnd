/**
 * Exception relativa all'impossibilità di eseguire l'operazione richiesta, per indisponibilità o rifiuto da parte del database.
 * @class
 * @extends Error
 */
class ErrorFromDB extends Error
{
    /**
     * Creazione di una nuova istanza della classe
     * @param {string} message - Messaggio di errore comunicato al client e mostrato nella console del server. 
     * @param {number} statusCode - Stato della response http
     * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server. 
     */
    constructor(message, statusCode, errBlock)
    {
        super(message);
        this.status = statusCode;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorFromDB;