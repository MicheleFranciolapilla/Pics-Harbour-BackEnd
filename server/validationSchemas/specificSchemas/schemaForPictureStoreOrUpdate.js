// ESSENDO L'ACCESSO MEDIATO DA UN MIDDLEWARE AUTORIZZATIVO CHE, IN CASO FAVOREVOLE, SALVA NELLA REQUEST, TRA LE ALTRE COSE, ANCHE L'ID DEL RICHIEDENTE ACCESSO, LA "userId" DEVE ESSERE RECUPERATA DIRETTAMENTE DI LI' E DUNQUE NON PIU' SOGGETTA A VALIDAZIONE

const { tablePicturesColumnTitleSize, minTitleLength, maxDescriptionLength } = require("../../utilities/variables");

const { returnSchemaForIdLikeParams } = require("../generalSchemas/schemaForIdLikeParams");
const { returnSchemaForRegularBooleans } = require("../generalSchemas/schemaForRegularBooleans");

// const userIdSchema = returnSchemaForIdLikeParams("userId", "body", true);
const categoryIdSchema = returnSchemaForIdLikeParams("categoryId", "body", false);

/** 
 * @type { import ("express-validator").Schema }
*/
const returnSchemaForPictureStoreOrUpdate = (isForStore) =>
    ({
        title           :   {
                                in              :   ["body"],
                                isString        :   true,
                                trim            :   true,
                                ...(isForStore
                                ? {notEmpty     :   {
                                                        errorMessage    :   "Title cannot be empty",
                                                        bail            :   true
                                                    }}
                                : {optional     :   true}),
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
        visible         :   { ...returnSchemaForRegularBooleans("visible") },
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
    });

module.exports = { returnSchemaForPictureStoreOrUpdate }