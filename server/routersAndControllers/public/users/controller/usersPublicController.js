const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");

const { errorIfDoesntExist, prismaCall, getUniqueItem } = require("../../../../utilities/prismaCalls");
const { removeProperties } = require("../../../../utilities/general");
const { formattedOutput } = require("../../../../utilities/consoleOutput");

/**
 * Restituisce la lista degli utenti registrati (Publisher, Admin) nel database
 * @function
 * @async
 * @param {Object} req - Oggetto "express request"
 * @param {Object} res - Oggetto "express response"
 * @param {Function} next - Middleware "express next"
 * @returns {Promise<Array<Object>|Error>} - Promise che si risolve con un array "users" di oggetti "user" (senza la proprietà password) in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
async function index(req, res, next)
{
    try
    {
        let users = await prismaCall("user", "findMany", { "include" : { "pictures" : true, "categories" : true } }, "USERS (PUBLIC) - INDEX");
        users.forEach( user =>
            {
                const fieldToRemove = (user.role === "Admin") ? "pictures" : "categories";
                removeProperties([user], "password", "tokenExpAt", fieldToRemove);
            });
        formattedOutput("USERS (PUBLIC) - ALLUSERS - SUCCESS", "***** Status: 200", "***** Users: ", users);
        return res.json({ users });
    }
    catch(error)
    {
        return next(error);
    }
}

/**
* Restituisce l'utente (Publisher o Admin) con l'id richiesto
* @function
* @async
* @param {Object} req - Oggetto "express request"
* @param {Object} res - Oggetto "express response"
* @param {Function} next - Middleware "express next"
* @returns {Promise<Object|Error>} - Promise che si risolve con i dati (senza password) dello user cercato o con un errore
*/
async function show(req, res, next)
{
    const { id } = matchedData(req, { onlyValidData : true });
    const prismaQuery =
    {
        "where"     :   { "id" : id },
        "include"   :   { "pictures" : true, "categories" : true }
    };
    try
    {
        let user = await getUniqueItem("user", prismaQuery, errorIfDoesntExist, "USERS (PUBLIC) - SHOW", `User Id [${id}]`);
        const fieldToRemove = (user.role === "Admin") ? "pictures" : "categories";
        removeProperties([user], "password", "tokenExpAt", fieldToRemove);
        formattedOutput("USERS (PUBLIC) - SHOW USER - SUCCESS", "***** Status: 200", "***** User: ", user);
        return res.json({ user });
    }
    catch(error)
    {
        return next(error);
    }
}

module.exports = { index, show };