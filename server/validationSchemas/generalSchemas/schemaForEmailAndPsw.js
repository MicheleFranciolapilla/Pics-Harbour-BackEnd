const { tableUsersColumnEmailSize, minEmailLength, minPasswordLength, maxPasswordLength } = require("../../utilities/variables");

/** 
*Questo modulo fornisce una funzione che restituisce uno schema di Express Validator per la validazione di email e password. 
*
* @module returnSchemaForEmailAndPsw
*/

/**
* @type { import("express-validator").Schema }
*/

/**
* Restituisce uno schema di Express Validator per la validazione di email e password.
*
* @returns {Object} - Oggetto 'schema' di express validator utilizzabile dal metodo 'checkSchema'
*/
const returnSchemaForEmailAndPsw = () =>   
    ({
        email       :   {
                            in                  :   ["body"],
                            trim                :   true,
                            notEmpty            :   {
                                                        errorMessage    :   "Email address cannot be empty",
                                                        bail            :   true
                                                    },
                            toLowerCase         :   true,
                            isEmail             :   {   
                                                        errorMessage    :   "Email address is not valid",
                                                        bail            :   true 
                                                    },
                            isLength            :   {
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
    });

module.exports = { returnSchemaForEmailAndPsw }