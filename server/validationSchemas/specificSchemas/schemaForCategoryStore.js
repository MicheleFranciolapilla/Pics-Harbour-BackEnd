// AVENDO UN MIDDLEWARE DI AUTORIZZAZIONE NELL'ACCESSO ALLE ROTTE PUBBLICHE "/categories" CHE SALVA NELLA REQUEST L'OGGETTO "tokenOwner" NEL CASO DI ACCESSO CONSENTITO, LA USERID LA SI PRELEVA DIRETTAMENTE DI LI', QUINDI NON C'E' PIU' NECESSITA' DI VALIDARLA POICHE', SE L'ACCESSO E' AUTORIZZATO, ESSA E' SICURAMENTE VALIDA

const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");
// const { returnSchemaForIdLikeParams } = require("../generalSchemas/schemaForIdLikeParams");
const { tableCategoriesColumnNameSize, minCategoriesNameLength } = require("../../utilities/variables");

const schemaForName = returnSchemaForRegularStrings("name", minCategoriesNameLength, tableCategoriesColumnNameSize, false, false);
// const schemaForUserId = returnSchemaForIdLikeParams("userId", "body", true);

/**
* @type { import("express-validator").Schema }
*/
module.exports =
{
    ...schemaForName
    // ...schemaForUserId
}