const { returnSchemaForEmailAndPsw } = require("../generalSchemas/schemaForEmailAndPsw");

const schemaForEmailAndPsw = returnSchemaForEmailAndPsw();

/**
* @type { import("express-validator").Schema }
*/

module.exports =    { ...schemaForEmailAndPsw }