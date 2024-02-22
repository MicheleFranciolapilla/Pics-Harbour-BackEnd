const { minPasswordLength, maxPasswordLength } = require("../../utilities/variables");

/** 
*Questo modulo fornisce una funzione che restituisce uno schema di Express Validator per la validazione della password. 
*
* @module returnSchemaForPassword
*/

/**
* @type { import("express-validator").Schema }
*/

/**
* Restituisce uno schema di Express Validator per la validazione della password.
*
* @returns {Object} - Oggetto 'schema' di express validator utilizzabile dal metodo 'checkSchema'
*/
const returnSchemaForPassword = (pswString) =>   
    ({
        [pswString] :   {
                            in                  :   ["body"],
                            trim                :   true,
                            notEmpty            :   {
                                                        errorMessage    :   `The field [${pswString}] cannot be empty`,
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

module.exports = { returnSchemaForPassword }