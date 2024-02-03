/** 
*Questo modulo fornisce una funzione che restituisce uno schema di Express Validator per la validazione di parametri che assomigliano a un ID (intero, positivo, diverso da zero). 
*
* @module returnSchemaForIdLikeParams
*/

/** 
 * @type { import ("express-validator").Schema }
*/

/**
 * Restituisce uno schema di Express Validator per la validazione di parametri simili a un ID.
 *
 * @param {string} paramName - Nome del parametro da validare
 * @param {string} location - Posizione del parametro (params, query, body)
 * @returns {Object} - Oggetto 'schema' di express validator utilizzabile dal metodo 'checkSchema'
 */
const returnSchemaForIdLikeParams = (paramName, location, isRequired) =>
    ({
        [paramName] :   {
                            in              :   [location],

                            ...(isRequired
                            ? {notEmpty     :   {
                                                    errorMessage    :   `${paramName} is required`,
                                                    bail            :   true 
                                                }}
                            : {optional     :   true}),
                            
                            isInt           :   {
                                                    options         :   { min : 1 },
                                                    errorMessage    :   `${paramName} is not valid: it must be integer, positive, not zero`,
                                                },
                            customSanitizer :   {   options         :   (value) => parseInt(value) }
                        }
    });

module.exports = { returnSchemaForIdLikeParams }