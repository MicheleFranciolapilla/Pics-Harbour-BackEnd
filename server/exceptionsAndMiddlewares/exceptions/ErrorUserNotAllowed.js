/**
* Exception generata a seguito di richiesta di operazione non autorizzata all'utente in questione
* @class
* @extends Error
*/
class ErrorUserNotAllowed extends Error
{
    /**
    * Creazione di una nuova istanza della classe     
    * @param {string} message - Messaggio di errore
    * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server.
    */
    constructor(message, errBlock)
    {
        super(message);
        this.status = 403;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorUserNotAllowed;