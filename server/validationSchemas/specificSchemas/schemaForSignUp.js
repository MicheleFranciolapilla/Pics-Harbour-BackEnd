const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");
const { returnSchemaForEmailAndPsw } = require("../generalSchemas/schemaForEmailAndPsw");
const { tableUsersColumnNameSize, tableUsersColumnSurnameSize, minUsersNameLength, minUsersSurnameLength } = require("../../utilities/variables");

const schemaForName = returnSchemaForRegularStrings("name", minUsersNameLength, tableUsersColumnNameSize, false, true);
const schemaForSurname = returnSchemaForRegularStrings("surname", minUsersSurnameLength, tableUsersColumnSurnameSize, false, true);
const schemaForEmailAndPsw = returnSchemaForEmailAndPsw();

/**
* @type { import("express-validator").Schema }
*/
module.exports =    {
                        ...schemaForName,
                        ...schemaForSurname,
                        ...schemaForEmailAndPsw
                    }

