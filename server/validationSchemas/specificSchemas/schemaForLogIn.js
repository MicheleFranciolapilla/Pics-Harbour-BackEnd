const { returnSchemaForEmail } = require("../generalSchemas/schemaForEmail");
const { returnSchemaForPassword } = require("../generalSchemas/schemaForPassword");

/**
* @type { import("express-validator").Schema }
*/

module.exports =    
{ 
    ...returnSchemaForEmail(),
    ...returnSchemaForPassword("password")
}