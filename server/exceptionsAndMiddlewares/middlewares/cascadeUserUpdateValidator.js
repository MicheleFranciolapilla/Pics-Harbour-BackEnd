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

const cascadeUserUpdateValidators = [dynamicSchemaGenerator, dynamicSchemaExecutor, validationOutcome];

module.exports = { cascadeUserUpdateValidators }