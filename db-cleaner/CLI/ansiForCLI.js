const { style, cursor } = require("ansi-escape-sequences");
const { stdout } = require("process");

const combo = 
{
    "warning"       :   style.reset + style.yellow + style.bold,
    "info"          :   style.reset + style.white + style.bold,
    "focus"         :   style.reset + style.blue + style.bold,
    "proceedKey"    :   style.reset + style.green + style.bold,
    "quitKey"       :   style.reset + style.red + style.bold,
}

const keyCheck = "\u2713";
const keyFocus = ">";

const setMessageStyle = (message, styleOdd, styleEven, ph) =>
{
    let styledMessage = styleEven;
    let occurrencesCounter = 1;
    let startingIndex = 0;
    let index = message.indexOf(ph);
    while (index !== -1)
    {
        const styleToAdd = (occurrencesCounter % 2 === 1) ? styleOdd : styleEven;
        styledMessage += message.substring(startingIndex, index).concat(styleToAdd);
        occurrencesCounter++;
        startingIndex = index + ph.length;
        index = message.indexOf(ph, startingIndex);
    }
    styledMessage += message.substring(startingIndex);
    return styledMessage;
}

const cursorVisible = (isVisible = true) => stdout.write(isVisible ? cursor.show : cursor.hide);

const cursorUp = (lines = 1) => stdout.write(cursor.previousLine(lines));

const cursorDown = (lines = 1) => stdout.write(cursor.nextLine(lines));

const cursorToColumn = (column = 1) => stdout.write(cursor.horizontalAbsolute(column));

const outLine = (char, top = true) => stdout.write("\n".repeat(top ? 2 : 1) + combo.focus + char.repeat(stdout.columns) + "\n".repeat(top ? 2 : 3));

const outWarning = (message) => stdout.write(combo.warning + message + "\n\n" + style.reset);

const outInfo = (message) => stdout.write(combo.info + message + "\n\n");

const outChoose = (message, ph = "@@@") => stdout.write(setMessageStyle(message, combo.focus, style.reset, ph) + cursor.back(2));

const outChoise = (choiseKey, isProceed) => stdout.write(setMessageStyle("@" + choiseKey + "@\n\n", isProceed ? combo.proceedKey : combo.quitKey, style.reset, "@"));

const outMenuTitle = (message, ph = "@@@") => stdout.write("\n" + setMessageStyle(message, combo.info + style.underline, combo.info, ph) + style.reset + "\n\n");

const styledMenuLine = (menuItem, isFocused, isChecked, out, newLine = true) =>
{
    let lineItemArray = [combo.focus, keyFocus, "   ", combo.info, keyCheck, "  ", style.reset, menuItem];
    if (!isChecked)
    {
        lineItemArray.splice(4, 1, " ");
        lineItemArray.splice(3, 1, "");
    }
    if (!isFocused)
    {
        lineItemArray.splice(1, 1, " ");
        lineItemArray.splice(0, 1, "");
    }
    const styledLine = lineItemArray.join("");
    if (out)
    {
        // Nel caso di stampa a video si inserisce styledLine dentro una stringa di lunghezza pari alla larghezza del terminale (meno un paio di caratteri, per sicurezza) in modo da sovrascrivere i dati precedenti (utile durante la navigazione)
        stdout.write(styledLine + " ".repeat(stdout.columns - (7 + 2 + menuItem.length)));
        if (newLine)
            stdout.write("\n");
    }
    return styledLine;
}

module.exports = { cursorVisible, cursorUp, cursorDown, cursorToColumn, outLine, outWarning, outInfo, outChoose, outChoise, outMenuTitle, styledMenuLine }