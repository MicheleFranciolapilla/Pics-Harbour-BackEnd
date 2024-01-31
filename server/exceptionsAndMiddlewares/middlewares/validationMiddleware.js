const { checkSchema, validationResult } = require("express-validator");
const ErrorRequestValidation = require("../exceptions/ErrorRequestValidation");

/**
 * Middleware di gestione del risultato della validazione
 */

const validationOutcome = (req, res, next) =>
{
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty())
        return next(new ErrorRequestValidation(validationErrors.array(), "VALIDATION MIDDLEWARE"));
    else
        next();
}

/**
 * Il middleware esportato restituisce, alle rotte chiamanti, un array con due ulteriori middlewares: 
 * il checkSchema di express validator ed il middleware custom di gestione del risultato della validazione
 *
 * @param {Object} schema - Lo schema di validazione da applicare ai parametri della richiesta
 * @returns {Array} - Un array contenente le funzioni di verifica dello schema e il gestore degli errori di validazione
 */

module.exports = (schema) => [checkSchema(schema), validationOutcome];