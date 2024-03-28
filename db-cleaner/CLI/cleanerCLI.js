const { stdin } = require("process");
const { writeMessage, writeQuestion, cursorVisible, closingMessage, line, moveCursor } = require("./ansiForCLI");
const { executeAsyncMethod, buildMenu, navigateMenu, itemIsAnOption, clickOnOption, cursorAfterConfirm, menuItemErrorMessage, timerInput, quitTimerInput } = require("./menuForCLI");
const { configData, allowedActions, timerData } = require("../cleanerConfig");

const keyEnter = "\u000D";
const keyUp = "\x1B[A";
const keyDown = "\x1B[B";
const keyEscape = "\x1b";
const keysBackSpace = ["\x08", "\x7f"];
const keysDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

let originalProcessCtrlCHandler = null;
let rawModeStatus = false;

const disableCtrlC = async () =>
{
    originalProcessCtrlCHandler = process.listeners("SIGINT").slice();
    process.removeAllListeners("SIGINT");
    await writeMessage("The 'Ctrl-C' key combination will remain disabled for the duration of the CLI.", "warning", "N-3");
}

const restoreCtrlC = async () =>
{
    if (originalProcessCtrlCHandler)
    {
        originalProcessCtrlCHandler.forEach( handler => process.on("SIGINT", handler));
        originalProcessCtrlCHandler = null;
    }
    await writeMessage("The 'Ctrl-C' key combination is enabled again.", "warning", "N-2");
}

const initialize = async () =>
{
    stdin.setEncoding("utf-8");
    // await cursorVisible(false);
    await disableCtrlC();
}

const quitCLI = async () =>
{
    await restoreCtrlC();
    await closingMessage("Thanks for using the DB cleaner CLI", "info", "N-3");
    await cursorVisible();
    process.exit();
}

const rawModeOn = () =>
{
    if (!rawModeStatus)
    {
        stdin.setRawMode(true);
        stdin.resume();
        rawModeStatus = true;
    }
}

const rawModeOff = (listener) =>
{
    stdin.removeListener("data", listener);
    if (rawModeStatus)
    {
        stdin.setRawMode(false);
        stdin.resume();
        rawModeStatus = false;
    }
}

const isValidDigit = (currentStr, digitKey, max) => !(((currentStr === "") && (digitKey === "0")) || (parseInt(currentStr + digitKey) > max));

const handleRawMode = async (dataObj) => new Promise( resolve =>
    {
        
        const answerKeyHandler = async (answerKey) =>
        {
            answerKey = answerKey.toString().toUpperCase();
            if (dataObj.allowedKeys.includes(answerKey))
            {
                rawModeOff(answerKeyHandler);
                await writeMessage(answerKey, (answerKey === dataObj.allowedKeys[0]) ? "proceed" : "quit", "N-3");
                resolve(answerKey);
            }
        }

        const menuHandler = async (navKey) =>
        {
            const { allowedKeys, menuIndex, maxIndex, type, options, required, currentlyChecked } = dataObj;
            if (allowedKeys.includes(navKey))
            {
                let newIndex = null;
                let navAction = null;
                switch (navKey)
                {
                    case keyUp      :   navAction = "nav";
                                        if (menuIndex === 0)
                                            newIndex = maxIndex;
                                        else
                                            newIndex = menuIndex - 1;
                                        break;
                    case keyDown    :   navAction = "nav";
                                        if (menuIndex === maxIndex)
                                            newIndex = 0;
                                        else
                                            newIndex = menuIndex + 1;
                                        break;
                    case keyEnter   :   navAction = "select";
                                        break;
                }
                if (navAction === "nav")
                    await navigateMenu(dataObj, newIndex);
                else if (navAction === "select")
                {
                    const isOption = itemIsAnOption(dataObj, menuIndex);
                    if (isOption && (type !== "lineInput"))
                        await clickOnOption(dataObj, menuIndex);
                    else
                    {
                        if (isOption)
                        {
                            // Input del timer
                            await clickOnOption(dataObj, menuIndex);
                            dataObj["allowedKeysCopy"] = allowedKeys;
                            dataObj.allowedKeys = [];
                            const timerInObj =
                            {
                                "message"       :   "[@@@ESC@@@] to cancel / [@@@ENTER@@@] to confirm...",
                                "distances"     :   [10, 5],
                                "dialogType"    :   "input",
                                "allowedKeys"   :   [...keysBackSpace, keyEscape, ...keysDigits, keyEnter],
                                "min"           :   timerData.minValue.msec,
                                "max"           :   timerData.maxValue.msec,
                                "currentStr"    :   "",
                                "parent"        :   dataObj
                            }
                            const timerByInput = await handleRawMode(timerInObj);
                            if (timerByInput)
                            {
                                rawModeOff(menuHandler);
                                await cursorAfterConfirm(dataObj);
                                resolve(dataObj.returned());
                            }
                        }
                        else if (menuIndex === options.length)
                        {
                            // Conferma
                            if (required && currentlyChecked.length === 0)
                                // Errore
                                await menuItemErrorMessage(dataObj, "A selected option is required", 10, 2000);
                            else
                            {
                                // OK
                                rawModeOff(menuHandler);
                                await cursorAfterConfirm(dataObj);
                                resolve(dataObj.returned());
                            }
                        }
                        else
                        {
                            // Quit
                            rawModeOff(menuHandler);
                            await cursorAfterConfirm(dataObj);
                            await quitCLI();
                            resolve();
                        }
                    }
                }
            }
        }

        const timerInputHandler = async (inputKey) =>
        {
            const { allowedKeys, currentStr, min, max } = dataObj;
            if (allowedKeys.includes(inputKey))
            {
                if (inputKey === keyEscape)
                {
                    stdin.removeListener("data", timerInputHandler);
                    await quitTimerInput(dataObj);
                    resolve(false);
                }
                else if (keysDigits.includes(inputKey))
                {
                    if (isValidDigit(currentStr, inputKey, max))
                    {
                        dataObj.currentStr += inputKey;
                        await writeMessage(inputKey, "highlight");
                    }
                }
                else if (keysBackSpace.includes(inputKey))
                {
                    if (currentStr !== "")
                    {
                        dataObj.currentStr = currentStr.slice(0, currentStr.length - 1);
                        await moveCursor("B-1");
                        await writeMessage(" ", "highlight", "B-1");
                    }
                }
                else if (inputKey === keyEnter)
                {
                    if (currentStr === "")
                        await menuItemErrorMessage(dataObj, `No value entered!`, 10, 2000);
                    else if (parseInt(currentStr) < min)
                        await menuItemErrorMessage(dataObj, `The value cannot be lower than ${min} msec`, 10, 2000);
                    else
                    {
                        stdin.removeListener("data", timerInputHandler);
                        dataObj.parent["dataFromInput"] = parseInt(currentStr);
                        quitTimerInput(dataObj, false);
                        resolve(true);
                    }
                }
            }
        }

        rawModeOn();
        ( async () => 
            {
                let method = null;
                let arguments = null;
                switch (dataObj.dialogType)
                {
                    case "simple"   :   method = writeQuestion;
                                        arguments = dataObj.message;
                                        dataObj["handler"] = answerKeyHandler;
                                        break;
                    case "menu"     :   method = buildMenu;
                                        arguments = dataObj;
                                        dataObj["handler"] = menuHandler;
                                        break;
                    case "input"    :   method = timerInput;
                                        arguments = dataObj;
                                        dataObj["handler"] = timerInputHandler;
                                        break;
                }
                await executeAsyncMethod(method, arguments);
                stdin.on("data", dataObj.handler);
            })();
    });
    
const getOption = async (basicObj) =>
{
    const dataObj = { ...basicObj, "allowedKeys" : [keyEnter, keyUp, keyDown], "dialogType" : "menu" };
    const option = await handleRawMode(dataObj);
    return option;
}

const getAllOptions = async () =>
{
    const optionsData =
    [
        {
            "name"          :   "tables",
            "message"       :   "Select the table/s to clean (@@@multiple selection allowed@@@)...",
            "options"       :   configData.map( ({ model, table, prime }) => ({ model, table, prime })),
            "type"          :   "check",
            get 
            initialValue()      { return this.options.map( (_, index) => index) },
            "required"      :   true,
            "includeQuit"   :   true,
            "labelForQuit"  :   "Quit",
            "confirmLabel"  :   "Confirm",
            "returned"      :   function() {  return this.currentlyChecked.reduce( (acc, current) => this.options[current].prime * acc, 1); }
        },
        {
            "name"          :   "action",
            "message"       :   "Select the action (@@@multiple selection not allowed@@@)...",
            "options"       :   allowedActions,
            "type"          :   "radio",
            "initialValue"  :   [0],
            "required"      :   true,
            "includeQuit"   :   true,
            "labelForQuit"  :   "Quit",
            "confirmLabel"  :   "Confirm",
            "returned"      :   function() { return this.options[this.currentlyChecked[0]]; }
        },
        {
            "name"          :   "timer",
            "message"       :   `Enter the time interval (milliseconds) between cleaning cycles. (@@@Minimum value allowed: [${timerData.minValue.msec} - (${timerData.minValue.str})]@@@) / (@@@Maximum value allowed: [${timerData.maxValue.msec} - (${timerData.maxValue.str})]@@@)...`,
            "options"       :   ["Input"],
            "type"          :   "lineInput",
            "initialValue"  :   [],
            "defaultValue"  :   timerData.minValue.msec * 3,
            "includeQuit"   :   true,
            "labelForQuit"  :   "Quit",
            get
            confirmLabel()      { return `Confirm default: ${this.defaultValue} msec` },
            "returned"      :   function() { return this.dataFromInput ?? this.defaultValue }
        }
    ];

    await line();
    let request = {};
    for (let index = 0; index < optionsData.length; index++)
    {
        if ((optionsData[index].name !== "timer") || (request["action"] === "set"))
            request[optionsData[index].name] = await getOption(optionsData[index]);
    }
    return request;
}

const quitOrProceed = async (isFirstQuestion = true) =>
{

    const question =    (isFirstQuestion)
                        ? "Please press: '@@@P@@@' (proceed) or '@@@Q@@@' (quit) ...   [ ]"
                        : "Run db Cleaner again - [@@@Y@@@/@@@N@@@]? ...   [ ]";
    dataObj =
    {
        "message"       :   question,
        "dialogType"    :   "simple",
        "allowedKeys"   :   (isFirstQuestion) ? ["P", "Q"] : ["Y", "N"]
    };
    const answerKey = await handleRawMode(dataObj);
    if (answerKey === dataObj.allowedKeys[0])
    {
        const request = await getAllOptions();
        console.log(request);
        process.exit();
    }
    else
        await quitCLI();
}

// IIFE
( async () =>
{
    await initialize();
    await quitOrProceed();
})()