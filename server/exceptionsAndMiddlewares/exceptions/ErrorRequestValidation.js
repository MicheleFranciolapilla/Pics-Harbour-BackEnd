/**
 * Exception generata durante la validazione dei dati nella request.
 * @class
 * @extends Error
 */
class ErrorRequestValidation extends Error
{
    /**
     * Creazione di una nuova istanza della classe     
     * @param {Object[]} valErrors - Array di oggetti relativi agli errori di validazione (express validator)
     * @param {string} errBlock - Informazioni aggiuntive utili all'individuazione del blocco in cui è stata invocata l'eccezione e visualizzate nel blocco informativo nella console del server. 
     */
    constructor(valErrors, errBlock)
    {
        super("Errors in request validation");
        this.status = 422;
        this.errorBlock = errBlock;
        this.validationErrors = valErrors;
    }
}

module.exports = ErrorRequestValidation;