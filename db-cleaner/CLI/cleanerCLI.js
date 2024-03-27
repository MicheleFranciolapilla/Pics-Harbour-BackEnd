const { stdin } = require("process");
const { writeMessage, writeQuestion, cursorVisible, closingMessage, line } = require("./ansiForCLI");
const { buildMenu, navigateMenu, itemIsAnOption, clickOnOption } = require("./menuForCLI");
const { configData, allowedActions, timerMinValue } = require("../cleanerConfig");

const keyEnter = "\u000D";
const keyUp = "\x1B[A";
const keyDown = "\x1B[B";

let originalProcessCtrlCHandler = null;

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
    stdin.setRawMode(true);
    stdin.resume();
}

const rawModeOff = (listener) =>
{
    stdin.removeListener("data", listener);
    stdin.setRawMode(false);
    stdin.resume();
}

const executeAsyncMethod = async (method, arguments) => await method(arguments);

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
            const { allowedKeys, menuIndex, maxIndex, type } = dataObj;
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
                        }
                        else if (menuIndex === dataObj.options.length)
                        {
                            // Conferma
                            resolve(menuIndex);
                        }
                        else
                        {
                            // Quit
                            resolve(menuIndex);
                        }
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
            initialValue()      { return this.options.map( (_, index) => index)},
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
            "message"       :   `Enter the time interval (milliseconds) between cleaning cycles. (@@@Minimum value allowed: [${timerMinValue}]@@@)...`,
            "options"       :   ["Input"],
            "type"          :   "lineInput",
            "initialValue"  :   [],
            "defaultValue"  :   timerMinValue,
            "includeQuit"   :   true,
            "labelForQuit"  :   "Quit",
            "confirmLabel"  :   `Confirm default: ${this.defaultValue} msec`,
            "returned"      :   function() { return this.dataFromInput ?? this.defaultValue }
        }
    ];

    await line();
    let request = {};
    for (let index = 1; index < optionsData.length; index++)
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