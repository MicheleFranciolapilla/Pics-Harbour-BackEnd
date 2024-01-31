const { returnSchemaForRegularStrings } = require("../generalSchemas/schemaForRegularStrings");
const { tableUsersColumnNameSize, tableUsersColumnSurnameSize, tableUsersColumnEmailSize } = require("../../utilities/variables");
const { minEmailLength, minPasswordLength, maxPasswordLength } = require("../../utilities/variables");

const schemaForName = returnSchemaForRegularStrings("name", tableUsersColumnNameSize, false);
const schemaForSurname = returnSchemaForRegularStrings("surname", tableUsersColumnSurnameSize, false);

/**
* @type { import("express-validator").Schema }
*/

module.exports =    {
                        ...schemaForName,
                        ...schemaForSurname,
                        email       :   {
                                            in          :   ["body"],
                                            trim        :   true,
                                            notEmpty    :   {
                                                                errorMessage    :   "Email address cannot be empty",
                                                                bail            :   true
                                                            },
                                            isEmail     :   {   
                                                                errorMessage    :   "Email address is not valid",
                                                                bail            :   true 
                                                            },
                                            isLength    :   {
                                                                options         :   {
                                                                                        min :   minEmailLength,
                                                                                        max :   tableUsersColumnEmailSize  
                                                                                    },
                                                                errorMessage    :   `Email address length must be in [${minEmailLength}...${tableUsersColumnEmailSize}]`
                                                            }
                                        },
                        password    :   {
                                            in                  :   ["body"],
                                            trim                :   true,
                                            notEmpty            :   {
                                                                        errorMessage    :   "Password cannot be empty",
                                                                        bail            :   true
                                                                    },
                                            isStrongPassword    :   {
                                                                        options         :   {
                                                                                                minLength       :   minPasswordLength,
                                                                                                maxLength       :   maxPasswordLength,
                                                                                                minLowercase    :   1,
                                                                                                minUppercase    :   1,
                                                                                                minNumbers      :   1,
                                                                                                minSymbols      :   1
                                                                                            },
                                                                        errorMessage    :   `Password length must be in [${minPasswordLength}...${maxPasswordLength}]. It must contain lowercase, uppercase, digit, symbol (atleast 1 of each)`
                                                                    }
                                        }
                    }

