const { PrismaClient } = require("@prisma/client");

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
 * @param {String} model - Nome del modello Prisma su cui operare
 * @param {String} operator - Nome del metodo Prisma da utilizzare (esempio: findUnique, findFirst, findMany, ...)
 * @param {Object} query - Query da passare al metodo Prisma per interrogare il database
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con i dati ricevuti o generando un errore specifico */
const prismaCall = async (model, operator, query, callerBlock) => 
{
    const prisma = new PrismaClient();
    try
    {
        const result = await prisma[model][operator](query);
        return result;
    }
    catch(error)
    {
        throw new ErrorFromDB("Service temporarily unavailable", 503, callerBlock);
    }
}

const createRecord = async (model, query, callerBlock) =>
{
    try
    {
        const result = await prismaCall(model, "create", query, callerBlock);
        if (!result)
            throw new ErrorFromDB("Operation refused", 403, callerBlock);
        else
            return result;
    }
    catch(error)
    {
        throw error;
    }
}

const updateRecord = async (model, query, callerBlock) =>
{
    try
    {
        const result = await prismaCall(model, "update", query, callerBlock);
        if (!result)
            throw new ErrorFromDB("Service temporarily unavailable", 503, callerBlock);
        else
            return result;
    }
    catch(error)
    {
        throw error;
    }
}

const getUniqueItem = async (model, query, errorType, callerBlock, stringForErrorMessage) =>
{
    try
    {
        const result = await prismaCall(model, "findUnique", query, callerBlock);
        if (result && (errorType === errorIfExists))
            throw new ErrorRepeatedData(stringForErrorMessage, callerBlock);
        else if (!result && (errorType === errorIfDoesntExist))
            throw new ErrorResourceNotFound(stringForErrorMessage, callerBlock);
        else
            return result;
    }
    catch(error)
    {
        throw error;
    }
}

const getUser = async (email, callerBlock) =>
{
    try
    {
        const result = await getUniqueItem("user", { "where" : { "email" : email } }, errorIfDoesntExist, callerBlock, "user");
        return result;
    }
    catch(error)
    {
        throw error;
    }
}

const checkEmail = async (email, errorType, callerBlock) =>
{
    try
    {
        const result = await getUniqueItem("user", { "where" : { "email" : email } }, errorType, callerBlock, "email");
        return result;
    }
    catch(error)
    {
        throw error;
    }
}

const checkSlug = async (slug, errorType, callerBlock) =>
{
    try
    {
        const result = await getUniqueItem("category", { "where" : { "slug" : slug } }, errorType, callerBlock, "slug");
        return result;
    }
    catch(error)
    {
        throw error;
    }
}

module.exports = { noError, errorIfExists, errorIfDoesntExist, prismaCall, createRecord, updateRecord, getUniqueItem, getUser, checkEmail, checkSlug }