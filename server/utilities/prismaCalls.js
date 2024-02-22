const noError = 0;
const errorIfExists = 1;
const errorIfDoesntExist = 2;

const ErrorFromDB = require("../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorRepeatedData = require("../exceptionsAndMiddlewares/exceptions/ErrorRepeatedData");
const ErrorResourceNotFound = require("../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");

/**
 * Funzione delegata ad eseguire operazioni su database.
 * @function
 * @async
 * @param {Object} prismaInstance - Istanza Prisma Client
 * @param {String} model - Nome del modello Prisma su cui operare
 * @param {String} operator - Nome del metodo Prisma da utilizzare (esempio: findUnique, findFirst, findMany, ...)
 * @param {Object} query - Query da passare al metodo Prisma per interrogare il database
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con i dati ricevuti o generando un errore specifico */
const prismaCall = async (prismaInstance, model, operator, query, callerBlock) => 
{
    try
    {
        const result = await prismaInstance[model][operator](query);
        return result;
    }
    catch(error)
    {
        throw new ErrorFromDB("Service temporarily unavailable", 503, callerBlock);
    }
}

const checkEmail = async (email, prismaInstance, errorType, callerBlock, itemString = "email") =>
{
    try
    {
        const result = await prismaCall(prismaInstance, "user", "findUnique", { "where" : { "email" : email } }, callerBlock);
        if (result && (errorType === errorIfExists))
            throw new ErrorRepeatedData(itemString, callerBlock);
        else if (!result && (errorType === errorIfDoesntExist))
            throw new ErrorResourceNotFound(itemString, callerBlock);
        else
            return result;
    }
    catch(error)
    {
        throw error;
    }
}

const getUser = async (email, prismaInstance, callerBlock) =>
{
    try
    {
        const result = await checkEmail(email, prismaInstance, errorIfDoesntExist, callerBlock, "user");
        return result;
    }
    catch(error)
    {
        throw error;
    }
}

module.exports = { noError, errorIfExists, errorIfDoesntExist, prismaCall, checkEmail, getUser }