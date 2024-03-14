
const { dbCleaner } = require("./dbCleaner");
const { reportFileData, configData, allowedActions, timerMinValue } = require("./cleanerConfig");
const { formattedOutput, generateString } = require("../server/utilities/consoleOutput");
const { normalizeSpaces } = require("../server/utilities/general");

const currentVersion = "1.0.0";

const welcome = () => formattedOutput(`DB cleaner CLI - version ${currentVersion}`,
                        `- Cleans the db and saves data into the file '${reportFileData.folder.concat("/", reportFileData.prefix, "-[current-date].json")}'`,
                        "- Allows to run the cleaning operations just once or set it (and reset) as a periodic task");

const questionAsync = async (questionMsg) => 
{
    return new Promise((resolve) => rl.question(questionMsg, (answer) => 
                                                                {
                                                                    console.log("ANSWER IS: ", answer);
                                                                    resolve(answer);
                                                                }));
}

const getOption = async (dataObj) =>
{
    // stdin.resume();
    const { name, message, options, indexesStr, defaultValue } = dataObj;
    const line = generateString(process.stdout.columns, "*");
    let questionMsg = "";
    let optionsMsg = "";
    if (options)
        options.forEach( (option, index) =>
            {
                optionsMsg += ` - [${index + 1}] ---> ${(name === "tables") ? option.model : option}\n`;
            });
    else
        optionsMsg = defaultValue + "\n";
        questionMsg = "\n\n".concat(line, "\n", message, "\n", "Press 'Ctrl-C' to quit.\n", optionsMsg, "\n", `Your selection for [${name}] is ..... `);
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
        // inputStrValue = await rl.question(questionMsg, (answer) => answer);
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
            const confirmKey = await keyPressedHandler({ "question" : `Your selection is [${inputStrValue}]. Confirm? [Y/N]`, "allowedKeys" : ["Y", "N"] });
            if (confirmKey === "Y")
            {
                confirmed = true;
                console.log(line + "\n");
            }
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
        const request = await getAllOptions();
        await dbCleaner(request);
        await quitOrProceed(false);
}

// IIFE
( async () =>
    {
        welcome();
        // rl.on("SIGINT", quitProcess);
        await quitOrProceed();
    })();