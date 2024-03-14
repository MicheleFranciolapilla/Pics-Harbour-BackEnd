const readline = require("readline");
const { stdin, stdout } = require("process");

const { configData, allowedActions, timerMinValue } = require("./cleanerConfig");
const { generateString } = require("../server/utilities/consoleOutput");
const { normalizeSpaces } = require("../server/utilities/general");

const cli = readline.createInterface({ input : stdin, output : stdout });
let originalProcessCtrlCHandler = null;
const currentVersion = "1.0.0";
stdin.setEncoding("utf-8");

const keyPressedHandler = (dataObj) => new Promise( resolve =>
    {
        const resetStdin = () =>
        {
            stdin.setRawMode(false);
            stdin.resume();
            stdin.removeListener("data", onKeyPressed);
        }

        const onKeyPressed = (key) =>
        {
            key = key.toUpperCase();
            if (dataObj.allowedKeys.includes(key))
            {
                console.log(`\nYour choice is: [${key}]\n`);
                resetStdin();
                resolve(key);
            }
        }
        stdin.setRawMode(true);
        stdin.resume();
        console.log(`*** ${dataObj.question}`);
        stdin.on("data", onKeyPressed);
    });

const questionAsync = async (questionObj) => new Promise( resolve => cli.question(questionObj, (answer) => 
    {
        answer = answer.toUpperCase().trim();
        if (!questionObj.allowedKeys)
            resolve(answer);
        else
        {
            if (questionObj.allowedKeys.includes(answer))
                resolve(answer);
            else
            {
                
            }
        }
    }));

const getOption = async (dataObj) =>
{
    const { name, message, options, indexesStr, defaultValue } = dataObj;
    const line = generateString(process.stdout.columns, "*");
    let optionsMsg = "";
    if (options)
        options.forEach( (option, index) =>
            {
                optionsMsg += ` - [${index + 1}] ---> ${(name === "tables") ? option.model : option}\n`;
            });
    else
        optionsMsg = defaultValue + "\n";
    const questionMsg = "\n\n".concat(line, "\n", message, "\n", "Press 'Ctrl-C' to quit.\n", optionsMsg, "\n", `Your selection for [${name}] is ..... `);
    let confirmed = false;
    let inputStrValue = "";
    let finalValue = null;
    console.log("NAME: ", name);
    console.log("MESSAGE: ", message);
    console.log("OPTIONS: ", options);
    console.log("INDEXESSTR: ", indexesStr);
    console.log("DEFAULT: ", defaultValue);
    do
    {
        let isValidInput = true;
        inputStrValue = await questionAsync(questionMsg);
        console.log("INPUT NOW: ", inputStrValue);
        inputStrValue = inputStrValue.trim();
        switch (name)
        {
            case "tables"   :   finalValue = 1;
                                const enteredArray = normalizeSpaces(inputStrValue).split(" ");
                                isValidInput = enteredArray.every( value =>
                                    {
                                        if (indexesStr.includes(value))
                                        {
                                            finalValue *= options[parseInt(value) - 1].prime;
                                            return true;
                                        }
                                        else
                                            return false;
                                    });
                                // Se isValidInput è true, si verifica anche che non vi siano elementi ripetuti e che vi sia almeno un elemento
                                if (isValidInput)
                                    isValidInput = ((new Set(enteredArray).size === enteredArray.length) && (enteredArray.length !== 0)); 
                                console.log("ISVALID: ", isValidInput);
                                console.log("INPUT: ", inputStrValue);
                                console.log("FINALVALUE: ", finalValue);
                                console.log("ENTEREDARRAY: ", enteredArray);
                                break;
            case "action"   :   if (!indexesStr.includes(inputStrValue))
                                    isValidInput = false;
                                else
                                    finalValue = options[parseInt(inputStrValue) - 1];
                                break;
            case "timer"    :   if (inputStrValue === "")
                                    finalValue = timerMinValue;
                                else
                                {
                                    const inputIntValue = Number.parseInt(inputStrValue, 10);
                                    if ((inputStrValue === inputIntValue.toString()) && (inputIntValue >= timerMinValue))
                                        finalValue = inputIntValue;
                                    else
                                        isValidInput = false;
                                }
                                break;
        }
        if (!isValidInput)
            console.log("\nThe selection is not valid. Please enter a valid data.\n\n");
        else
        {
            const confirmData = await (questionAsync());
            // const confirmKey = await keyPressedHandler({ "question" : `Your selection is [${inputStrValue}]. Confirm? [Y/N]`, "allowedKeys" : ["Y", "N"] });
            // cli.clearLine(stdout, 0);
            // if (confirmKey === "Y")
            // {
            //     confirmed = true;
            //     console.log(line + "\n");
            // }
        }
    }
    while (!confirmed);
    return finalValue;
}

const getAllOptions = async () =>
{
    const optionsData =
    [
        {
            "name"          :   "tables",
            "message"       :   "Select tables by typing the corresponding number (use <space> as separator)",
            "options"       :   configData.map( ({ model, prime }) => ({ model, prime })),
            "indexesStr"    :   configData.map( (_, index) => (index + 1).toString())
        },
        {
            "name"          :   "action",
            "message"       :   "Select one action by typing the corresponding number (multiple selections are not allowed)",
            "options"       :   allowedActions,
            "indexesStr"    :   allowedActions.map( (_, index) => (index + 1).toString())
        },
        {
            "name"          :   "timer",   
            "message"       :   "Enter the time interval (milliseconds) between cleanings",
            "defaultValue"  :   `Minimum value allowed is ${timerMinValue} msec (default -  selectable by just pressing enter)`
        }
    ];
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
    dataObj = 
    {
        "question"      :   (isFirstQuestion ? "Please press: 'P' (proceed) or 'Q' (quit) ...   " : "Run db Cleaner again - [Y/N]? ...   "),
        "allowedKeys"   :   (isFirstQuestion ? ["P", "Q"] : ["Y", "N"])
    };
    const request = await getAllOptions();
    console.log("FINITO: ", request);
    cli.close();
    return
}

// IIFE
( async () =>
{
    await quitOrProceed();
})();