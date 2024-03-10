const fileSystem = require("fs").promises;
const path = require("path");

const { isDivisibleBY, deepFindAndReplace, removeProperties, objectDeepCopy } = require("../server/utilities/general");
const { formattedOutput } = require("../server/utilities/consoleOutput");
const { reportFileData, allowedActions, timerMinValue, configData, cleanerOutcome } = require("./cleanerConfig");
const { prisma } = require("../server/utilities/prismaCalls");

let cleanerIsRunning = false;
let intervalId = 0;
let intervalTime = 0;
let actions = [];
let requestedBy = null;

const validateRequestedAction = (requestedAction) =>
{
    let result = "";
    if ((typeof requestedAction === "string") && (allowedActions.includes(requestedAction.toLowerCase())))
        result = requestedAction.toLowerCase();
    return result;
}

const setIntervalTime = (value) => intervalTime = ((typeof value === "number") && (value > timerMinValue)) ? value : timerMinValue;

const resetCleaner = () => 
{
    console.log("GOING TO RESET");
    clearInterval(intervalId);
    intervalId = 0;
}

const setCleaner = (timer) =>
{
    setIntervalTime(timer);
    intervalId = setInterval(clean, intervalTime);
    console.log("JUST SET. IntervalID = ", intervalId);
    console.log("INTERVAL TIME = ", intervalTime);
}

const createFolderIfMissing = async () =>
{
    const folder = path.join(__dirname, reportFileData.folder);
    console.log("FOLDER: ", folder);
    try
    {
        await fileSystem.access(folder);
    }
    catch(error)
    {
        console.log(`${folder} doesn't exist, so it will be created now.`);
        await fileSystem.mkdir(folder);
    }
    return folder;
}

const getFileContent = async (completeFileName) =>
{
    let fileContentData = [];
    try
    {
        const fileContentString = await fileSystem.readFile(completeFileName, "utf-8");
        fileContentData = JSON.parse(fileContentString);
        if (!Array.isArray(fileContentData))
            throw new Error(`Error: the content of the file ${completeFileName} is not an array.`);
    }
    catch(error)
    {
        if (error.code === "ENOENT")
            console.log("File didn't exist. It will be created.");
        else
            throw error;
    }
    return fileContentData;
}

const clean = async () =>
{
    const now = new Date();
    const nowISOSplitted = now.toISOString().split("T");
    const actionsCopy = actions.map( obj =>
        {
            let objCopy = objectDeepCopy(obj);
            deepFindAndReplace(objCopy, obj.objKey, obj.placeholder, now);
            return objCopy;
        });
    removeProperties(actionsCopy, "prime", "objKey", "placeholder");
    cleanerIsRunning = true;
    const folder = await createFolderIfMissing();
    const completeFileName = path.join(folder, reportFileData.prefix.concat("-", nowISOSplitted[0], ".json"));
    let errorDuringPrismaCalls = true;
    let errorDuringFileRead = true;
    try
    {
        await prisma.$transaction( async (instance) =>
            {
                const dbReturnedValues = [];
                const dbReturnedCounts = [];
                for (let index = 0; index < actionsCopy.length; index++)
                {
                    const currentAction = actionsCopy[index];
                    let dbValues = await instance[currentAction.model].findMany(currentAction.queryForFind);
                    let dbCounts = await instance[currentAction.model][currentAction.method](currentAction.query);
                    formattedOutput("DB CLEANER", "***** Status: 200", 
                        `***** Model: ${currentAction.model}`, `***** Method: ${currentAction.method}`, `***** Query: ${currentAction.query}`);
                    if (currentAction.model === "tokensblacklist")
                        removeProperties(dbValues, "token");
                    else if (currentAction.model === "user")
                        removeProperties(dbValues, "name", "surname", "role", "password", "thumb", "website", "createdAt", "updatedAt");
                    dbReturnedValues.push(dbValues);
                    dbReturnedCounts.push(dbCounts);
                }
                errorDuringPrismaCalls = false;
                let fileData = await getFileContent(completeFileName);
                errorDuringFileRead = false;
                const dataToAppend =
                {
                    "time"      :   nowISOSplitted[1],
                    "cleaning"  :   {
                                        "periodic"  :   (intervalId !== 0),
                                        ...((intervalId === 0)  ?   {}
                                                                :   {
                                                                        "frequency" :   `${intervalTime} msec`
                                                                    })
                                    },
                    // Formattare requestedBy di modo che, se si tratta dell'Admin ci siano solo id, nome, cognome ed eventualmente email
                    "requester" :   requestedBy,
                    "data"      :   actionsCopy.map( (action, index) =>
                                        ({
                                            "table" :   action.model,
                                            "info"  :   dbReturnedValues[index],
                                            "count" :   dbReturnedCounts[index]
                                        }))
                };
                fileData.push(dataToAppend);
                const jsonData = JSON.stringify(fileData, null, 2);
                await fileSystem.writeFile(completeFileName, jsonData, "utf-8");
                console.log("File has been updated");
            });
    }
    catch(error)
    {
        const errorMsg = (errorDuringPrismaCalls ? "Error occurred while accessing database" : error.message);
        console.log(errorMsg);
        throw new Error(errorMsg);
    }
    finally
    {
        cleanerIsRunning = false;
    }
}

const buildActions = (tables) =>
{
    actions = [];
    configData.forEach( data =>
        {
            if (isDivisibleBY(tables, data.prime))
                actions.push(data);
        });
}

const dbCleaner = async (request) =>
{
    console.log("REQUEST: ", request);
    let response = { "success" : false };
    let outcomeIndex = 1;
    if (!cleanerIsRunning)
    // Si prosegue solo se "cleaner" non è in esecuzione
    {
        const requestedAction = validateRequestedAction(request.action);
        if (requestedAction === "")
        // richiesta incoerente poichè non è stato specificata l'azione da compiere
            outcomeIndex = 2;
        else if (request.tables <= 1)
        // "request.tables <= 1" implica che non è precisata alcuna tabella su cui lavorare (per il principio di "un numero primo per ogni tabella")
            outcomeIndex = 3;
        else if ((requestedAction === "reset") && (intervalId === 0))
        // richiesta incoerente poichè non si può resettare il cleaner se non settato (cleaner settato = temporizzatore attivo)
            outcomeIndex = 4;
        else if ((requestedAction !== "reset") && (intervalId !== 0))
        // richiesta incoerente poichè con cleaner settato l'unica richiesta valida è quella del reset
            outcomeIndex = 5;
        else
        // richiesta coerente
        {
            requestedBy = request.requestedBy;
            response.success = true;
            outcomeIndex = 0;
            if (requestedAction === "reset")
                resetCleaner();
            else
            {
                buildActions(request.tables);
                if (actions.length === 0)
                {
                    response.success = false;
                    outcomeIndex = 6;
                }
                else
                {
                    try
                    {
                        if (requestedAction === "set")
                            setCleaner(request.timer);
                        else
                            await clean();
                    }
                    catch(error)
                    {
                        response.success = false;
                        outcomeIndex = -1;
                        // response["outcome"] = error.message;
                    }
                }
            }
        }
    }
    if (outcomeIndex >= 0)
        response["outcome"] = cleanerOutcome[outcomeIndex];
    console.log("RESPONSE: ", response);
    return response;
}

module.exports = { dbCleaner }