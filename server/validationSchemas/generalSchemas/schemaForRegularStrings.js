/** 
*Questo modulo fornisce una funzione che restituisce uno schema di Express Validator per la validazione di parametri stringa non nulli, regolari e di lunghezza stabilita, quali nomi, cognomi, titoli. 
*
* @module returnSchemaForRegularStrings
*/

const { normalizeSpaces, upperStartingChar } = require("../../utilities/general");
const ErrorRequestValidation = require("../../exceptionsAndMiddlewares/exceptions/ErrorRequestValidation");

/**
* @type { import("express-validator").Schema }
*/

/**
* Restituisce uno schema di Express Validator per la validazione di parametri stringa non nulli, regolari e di lunghezza stabilita.
*
* @param {string} fieldName - Nome del parametro da validare
* @param {number} maxValueLength - Lunghezza massima consentita per il parametro
* @param {boolean} truncateIfLonger - Flag utilizzato nel caso di lunghezza eccessiva del parametro.
* Consente di stabilire se troncare il parametro alla lunghezza massima o lanciare un errore di validazione
* @returns {Object} - Oggetto 'schema' di express validator utilizzabile dal metodo 'checkSchema'
*/
const returnSchemaForRegularStrings = (fieldName, maxValueLength, truncateIfLonger) =>   
    ({
        [fieldName] :   {
                            in              :   ["body"],
                            trim            :   true,
                            notEmpty        :   {
                                                    errorMessage    :   `The field ${fieldName} cannot be empty`,
                                                    bail            :   true
                                                },
                            matches         :   {
                                                    options         :   /^[a-zA-Z ]+$/,
                                                    errorMessage    :   `The field ${fieldName} can only contain letters and spaces`,
                                                    bail            :   true
                                                },
                            customSanitizer :   {   options         :   (value) =>  
                                                                            {
                                                                                // Normalizzazione personalizzata del parametro
                                                                                value = upperStartingChar(normalizeSpaces(value), true);
                                                                                if (value.length > maxValueLength)
                                                                                {
                                                                                    // Se di lunghezza eccessiva il parametro viene troncato alla lunghezza massima o...
                                                                                    if (truncateIfLonger)
                                                                                        return value.slice(0, maxValueLength);
                                                                                    // ... si lancia un errore di validazione
                                                                                    else
                                                                                        throw new ErrorRequestValidation(`The field ${fieldName} cannot be longer than ${maxValueLength} characters.`, `SCHEMA FOR REGULAR STRINGS: ${fieldName}`);
                                                                                }
                                                                            else
                                                                                return value;
                                                                            }
                                                }
                        }
    });

module.exports = { returnSchemaForRegularStrings }