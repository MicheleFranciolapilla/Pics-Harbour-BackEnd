const { isDivisibleBY, deepFindAndReplace, removeProperties } = require("../server/utilities/general");
const { timerMinValue, configData, actionOutcome } = require("./config");

let cleanerIsRunning = false;
let intervalId = 0;
let intervalTime = null;

const buildActions = (request) =>
{
    const now = new Date();
    let actionsObj = { "success" : false };
    let outcome = 4;
    if (request.tables > 1)
    {
        actionsObj["actions"] = [];
        configData.forEach( data =>
            {
                if (isDivisibleBY(request.tables, data.prime))
                {
                    let dataCopy = { ...data };
                    deepFindAndReplace(dataCopy, data.objKey, data.placeholder, now);
                    actionsObj.actions.push(dataCopy);
                }
            });
        if (actionsObj.actions.length !== 0)
        {
            removeProperties(actionsObj.actions, "prime", "objKey", "placeholder");
            actionsObj.success = true;
        }
        else
        {
            removeProperties([actionsObj], "actions");
            outcome = 5;
        }
    }
    if (!actionsObj.success)
        actionsObj["outcome"] = actionOutcome[outcome];
    console.log(actionsObj);
    return actionsObj;
}

const setActualTimerValue = (value) =>
{
    let result = timerMinValue;
    if ((typeof value === "number") && (value > timerMinValue))
        result = value;
    return result;
}

const dbCleaner = async (requestObj) =>
{
    let request = { ...requestObj };
    let response = { "success" : false };
    let outcome = 1;
    if (!cleanerIsRunning)
    {
        if ((intervalId === 0) && (request.action.toLowerCase() === "reset"))
            outcome = 2;
        else if ((intervalId !== 0) && (request.action.toLowerCase() !== "reset"))
            outcome = 3;
        else 
        {
            request["timer"] = setActualTimerValue(request.timer);
            const returnedActions = buildActions(requestObj);
            if (!returnedActions.success)
                outcome = returnedActions.outcome;
            else
            {
                // Prepararsi per l'attivazione/disattivazione del timer o chiamata del metodo prisma. NB si potrebbe evitare il codice precedente nel caso di reset
            }
        }
    }
    return { ...response, "outcome" : actionOutcome[outcome] };
}

module.exports = { dbCleaner }