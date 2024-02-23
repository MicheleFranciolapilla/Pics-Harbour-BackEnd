/**
 * Rimuove le proprietà specificate da ciascun oggetto dell'array (modificando direttamente l'array passato come argomento)
 * @function
 * @param {Object[]} objectsArray - Array di oggetti da modificare
 * @param {...string} propertiesList - Lista delle proprietà da rimuovere
 * @return {Object[]} - Array originale modificato
 */
function removeProperties(objectsArray, ...propertiesList)
{
    objectsArray.forEach( item =>
        {
            propertiesList.forEach( property => delete item[property]);
        });
    return objectsArray;
}

/**
 * Restituisce una copia dell'oggetto passato, con l'aggiunta della coppia "chiave - valore" richiesta, in posizione indicata
 * @function
 * @param {Object} objectToUpdate - Oggetto da copiare ed aggiornare
 * @param {string} propertyKey - Chiave da aggiungere
 * @param {any} propertyValue - Valore da aggiungere
 * @param {Number} propertyPosition - Posizione della nuova coppia "chiave - valore"
 * @returns {Object} - Oggetto aggiornato
 */
function addPropertyAtPosition(objectToUpdate, propertyKey, propertyValue, propertyPosition)
{
    let objectToReturn = {};
    const objKeys = Object.keys(objectToUpdate);
    const objValues = Object.values(objectToUpdate);
    if ((propertyPosition >= 0) && (propertyPosition < objKeys.length))
        objKeys.forEach( (key, index) =>
            {
                if (propertyPosition == index)
                    objectToReturn[propertyKey] = propertyValue;
                objectToReturn[key] = objValues[index];
            });
    return objectToReturn;
}

/**
 * Sostituisce tutti i raggruppamenti di spazi con spazi singoli.
 * La regular expression "/ +/g" equivale a "tutti gli spazi, anche multipli (+), globalmente (g)"
 * @param {string} stringToNormalize - Stringa da normalizzare
 * @returns {string} - Stringa normalizzata
 */
const normalizeSpaces = (stringToNormalize) => stringToNormalize.replace(/ +/g, " ");

/**
 * Restituisce l'intera stringa in lowercase, con la prima lettera della prima parola in uppercase. Se "allFirstChars" è true, anche le altre parole della stringa avranno il primo carattere in uppercase.
 * N.B. La stringa in ingresso deve essere NORMALIZZATA, ovvero, laddove formata da più parole, con un solo spazio a dividerle
 * @function
 * @param {string} normalizedStringOfWords 
 * @param {boolean} allFirstChars 
 * @returns {string}
 */
function upperStartingChar(normalizedStringOfWords, allFirstChars)
{
    if ((normalizedStringOfWords === "") || (normalizedStringOfWords === " "))
        return normalizedStringOfWords;
    let wordsArray = normalizedStringOfWords.toLowerCase().split(" ");
    wordsArray[0] = wordsArray[0][0].toUpperCase() + wordsArray[0].slice(1);
    allFirstChars && (wordsArray = wordsArray.map( word => word[0].toUpperCase() + word.slice(1)));
    return wordsArray.join(" ");
}

/**
 * Funzione che restituisce un semplice slug della stringa passata come parametro
 * @param {string} stringToSlug - Stringa (preferibilmente normalizzata) da "sluggare"
 * @param {string} slugChar [slugChar="-"] - Carattere che sostituirà lo spazio
 * @returns {string} - Slug della stringa (preferibilmente normalizzata) in ingresso
 */
const basicSlug = (stringToSlug, slugChar = "-") => stringToSlug.replaceAll(" ", slugChar).toLowerCase();

module.exports = { removeProperties, addPropertyAtPosition, normalizeSpaces, upperStartingChar, basicSlug }