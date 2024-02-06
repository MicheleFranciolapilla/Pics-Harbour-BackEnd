/** 
*Questo modulo fornisce una funzione che restituisce uno schema di Express Validator per la validazione di parametri stringa non nulli, regolari e di lunghezza stabilita, quali nomi, cognomi, titoli. 
*
* @module returnSchemaForRegularStrings
*/

const { normalizeSpaces, upperStartingChar } = require("../../utilities/general");

/**
* @type { import("express-validator").Schema }
*/

/**
* Restituisce uno schema di Express Validator per la validazione di parametri stringa non nulli, regolari e di lunghezza stabilita.
*
* @param {string} fieldName - Nome del parametro da validare
* @param {number} minValueLength - Lunghezza minima consentita per il parametro
* @param {number} maxValueLength - Lunghezza massima consentita per il parametro
* @param {boolean} truncateIfLonger - Flag utilizzato nel caso di lunghezza eccessiva del parametro.
* @param {boolean} upperAllFirstChars - In caso di stringa con più parole, indica se tutte le iniziali devono essere maiuscole
* Consente di stabilire se troncare il parametro alla lunghezza massima o lanciare un errore di validazione
* @returns {Object} - Oggetto 'schema' di express validator utilizzabile dal metodo 'checkSchema'
*/
// N.B. Si è scelto di utilizzare, in isLength, solo il valore minimo, per poter utilizzare anche la sintassi del custom validator per il valore massimo
const returnSchemaForRegularStrings = (fieldName, minValueLength, maxValueLength, truncateIfLonger, upperAllFirstChars) =>   
    ({
        [fieldName] :   {
                            in              :   ["body"],
                            isString        :   true,
                            trim            :   true,
                            notEmpty        :   {
                                                    errorMessage    :   `The field [${fieldName}] cannot be empty`,
                                                    bail            :   true
                                                },
                            isLength        :   {
                                                    options         :   { min : minValueLength },
                                                    errorMessage    :   `The field [${fieldName}] cannot be shorter than ${minValueLength} characters`
                                                },
                            matches         :   {
                                                    options         :   /^[a-zA-Z ]+$/,
                                                    errorMessage    :   `The field [${fieldName}] can only contain letters and spaces`,
                                                    bail            :   true
                                                },
                            customSanitizer :   {   
                                                    options         :   (value) =>  
                                                                        {
                                                                            // Normalizzazione personalizzata del parametro
                                                                            value = upperStartingChar(normalizeSpaces(value), upperAllFirstChars);
                                                                            if ((value.length > maxValueLength) && (truncateIfLonger))
                                                                                    return value.slice(0, maxValueLength);
                                                                            else
                                                                                return value;
                                                                        }
                                                },
                            custom          :   {
                                                    options         :   (value) =>
                                                                        {
                                                                            if ((value.length > maxValueLength) && (!truncateIfLonger))
                                                                                return Promise.reject(`The field [${fieldName}] cannot be longer than ${maxValueLength} characters`);
                                                                            else
                                                                                return true;
                                                                        }
                                                }
                        }
    });

module.exports = { returnSchemaForRegularStrings }