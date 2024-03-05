const { returnSchemaForIdLikeParams } = require("../generalSchemas/schemaForIdLikeParams");
const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");
const { returnSchemaForRegularBooleans } = require("../generalSchemas/schemaForRegularBooleans");

const { minCategoriesNameLength, tableCategoriesColumnNameSize } = require("../../utilities/variables");
const { addPropertyAtPosition } = require("../../utilities/general");

const schemaForRequiredName = returnSchemaForRegularStrings("name", minCategoriesNameLength, tableCategoriesColumnNameSize, false, false);
const schemaForOptionalName = addPropertyAtPosition(schemaForRequiredName.name, "optional", true, 1);

/** 
 * @type { import ("express-validator").Schema }
*/
module.exports = 
{
    ...returnSchemaForIdLikeParams("id", "params", true),
    ...{ "name" : schemaForOptionalName },
    disconnect  : { ...returnSchemaForRegularBooleans("disconnect") }
}