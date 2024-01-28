/**
 * Exception generata in caso di dato errato, nella request.
 * @class
 * @extends Error
 */
class ErrorWrongData extends Error
{
    /**
     * Creazione di una nuova istanza della classe     
     * @param {string} data - Identifica il tipo di dato errato (ad esempio la password, in fase di log In) 
     * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server. 
     */
    constructor(data, errBlock)
    {
        super(`Error 401: wrong ${data}!`);
        this.status = 401;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorWrongData;
