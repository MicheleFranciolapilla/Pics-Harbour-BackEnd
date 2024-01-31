const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");
const { returnSchemaForEmailAndPsw } = require("../generalSchemas/schemaForEmailAndPsw");
const { tableUsersColumnNameSize, tableUsersColumnSurnameSize } = require("../../utilities/variables");

const schemaForName = returnSchemaForRegularStrings("name", tableUsersColumnNameSize, false);
const schemaForSurname = returnSchemaForRegularStrings("surname", tableUsersColumnSurnameSize, false);
const schemaForEmailAndPsw = returnSchemaForEmailAndPsw();

/**
* @type { import("express-validator").Schema }
*/

module.exports =    {
                        ...schemaForName,
                        ...schemaForSurname,
                        ...schemaForEmailAndPsw
                    }

