const { tableUsersColumnEmailSize, minEmailLength } = require("../../utilities/variables");

/** 
*Questo modulo fornisce una funzione che restituisce uno schema di Express Validator per la validazione della email. 
*
* @module returnSchemaForEmail
*/

/**
* @type { import("express-validator").Schema }
*/

/**
* Restituisce uno schema di Express Validator per la validazione della email.
*
* @returns {Object} - Oggetto 'schema' di express validator utilizzabile dal metodo 'checkSchema'
*/
const returnSchemaForEmail = () =>   
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
                        }
    });

module.exports = { returnSchemaForEmail }