const { checkSchema, validationResult } = require("express-validator");

const ErrorRequestValidation = require("../exceptions/ErrorRequestValidation");

const { deleteFileBeforeThrow } = require("../../utilities/fileManagement");

/**
 * Middleware di gestione del risultato della validazione
 */

// Poichè il middleware "validationOutcome", in caso di validazione non positiva, termina il processo, invocando un errore, c'è la necessità di provvedere preventivamente a cancellare l'eventuale file caricato da multer che, altrimenti, resterebbe salvato inutilmente nel server.
const validationOutcome = async (req, res, next) =>
{
    console.log("VALIDATION MIDDLEWARE")
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty())
    {
        // Nel caso di validazione con errori si verifica l'esistenza del file eventualmente (a seconda della rotta chiamata) caricato precedentemente dal middleware di multer e, se presente, si provvede alla sua cancellazione, comunicando al server l'esito favorevole o meno dell'operazione
        const { file } = req;
        if (file)
            await deleteFileBeforeThrow(file, "VALIDATION MIDDLEWARE");
        return next(new ErrorRequestValidation(validationErrors.array(), "VALIDATION MIDDLEWARE"));
    }
    else
        next();
}

/**
 * Il middleware esportato restituisce, alle rotte chiamanti, un array con due elementi: 
 * il checkSchema di express validator ed il middleware custom di gestione del risultato della validazione
 *
 * @param {Object} schema - Lo schema di validazione da applicare ai parametri della richiesta
 * @returns {Array} - Un array contenente le funzioni di verifica dello schema e il gestore degli errori di validazione
 */

module.exports = (schema) => [checkSchema(schema), validationOutcome];

module.exports.validationOutcome = validationOutcome;