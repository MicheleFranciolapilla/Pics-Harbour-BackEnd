const { tablePicturesColumnTitle, minTitleLength, maxDescriptionLength } = require("../../utilities/variables");

const { returnSchemaForIdLikeParams } = require("../generalSchemas/schemaForIdLikeParams");

const userIdSchema = returnSchemaForIdLikeParams("userId", "body", true);
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
                                                                            max :   tablePicturesColumnTitle 
                                                                        },
                                                    errorMessage    :   `Title's length must be in [${minTitleLength}...${tablePicturesColumnTitle}] characters`,
                                                    bail            :   true
                                                },
                            escape          :   true,
                            customSanitizer :   {
                                                    options         :   (value) => 
                                                                        (value.length > tablePicturesColumnTitle) 
                                                                        ? (value.slice(0, tablePicturesColumnTitle)) 
                                                                        : value
                                                }
                        },
    description     :   {
                            in              :   ["body"],
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
    ...userIdSchema,
    categories      :   {
                            in              :   ["body"],
                            optional        :   true,
                            isArray         :   {
                                                    errorMessage    :   "Category Ids must be grouped into the array named 'category'",
                                                    bail            :   true
                                                },
                        },
    "categories.*"  :   categoryIdSchema.categoryId

}