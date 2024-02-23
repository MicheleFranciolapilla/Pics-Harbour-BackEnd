const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const noError = 0;
const errorIfExists = 1;
const errorIfDoesntExist = 2;

const ErrorFromDB = require("../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorRepeatedData = require("../exceptionsAndMiddlewares/exceptions/ErrorRepeatedData");
const ErrorResourceNotFound = require("../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorUserNotAllowed = require("../exceptionsAndMiddlewares/exceptions/ErrorUserNotAllowed");

/**
 * Funzione delegata ad eseguire operazioni su database, mediante Prisma.
 * @function
 * @async
 * @param {String} model - Nome del modello Prisma su cui operare
 * @param {String} operator - Nome del metodo Prisma da utilizzare (esempio: findUnique, findFirst, findMany, ...)
 * @param {Object} query - Query da passare al metodo Prisma per interrogare il database
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con i dati ricevuti o generando un errore specifico 
 */
const prismaCall = async (model, operator, query, callerBlock) => 
{
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

/**
 * Funzione per creare un record nel database.
 * @function
 * @async
 * @param {String} model - Nome del modello Prisma per cui creare un record
 * @param {Object} query - Query da passare al metodo Prisma create
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con il record creato o generando un errore specifico
 */
const createRecord = async (model, query, callerBlock) =>
{
    const result = await prismaCall(model, "create", query, callerBlock);
    if (!result)
        throw new ErrorFromDB("Operation refused", 403, callerBlock);
    else
        return result;
}

/**
 * Funzione per aggiornare un record nel database.
 * @function
 * @async
 * @param {String} model - Nome del modello Prisma per cui aggiornare un record
 * @param {Object} query - Query da passare al metodo Prisma update
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con il record aggiornato o generando un errore specifico
 */
const updateRecord = async (model, query, callerBlock) =>
{
    const result = await prismaCall(model, "update", query, callerBlock);
    if (!result)
        throw new ErrorFromDB("Service temporarily unavailable", 503, callerBlock);
    else
        return result;
}

/**
 * Funzione per eliminare un record nel database.
 * @function
 * @async
 * @param {String} model - Nome del modello Prisma da cui eliminare un record
 * @param {Object} query - Query da passare al metodo Prisma delete
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @param {string} stringForErrorMessage - Stringa aggiuntiva per il messaggio di errore
 * @returns {Promise<any>} - Promise che si risolve con il risultato dell'eliminazione o generando un errore specifico
 */
const deleteRecord = async (model, query, callerBlock, stringForErrorMessage = "") =>
{
    await getUniqueItem(model, query, errorIfDoesntExist, callerBlock, stringForErrorMessage);
    const result = await prismaCall(model, "delete", query, callerBlock);
    return result;
}

/**
 * Funzione per ottenere un elemento unico dal database.
 * @function
 * @async
 * @param {String} model - Nome del modello Prisma in cui cercare un elemento unico
 * @param {Object} query - Query da passare al metodo Prisma findUnique
 * @param {number} errorType - Tipo di errore da generare se l'elemento esiste o meno
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @param {string} stringForErrorMessage - Stringa aggiuntiva per il messaggio di errore
 * @returns {Promise<any>} - Promise che si risolve con l'elemento ricevuto o generando un errore specifico
 */
const getUniqueItem = async (model, query, errorType, callerBlock, stringForErrorMessage) =>
{
    const result = await prismaCall(model, "findUnique", query, callerBlock);
    if (result && (errorType === errorIfExists))
        throw new ErrorRepeatedData(stringForErrorMessage, callerBlock);
    else if (!result && (errorType === errorIfDoesntExist))
        throw new ErrorResourceNotFound(stringForErrorMessage, callerBlock);
    else
        return result;
}

/**
 * Funzione per ottenere un utente dal database utilizzando l'indirizzo email.
 * @function
 * @async
 * @param {String} email - Indirizzo email dell'utente da cercare
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con l'utente ricevuto o generando un errore specifico
 */
const getUser = async (email, callerBlock) =>
{
    const result = await getUniqueItem("user", { "where" : { "email" : email } }, errorIfDoesntExist, callerBlock, "user");
    return result;
}

/**
 * Funzione per verificare l'esistenza di un indirizzo email nel database.
 * @function
 * @async
 * @param {String} email - Indirizzo email da verificare
 * @param {number} errorType - Tipo di errore da generare se l'indirizzo email esiste o meno
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con il risultato della verifica o generando un errore specifico
 */
const checkEmail = async (email, errorType, callerBlock) =>
{
    const result = await getUniqueItem("user", { "where" : { "email" : email } }, errorType, callerBlock, "email");
    return result;
}

/**
 * Funzione per verificare l'esistenza di uno slug nel database.
 * @function
 * @async
 * @param {String} slug - Slug da verificare
 * @param {number} errorType - Tipo di errore da generare se lo slug esiste o meno
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con il risultato della verifica o generando un errore specifico
 */
const checkSlug = async (slug, errorType, callerBlock) =>
{
    const result = await getUniqueItem("category", { "where" : { "slug" : slug } }, errorType, callerBlock, "slug");
    return result;
}

/**
 * Funzione per verificare la proprietà di un'immagine.
 * @function
 * @async
 * @param {String} pictureId - ID dell'immagine da verificare
 * @param {String} userId - ID dell'utente
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con l'informazione di proprietà o generando un errore specifico
 */
const checkPictureOwnership = async (pictureId, userId, callerBlock) =>
{
    const query = { "where" : { "id" : pictureId }, "include" : { "categories" : { "select" : { "id" : true } } } };
    const picture = await getUniqueItem("picture", query, errorIfDoesntExist, callerBlock, `Picture Id [${pictureId}]`);
    return { "ownership" : (picture.userId == userId), "picture" : picture };
}

/**
 * Funzione per eliminare un'immagine se l'utente è il proprietario.
 * @function
 * @async
 * @param {String} pictureId - ID dell'immagine da eliminare
 * @param {String} userId - ID dell'utente
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con il risultato dell'eliminazione o generando un errore specifico
 */
const deletePictureIfOwner = async (pictureId, userId, callerBlock) =>
{
    const { ownership } = await checkPictureOwnership(pictureId, userId, callerBlock);
    if (!ownership)
        throw new ErrorUserNotAllowed("User not allowed to delete another user's picture", callerBlock);
    const result = await prismaCall("picture", "delete", { "where" : { "id" : pictureId } }, callerBlock);
    return result;
}

/**
 * Funzione per trovare tutte le categorie nel database in base agli ID forniti.
 * @function
 * @async
 * @param {Array} categoriesToFind - Array di ID delle categorie da trovare
 * @param {string} callerBlock - Stringa identificativa del blocco chiamante
 * @returns {Promise<any>} - Promise che si risolve con le categorie trovate e mancanti
 */
const findAllCategories = async (categoriesToFind, callerBlock) =>
{
    let found = [];
    let missing = [];
    let query = { "where" : { "id" : { "in" : categoriesToFind } }, "select"    :   { "id" : true } };
    if (categoriesToFind.length !== 0)
    {
        found = await prismaCall("category", "findMany", query, callerBlock);
        if (found.length < categoriesToFind.length)
            categoriesToFind.forEach( catId =>
                {
                    if (!found.some( foundId => foundId.id === catId))
                        missing.push(catId);
                });
    }
    return { "foundCategories" : found, "missingCategories" : missing };
}

module.exports = 
{   noError, errorIfExists, errorIfDoesntExist, 
    prismaCall, createRecord, updateRecord, deleteRecord, getUniqueItem, getUser, checkEmail, checkSlug, checkPictureOwnership, deletePictureIfOwner, findAllCategories
}