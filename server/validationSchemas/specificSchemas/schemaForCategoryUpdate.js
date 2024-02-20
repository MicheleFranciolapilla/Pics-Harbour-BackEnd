const { returnSchemaForIdLikeParams } = require("../generalSchemas/schemaForIdLikeParams");
const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");

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
    ...{    "name"          :   schemaForOptionalName },
            "disconnect"    :   {
                                    in              :   ["body"],
                                    optional        :   true,
                                    isBoolean       :   {
                                                            errorMessage    :   "The field 'disconnect' must be boolean: values accepted: [0, 1, false, true]",
                                                            bail            :   true
                                                        },
                                    customSanitizer :   {   options         :   (value) =>  (value !== undefined)
                                                                                            ? ((value === true) || (value === "true") || (value == 1))
                                                                                            : undefined
                                                        }
                        }
}