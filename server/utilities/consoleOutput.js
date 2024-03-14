const dividerLength = 100;
const dividerChar = "-";
const headingLength = 90;
const headingChar = "*";

/**
 * Produce, in console, un riquadro formattato con l'esito delle chiamate al database o degli errori verificatisi.
 * @function
 * @param {string} headingMsg  - Messaggio dell'intestazione.
 * @param  {...(string|Array|Object)} rowsList - Lista di righe, che possono essere stringhe, array o oggetti.
 * @returns {void} - Non restituisce nulla, stampa il risultato sulla console.
 */
function formattedOutput(headingMsg, ...rowsList)
{
    const fullLine = generateString(headingLength, headingChar);
    const sideLength = Math.ceil((headingLength - headingMsg.length) / 2);
    const leftSide = generateString(sideLength - 1, headingChar) + " ";
    const rightSide = " " + generateString(headingLength - headingMsg.length - sideLength - 1, headingChar);
    console.log(fullLine);
    console.log(leftSide + headingMsg + rightSide);
    console.log(fullLine);
    rowsList.forEach( oneRow => oneRow && console.log(oneRow) );
    console.log(fullLine);
    console.log(generateString(dividerLength, dividerChar));
    console.log("");
}

/**
 * Genera una stringa con lunghezza specifica e carattere specifico.
 *
 * @function
 * @param {number} StrLength - Lunghezza della stringa.
 * @param {string} StrChar - Carattere per la stringa.
 * @returns {string} - La stringa generata.
 */
function generateString(StrLength, StrChar)
{
    let finalStr = "";
    for (let i = 1; i <= StrLength; i++ )
        finalStr += StrChar;
    return finalStr;
}

module.exports = { formattedOutput, generateString }