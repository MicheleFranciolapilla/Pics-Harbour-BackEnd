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

module.exports = { removeProperties }