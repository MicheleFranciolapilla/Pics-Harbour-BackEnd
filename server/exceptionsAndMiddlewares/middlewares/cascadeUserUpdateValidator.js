const { checkSchema } = require("express-validator");

const { validationOutcome } = require("./validationMiddleware");
const { returnSchemaForRegularStrings } = require("../../validationSchemas/generalSchemas/schemaForRegularStrings");
const { returnSchemaForRegularBooleans } = require("../../validationSchemas/generalSchemas/schemaForRegularBooleans");
const { returnSchemaForUrl } = require("../../validationSchemas/generalSchemas/schemaForUrl");
const { tableUsersColumnNameSize, tableUsersColumnSurnameSize, minUsersNameLength, minUsersSurnameLength } = require("../../utilities/variables");
const { removeProperties, addPropertyAtPosition, isTruthyBooleanParam } = require("../../utilities/general");

let schemaForName = returnSchemaForRegularStrings("name", minUsersNameLength, tableUsersColumnNameSize, false, true);
let schemaForSurname = returnSchemaForRegularStrings("surname", minUsersSurnameLength, tableUsersColumnSurnameSize, false, true);
removeProperties([schemaForName.name, schemaForSurname.surname], "notEmpty");
schemaForName.name = addPropertyAtPosition(schemaForName.name, "optional", true, 1);
schemaForSurname.surname = addPropertyAtPosition(schemaForSurname.surname, "optional", true, 1);

/**
 * @function
 * Funzione incaricata di settare correttamente il valore del parametro "noWebsite" nella request, preparando la strada al generatore dello schema dinamico
 * @param {Object} req - Express request object
 * @returns {boolean} - Valore booleano identificativo del valore del parametro "noWebsite"
 */
const checkAndSetNoWebsite = (req) =>
{
    let result = false;
    const { noWebsite } = req.body;
    if (noWebsite)
    {
        if (isTruthyBooleanParam(noWebsite))
        {
            req.body.noWebsite = true;
            result = true;
        }
        else
            delete req.body.noWebsite;
    }
    return result;
}

/**
 * @function
 * Funzione incaricata di generare dinamicamente lo schema (per express-validator), includendo o meno il campo "website" in funzione del valore di "noWebsite"
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const dynamicSchemaGenerator = (req, res, next) =>
{
    const dynamicSchema =
    {
        ...schemaForName,
        ...schemaForSurname,
        noThumb : { ...returnSchemaForRegularBooleans("noThumb") },
        ...(checkAndSetNoWebsite(req) ? {} : { website : returnSchemaForUrl().website })
    }
    req.dynamicSchema = dynamicSchema;
    next();
}

/**
 * @function
 * Funzione incaricata di eseguire tutta la catena di validazioni generata da "checkSchema" in funzione dello schema dinamico
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const dynamicSchemaExecutor = (req, res, next) =>
{
    const middlewaresChain = checkSchema(req.dynamicSchema);
    let middlewareIndex = 0;
    const runNextMiddleware = () =>
    {
        if (middlewareIndex < middlewaresChain.length)
        {
            const currentMiddleware = middlewaresChain[middlewareIndex];
            middlewareIndex++;
            currentMiddleware(req, res, runNextMiddleware);
        }
        else
            next();
    }
    runNextMiddleware();
}

// Array contenente la sequenza dei middlewares di generazione, esecuzione e validazione dello schema dinamico
const cascadeUserUpdateValidators = [dynamicSchemaGenerator, dynamicSchemaExecutor, validationOutcome];

module.exports = { cascadeUserUpdateValidators }