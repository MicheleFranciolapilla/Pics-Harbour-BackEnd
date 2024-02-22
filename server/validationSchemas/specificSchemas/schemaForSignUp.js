const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");
const { returnSchemaForEmail } = require("../generalSchemas/schemaForEmail");
const { returnSchemaForPassword } = require("../generalSchemas/schemaForPassword");
const { tableUsersColumnNameSize, tableUsersColumnSurnameSize, minUsersNameLength, minUsersSurnameLength } = require("../../utilities/variables");

const schemaForName = returnSchemaForRegularStrings("name", minUsersNameLength, tableUsersColumnNameSize, false, true);
const schemaForSurname = returnSchemaForRegularStrings("surname", minUsersSurnameLength, tableUsersColumnSurnameSize, false, true);

/**
* @type { import("express-validator").Schema }
*/
module.exports =    {
                        ...schemaForName,
                        ...schemaForSurname,
                        ...returnSchemaForEmail(),
                        ...returnSchemaForPassword("password")
                    }

