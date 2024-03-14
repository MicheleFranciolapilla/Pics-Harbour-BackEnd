const { outMenuTitle, styledMenuLine, cursorUp, cursorDown, cursorToColumn } = require("./ansiForCLI");

const getMenuItem = (dataObj, index) => 
{
    const { name, options, labelForQuit } = dataObj;
    if (index === options.length)
        return "Confirm";
    else if (index > options.length)
        return labelForQuit;
    else
        switch (name)
        {
            case "tables"   :   return options[index].table;
            case "action"   :
            case "timer"    :   return options[index];
        }
}

const buildMenu = (dataObj) =>
{
    const { message, options, initialValue, includeQuit, labelForQuit } = dataObj;
    outMenuTitle(message);
    options.forEach( (_, index) =>
        {
            styledMenuLine(getMenuItem(dataObj, index), false, initialValue.includes(index), true);
        });
    styledMenuLine("Confirm", true, false, true);
    if (includeQuit)
        styledMenuLine(labelForQuit, false, false, true);
    cursorUp();
    dataObj["currentlyChecked"] = initialValue;
    dataObj["menuIndex"] = options.length;
    dataObj["maxIndex"] = (includeQuit) ? options.length + 1 : options.length; 
}

const handleNavigation = (dataObj, newIndex) =>
{
    const { menuIndex, currentlyChecked } = dataObj;
    styledMenuLine(getMenuItem(dataObj, menuIndex), false, currentlyChecked.includes(menuIndex), true, false);
    const delta = newIndex - menuIndex;
    if (delta > 0)
        cursorDown(delta);
    else
        cursorUp(delta * (-1));
    styledMenuLine(getMenuItem(dataObj, newIndex), true, currentlyChecked.includes(newIndex), true, false);
    cursorToColumn();
    dataObj.menuIndex = newIndex;
}

module.exports = { buildMenu, handleNavigation }