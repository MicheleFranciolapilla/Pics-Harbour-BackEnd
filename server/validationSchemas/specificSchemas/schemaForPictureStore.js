// COME GIA' DETTO NELLO SCHEMA DI VALIDAZIONE DELLA STORE SU ROTTA PRIVATA "/categories", ANCHE SU QUESTA ROTTA PRIVATA, ESSENDO L'ACCESSO MEDIATO DA UN MIDDLEWARE AUTORIZZATIVO CHE, IN CASO FAVOREVOLE, SALVA NELLA REQUEST, TRA LE ALTRE COSE, ANCHE L'ID DEL RICHIEDENTE ACCESSO, LA "userId" DEVE ESSERE RECUPERATA DIRETTAMENTE DI LI' E DUNQUE NON PIU' SOGGETTA A VALIDAZIONE

const { tablePicturesColumnTitleSize, minTitleLength, maxDescriptionLength } = require("../../utilities/variables");

const { returnSchemaForIdLikeParams } = require("../generalSchemas/schemaForIdLikeParams");

// const userIdSchema = returnSchemaForIdLikeParams("userId", "body", true);
const categoryIdSchema = returnSchemaForIdLikeParams("categoryId", "body", false);

/** 
 * @type { import ("express-validator").Schema }
*/
module.exports =    
{
    title           :   {
                            in              :   ["body"],
                            isString        :   true,
                            trim            :   true,
                            notEmpty        :   {
                                                    errorMessage    :   "Title cannot be empty",
                                                    bail            :   true
                                                },
                            isLength        :   {
                                                    options         :   { 
                                                                            min :   minTitleLength,
                                                                            max :   tablePicturesColumnTitleSize 
                                                                        },
                                                    errorMessage    :   `Title's length must be in [${minTitleLength}...${tablePicturesColumnTitleSize}] characters`,
                                                    bail            :   true
                                                },
                            escape          :   true,
                            customSanitizer :   {
                                                    options         :   (value) => 
                                                                        (value.length > tablePicturesColumnTitleSize) 
                                                                        ? (value.slice(0, tablePicturesColumnTitleSize)) 
                                                                        : value
                                                }
                        },
    description     :   {
                            in              :   ["body"],
                            optional        :   true,
                            isString        :   true,
                            trim            :   true,
                            isLength        :   {
                                                    options         :   { max : maxDescriptionLength },
                                                    errorMessage    :   `Description's max length is ${maxDescriptionLength} characters`,
                                                    bail            :   true
                                                },
                            escape          :   true,
                            customSanitizer :   {
                                                    options         :   (value) => 
                                                                        (value.length > maxDescriptionLength) 
                                                                        ? (value.slice(0, maxDescriptionLength)) 
                                                                        : value
                                                }
                        },
    visible         :   {
                            in              :   ["body"],
                            optional        :   true,
                            isBoolean       :   {
                                                    errorMessage    :   "The field 'visible' must be boolean: values accepted: [0, 1, false, true]",
                                                    bail            :   true
                                                },
                            customSanitizer :   {   options         :   (value) =>  
                                                                        (value !== undefined)
                                                                        ? (Boolean(value))
                                                                        : undefined
                                                }
                        },
    // ...userIdSchema,
    categories      :   {
                            in              :   ["body"],
                            optional        :   true,
                            isArray         :   {
                                                    errorMessage    :   "Categories must be an array",
                                                    bail            :   true
                                                },
                            customSanitizer :   {   options         :   (value) => [...new Set(value)] }
                        },
    "categories.*"  :   categoryIdSchema.categoryId
}