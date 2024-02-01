const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");

const { removeProperties } = require("../../../../utilities/general");
const { formattedOutput } = require("../../../../utilities/consoleOutput");

/**
 * Restituisce la lista degli utenti registrati (Admin, Super Admin) nel database
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
        const users = await prisma.user.findMany();
        removeProperties(users, "password");
        formattedOutput("USERS (PUBLIC) - ALLUSERS - SUCCESS", "***** Status: 200", "***** Users: ", users);
        return res.json({ users });
    }
    catch(error) 
    { 
        return next(new ErrorFromDB("Service temporarily unavailable", 503, "USERS (PUBLIC) - INDEX - CATCH")); 
    }
}

async function show(req, res, next)
{
    const { id } = matchedData(req, { onlyValidData : true });
    try
    {
        const userToShow = await prisma.user.findUnique(
            {
                "where"     : 
                                { 
                                    "id"            :   id 
                                },
                "include"   :   {
                                    "pictures"      :   true,
                                    "categories"    :   true
                                }  
            });
        if (!userToShow)
            return next(new ErrorResourceNotFound("User", "USERS (PUBLIC) - SHOW - TRY"));
        removeProperties([userToShow], "password");
        formattedOutput("USERS (PUBLIC) - SHOW USER - SUCCESS", "***** Status: 200", "***** User: ", userToShow);
        return res.json({ userToShow });
    }
    catch(error)
    {
        return next(new ErrorFromDB("Service temporarily unavailable", 503, "USERS (PUBLIC) - SHOW - CATCH"));
    }
}

module.exports = { index, show };