/**
* Exception generata a seguito del tentativo di upload di un file di tipo o estensione non desiderata o peso eccessivo.
* @class
* @extends Error
*/
class ErrorUnsupportedFile extends Error
{
    /**
    * Creazione di una nuova istanza della classe     
    * @param {string} message - Messaggio d'errore specifico.
    * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server.
    */
    constructor(message, errBlock)
    {
        super(message);
        this.status = 415;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorUnsupportedFile;