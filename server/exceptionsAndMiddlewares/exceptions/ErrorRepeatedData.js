/**
 * Exception relativa all'inserimento di dato unico non valido, in quanto già presente nel db.
 * @class
 * @extends Error
 */
class ErrorRepeatedData extends Error
{
    /**
     * Creazione di una nuova istanza della classe
     * @param {string} data - Identifica il dato non valido poichè già presente.
     * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server.
     */
    constructor(data, errBlock)
    {
        super(`Invalid ${data} because already existing into the database`);
        this.status = 409;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorRepeatedData;