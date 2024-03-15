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
        styledMenuLine(labelForQuit, false, false, true, false);
    cursorUp();
    dataObj["currentlyChecked"] = initialValue;
    dataObj["menuIndex"] = options.length;
    dataObj["maxIndex"] = (includeQuit) ? options.length + 1 : options.length; 
}

const handleNavigation = (dataObj, newIndex) =>
{
    const { menuIndex, currentlyChecked } = dataObj;
    styledMenuLine(getMenuItem(dataObj, menuIndex), false, currentlyChecked.includes(menuIndex), true, false);
    moveToItem(dataObj, newIndex);
    styledMenuLine(getMenuItem(dataObj, newIndex), true, currentlyChecked.includes(newIndex), true, false);
    cursorToColumn();
    dataObj.menuIndex = newIndex;
}

const moveToItem = (dataObj, index) =>
{
    const { options, includeQuit, menuIndex } = dataObj;
    const indexToGoTo = ((typeof index === "string") && (index.toLowerCase() === "last")) ? (includeQuit ? options.length + 1 : options.length) : index;
    const delta = indexToGoTo - menuIndex;
    if (delta > 0)
        cursorDown(delta);
    else
        cursorUp(Math.abs(delta));
    return delta;
}

const itemIsAnOption = (dataObj, index) => index < dataObj.options.length;

const toggleOptionCheck = (dataObj, optionIndex) =>
{
    const indexPosition = dataObj.currentlyChecked.findIndex( checkedOption => (checkedOption === optionIndex));
    if (indexPosition === -1)
        dataObj.currentlyChecked.push(optionIndex);
    else
        dataObj.currentlyChecked.splice(indexPosition, 1);
    // Si restituisce lo stato corrente di check dell'opzione.... se indexPosition = -1 significa che originariamente non era checked, quindi ora lo è
    return (indexPosition === -1);
}

const handleClickOnOption = (dataObj, index) =>
{
    const { type } = dataObj;
    switch (type)
    {
        case "check"    :   const checkStatus = toggleOptionCheck(dataObj, index);
                            styledMenuLine(getMenuItem(dataObj, index), true, checkStatus, true, false);
                            cursorToColumn();
                            break;
        case "radio"    :   if (!dataObj.currentlyChecked.includes(index))
                            {
                                const currentlyCheckedOption = dataObj.currentlyChecked[0];
                                moveToItem(dataObj, currentlyCheckedOption);
                                toggleOptionCheck(dataObj, currentlyCheckedOption);
                                dataObj.menuIndex = currentlyCheckedOption;
                                styledMenuLine(getMenuItem(dataObj, currentlyCheckedOption), false, false, true, false);
                                moveToItem(dataObj, index);
                                toggleOptionCheck(dataObj, index);
                                dataObj.menuIndex = index;
                                styledMenuLine(getMenuItem(dataObj, index), true, true, true, false);
                                cursorToColumn();
                            }
                            break;
    }
}

module.exports = { buildMenu, handleNavigation, moveToItem, itemIsAnOption, handleClickOnOption }