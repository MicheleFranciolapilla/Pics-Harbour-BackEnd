const { stdout } = require("process");
const util = require("util");
const { style, cursor } = require("ansi-escape-sequences");

const ansi =
{
    "warning"   :   style.yellow + style.bold,
    "highlight" :   style.blue + style.bold,
    "normal"    :   style.reset + style.white,
    "proceed"   :   style.green + style.bold,
    "quit"      :   style.red + style.bold,
    "info"      :   style.white + style.bold,
    "focused"   :   style.reset + style.blue,
    "error"     :   style.reset + style.red + style.bold
}

const asyncWrite = util.promisify(stdout.write).bind(stdout);

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

const cursorCode = (cursorStr) =>
{
    // B-number:    back
    // F-number:    forward
    // U-number:    previous line
    // D-number:    next line
    // N-number:    new lines
    // O:           origin (1,1)
    // L:           line origin
    // L-number:    absolute to column
    if (!cursorStr)
        return "";
    const cursorTo = cursorStr.toUpperCase();
    const lines = (cursorTo.includes("-")) ? parseInt(cursorTo.substring(2)) : 1;
    switch (cursorTo[0])
    {
        case "N"    :   return "\n".repeat(lines);
        case "O"    :   return cursor.position(1,1);
        case "L"    :   return cursor.horizontalAbsolute(lines);
        case "B"    :   return cursor.back(lines);
        case "F"    :   return cursor.forward(lines);
        case "U"    :   return cursor.previousLine(lines);
        case "D"    :   return cursor.nextLine(lines);
    }
}

const moveCursor = async (cursorStr) => await asyncWrite(cursorCode(cursorStr));

const writeMessage = async (message, ansiStyle, cursorStr = null) => await asyncWrite(ansi[ansiStyle] + message + cursorCode(cursorStr));

const closingMessage = async (message, ansiStyle, cursorStr = null) => await asyncWrite(ansi[ansiStyle] + message + ansi.normal + cursorCode(cursorStr));

const writeQuestion = async (question, placeholder = "@@@") => await asyncWrite(setMessageStyle(question, ansi.highlight, ansi.normal, placeholder) + cursorCode("B-2"));

const writeMenuTitle = async (title, placeholder = "@@@") => await asyncWrite(setMessageStyle(title, style.underline, style.reset + ansi.info, placeholder) + cursorCode("N-2"));

const writeMenuItem = async (menuItem, isFocused, isChecked, menuLineSet, cursorStr, wholeLine = true ) =>
{
    const { focus, check, fSpaces, cSpaces, safety } = menuLineSet
    let lineArray = 
    [
        isFocused ? "@@@" + focus + "@@@" : " ",
        " ".repeat(fSpaces),
        isChecked ? "@@@" + check + "@@@" : " ",
        " ".repeat(cSpaces),
        menuItem
    ];
    const lineColor = isFocused ? "focused" : "normal";
    let styledLine = setMessageStyle(lineArray.join(""), ansi[lineColor] + style.bold, ansi[lineColor], "@@@");
    if (wholeLine)
        styledLine += " ".repeat(stdout.columns - (fSpaces + cSpaces + menuItem.length + 2 + safety));
    await asyncWrite(styledLine + cursorCode(cursorStr));
}

const line = async (char = "*") => await asyncWrite(ansi.info + char.repeat(stdout.columns) + "\n\n");

const cursorVisible = async (isVisible = true) => await asyncWrite(isVisible ? cursor.show : cursor.hide);

module.exports = { moveCursor, writeMessage, closingMessage, writeQuestion, writeMenuTitle, writeMenuItem, line, cursorVisible }
