const readline = require("readline");
const { stdin, stdout } = require("process");
const { cursorVisible, cursorUp, outLine, outWarning, outInfo, outChoose, outChoise } = require("./ansiForCLI");
const { buildMenu, handleNavigation } = require("./menuForCLI");
const { configData, allowedActions, timerMinValue } = require("../cleanerConfig");

const keyEnter = "\u000D";
const keyUp = "\x1B[A";
const keyDown = "\x1B[B";

let cmd = null;
let originalProcessCtrlCHandler = null;

const initialize = () =>
{
    stdin.setEncoding("utf-8");
    // cursorVisible(false);
    disableCtrlC();
}

const initializecmd = () =>
{
    cmd = readline.createInterface({ input : stdin, output : stdout });
    cmd.removeAllListeners("SIGINT");
}

const disableCtrlC = () =>
{
    outWarning("The 'Ctrl-C' key combination will remain disabled for the duration of the CLI.");
    originalProcessCtrlCHandler = process.listeners("SIGINT").slice();
    process.removeAllListeners("SIGINT");
}

const restoreCtrlC = () =>
{
    if (originalProcessCtrlCHandler)
    {
        originalProcessCtrlCHandler.forEach( handler => process.on("SIGINT", handler));
        originalProcessCtrlCHandler = null;
    }
    outWarning("The 'Ctrl-C' key combination is enabled again.");
}

const quitCLI = () =>
{
    outInfo("Thanks for using the DB cleaner CLI");
    stdin.setRawMode(false);
    restoreCtrlC();
    cursorVisible();
    process.exit();
}

const rawModeOn = () =>
{
    stdin.setRawMode(true);
    stdin.resume();
}

const rawModeOff = (listener) =>
{
    stdin.removeListener("data", listener);
    stdin.setRawMode(false);
    stdin.resume();
}

const handleRawMode = async (dataObj) => new Promise( resolve =>
    {
        const resetAfterKeypressed = (answerKey) =>
        {
            rawModeOff(handleKeyPressed);
            outChoise(answerKey, answerKey === dataObj.allowedKeys[0]);
        }

        const handleKeyPressed = (answerKey) =>
        {
            answerKey = answerKey.toString().toUpperCase();
            if (dataObj.allowedKeys.includes(answerKey))
            {
                resetAfterKeypressed(answerKey);
                resolve(answerKey);
            }
        }

        const handleDynamicSelection = (navigationKey) =>
        {
            const { rawModeAllowedKeys, menuIndex, maxIndex } = dataObj;
            if (rawModeAllowedKeys.includes(navigationKey))
            {
                let newIndex = null;
                let navAction = null;
                switch (navigationKey)
                {
                    case keyUp      :   if (menuIndex === 0)
                                            newIndex = maxIndex;
                                        else
                                            newIndex = menuIndex - 1;
                                        navAction = "nav";
                                        break;
                    case keyDown    :   if (menuIndex === maxIndex)
                                            newIndex = 0;
                                        else
                                            newIndex = menuIndex + 1;
                                        navAction = "nav"; 
                                        break;
                    case keyEnter   :   break;
                }
                if (navAction === "nav")
                    handleNavigation(dataObj, newIndex);
                else
                    resolve();
            }
        }

        rawModeOn();
        if (dataObj.dynamic)    
        {
            buildMenu(dataObj);
            stdin.on("data", handleDynamicSelection);
        }
        else
        {
            outChoose(dataObj.message);
            stdin.on("data", handleKeyPressed);
        }
    });

const getOption = async (baseObj) => 
{
    const dataObj = { ...baseObj, "rawModeAllowedKeys" : [keyEnter, keyUp, keyDown], "dynamic" : true };
    await handleRawMode(dataObj);
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
            initialValue()      { return this.options.map( (_, index) => index)},
            "includeQuit"   :   true,
            "labelForQuit"  :   "Quit"
        },
        {
            "name"          :   "action",
            "message"       :   "Select the action (@@@multiple selection not allowed@@@)...",
            "options"       :   allowedActions,
            "type"          :   "radio",
            "initialValue"  :   [0],
            "includeQuit"   :   true,
            "labelForQuit"  :   "Quit"
        },
        {
            "name"          :   "timer",
            "message"       :   `Enter the time interval (milliseconds) between cleaning cycles. (@@@Minimum value allowed: [${timerMinValue}]@@@)...`,
            "options"       :   ["Input", "Default"],
            "type"          :   "mixed",
            "initialValue"  :   [1],
            "defaultValue"  :   timerMinValue,
            "includeQuit"   :   true,
            "labelForQuit"  :   "Quit"
        }
    ];
    outLine("*");
    let request = {};
    for (let index = 0; index < optionsData.length; index++)
    {
        // if ((optionsData[index].name !== "timer") || (request["action"] === "set"))
            request[optionsData[index].name] = await getOption(optionsData[index]);
    }
    return request;
}

const quitOrProceed = async (isFirstQuestion = true) =>
{
    const question =    (isFirstQuestion)  
                        ? "Please press: '@@@P@@@' (proceed) or '@@@Q@@@' (quit) ...   [ ]"
                        : "Run db Cleaner again - [@@@Y@@@/@@@N@@@]? ...   [ ]"
    dataObj = 
    {
        "message"       :   question,
        "dynamic"       :   false,
        "allowedKeys"   :   (isFirstQuestion ? ["P", "Q"] : ["Y", "N"])
    };
    const answerKey = await handleRawMode(dataObj);
    if (answerKey === dataObj.allowedKeys[0])
    {
        const request = await getAllOptions();
    }
    else
        quitCLI();
}

// IIFE
( async () =>
{
    initialize();
    await quitOrProceed();
})()