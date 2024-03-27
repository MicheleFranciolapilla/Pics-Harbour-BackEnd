const { moveCursor, writeMenuTitle, writeMenuItem } = require("./ansiForCLI");

const menuLineSet =
{
    "focus"     :   ">",
    "check"     :   "\u2713",
    "fSpaces"   :   3,
    "cSpaces"   :   2,
    "safety"    :   2
}

const getMenuItem = (dataObj, optIndex) =>
{
    const { options, confirmLabel, labelForQuit, name } = dataObj;
    if (optIndex === options.length)
        return confirmLabel;
    else if (optIndex > options.length)
        return labelForQuit;
    else
        switch (name)
        {
            case "tables"   :   return options[optIndex].table;
            case "action"   :
            case "timer"    :   return options[optIndex];
        }
}

const getIndexDelta = (dataObj, index) =>
{
    const { maxIndex, menuIndex } = dataObj;
    let indexToGoTo = 0;
    if ((typeof index === "string") && (index.toUpperCase() === "LAST"))
        indexToGoTo = maxIndex;
    else if ((typeof index === "number") && ((index >= 0) && (index <= maxIndex)))
        indexToGoTo = parseInt(index.toString());
    return indexToGoTo - menuIndex;
}

const getCursorStr = (delta) => (delta === 0) ? "L" : (delta > 0 ? `D-${delta.toString()}` : `U-${Math.abs(delta).toString()}`);

const buildMenu = async (dataObj) =>
{
    const { message, options, initialValue, confirmLabel, includeQuit, labelForQuit } = dataObj;
    await writeMenuTitle(message);
    for (let optIndex = 0; optIndex < options.length; optIndex++ )
        await writeMenuItem(getMenuItem(dataObj, optIndex), false, initialValue.includes(optIndex), menuLineSet, "N-1");
    await writeMenuItem(confirmLabel, true, false, menuLineSet, includeQuit ? "N-1" : "L");
    if (includeQuit)
        await writeMenuItem(labelForQuit, false, false, menuLineSet, "U-1");
    dataObj["currentlyChecked"] = initialValue;    
    dataObj["menuIndex"] = options.length;
    dataObj["maxIndex"] = (includeQuit) ? options.length + 1 : options.length;
}

const navigateMenu = async (dataObj, newIndex) =>
{
    const { menuIndex, currentlyChecked } = dataObj;
    // Consideriamo anche il caso "delta = 0" ma solo per completezza, poichè, essendo "navigateMenu" invocata a seguito di click su/giù, il cambio di rigo è certo
    await writeMenuItem(getMenuItem(dataObj, menuIndex), false, currentlyChecked.includes(menuIndex), menuLineSet, getCursorStr(getIndexDelta(dataObj, newIndex)));
    await writeMenuItem(getMenuItem(dataObj, newIndex), true, currentlyChecked.includes(newIndex), menuLineSet, "L");
    dataObj.menuIndex = newIndex;
}

const itemIsAnOption = (dataObj, itemIndex) => itemIndex < dataObj.options.length;

const toggleOptionCheck = (dataObj, index) =>
{
    const indexPosition = dataObj.currentlyChecked.findIndex( checkedItem => checkedItem === index);
    if (indexPosition === -1)
        dataObj.currentlyChecked.push(index);
    else
        dataObj.currentlyChecked.splice(indexPosition, 1);
    // Si restituisce lo stato corrente di check dell'opzione.... se indexPosition = -1 significa che originariamente non era checked, quindi ora lo è
    return (indexPosition === -1);
}

const clickOnOption = async (dataObj, index) =>
{
    const { type } = dataObj;
    switch (type)
    {
        case "check"        :   const checkStatus = toggleOptionCheck(dataObj, index);
                                await writeMenuItem(getMenuItem(dataObj, index), true, checkStatus, menuLineSet, "L");
                                break;
        case "radio"        :   const current = dataObj.currentlyChecked[0];
                                if (current !== index)
                                {
                                    const delta = getIndexDelta(dataObj, current);
                                    await moveCursor(getCursorStr(delta));
                                    await writeMenuItem(getMenuItem(dataObj, current), false, false, menuLineSet, getCursorStr(delta * (-1)));
                                    await writeMenuItem(getMenuItem(dataObj, index), true, true, menuLineSet, "L");
                                    dataObj.currentlyChecked[0] = index;
                                }
                                break;
        case "lineInput"    :   break;
    }
}

module.exports = { buildMenu, navigateMenu, itemIsAnOption, clickOnOption }