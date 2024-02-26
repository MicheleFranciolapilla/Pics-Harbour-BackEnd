const { tableUsersColumnWebSite } = require("../../utilities/variables");

/** 
*Questo modulo fornisce una funzione che restituisce uno schema di Express Validator per la validazione dell'url. 
*
* @module returnSchemaForUrl
*/

/**
* @type { import("express-validator").Schema }
*/

/**
* Restituisce uno schema di Express Validator per la validazione dell'url.
*
* @returns {Object} - Oggetto 'schema' di express validator utilizzabile dal metodo 'checkSchema'
*/
const returnSchemaForUrl = () =>   
    ({
        website     :   {
                            in                  :   ["body"],
                            optional            :   true,
                            trim                :   true,
                            toLowerCase         :   true,
                            isURL               :   {   
                                                        errorMessage    :   "Invalid URL",
                                                        bail            :   true 
                                                    },
                            isLength            :   {
                                                        options         :   { max : tableUsersColumnWebSite },
                                                        errorMessage    :   `Maximum URL length is ${tableUsersColumnWebSite} chars`
                                                    }
                        }
    });

module.exports = { returnSchemaForUrl }