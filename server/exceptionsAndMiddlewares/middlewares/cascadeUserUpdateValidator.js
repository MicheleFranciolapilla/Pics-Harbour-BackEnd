const validationMiddleware = require("./validationMiddleware");
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

let schemaForUserUpdate =
{
    ...schemaForName,
    ...schemaForSurname,
    noThumb : { ...returnSchemaForRegularBooleans("noThumb") },
};

const checkNoWebsite = (req, res, next) =>
{
    const { noWebsite } = req.body;
    if (noWebsite)
    {
        if (isTruthyBooleanParam(noWebsite))
        {
            req.body.noWebsite = true;
            return next();
        }
        else
            delete req.body.noWebsite;
    }
    schemaForUserUpdate["website"] = { ...returnSchemaForUrl().website };
};

const cascadeUserUpdateValidators =
[
    checkNoWebsite,
    validationMiddleware(schemaForUserUpdate)
];

module.exports = { cascadeUserUpdateValidators }