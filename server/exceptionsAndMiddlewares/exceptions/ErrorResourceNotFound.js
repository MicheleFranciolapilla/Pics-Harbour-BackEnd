/**
 * Exception generata a seguito di risorsa (rotta o dato) non trovata.
 * @class
 * @extends Error
 */
class ErrorResourceNotFound extends Error
{
    /**
     * Creazione di una nuova istanza della classe     
     * @param {string} resource - Identifica il tipo di risorsa richiesta e non trovata: rotta o dato.
     * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server.
     */
    constructor(resource, errBlock)
    {
        super(`Error 404: ${resource} not found!`);
        this.status = 404;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorResourceNotFound;