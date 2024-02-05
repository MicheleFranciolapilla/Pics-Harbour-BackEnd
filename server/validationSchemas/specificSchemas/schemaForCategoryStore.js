const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");
const { returnSchemaForIdLikeParams } = require("../generalSchemas/schemaForIdLikeParams");
const { tableCategoriesColumnNameSize, minCategoriesNameLength } = require("../../utilities/variables");

const schemaForName = returnSchemaForRegularStrings("name", minCategoriesNameLength, tableCategoriesColumnNameSize, false, false);
const schemaForUserId = returnSchemaForIdLikeParams("userId", "body", true);

/**
* @type { import("express-validator").Schema }
*/
module.exports =
{
    ...schemaForName,
    ...schemaForUserId
}