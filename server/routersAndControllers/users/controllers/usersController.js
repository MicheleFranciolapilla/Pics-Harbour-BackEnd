const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ErrorFromDB = require("../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const { removeProperties } = require("../../../utilities/general");
const { formattedOutput } = require("../../../utilities/consoleOutput");

/**
 * Restituisce la lista degli utenti registrati (Admin, Super Admin) nel database
 * @function
 * @async
 * @param {Object} req - Oggetto "express request"
 * @param {Object} res - Oggetto "express response"
 * @param {Function} next - Middleware "express next"
 * @returns {Promise<Array<Object>|Error>} - Promise che si risolve con un array di oggetti "user (senza la proprietà password)" in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
async function index(req, res, next)
{
    try
    {
        const users = await prisma.user.findMany();
        removeProperties(users, "password");
        formattedOutput("USERS - ALLUSERS - SUCCESS", "***** Users: ", users);
        // console.log("***** Users: ", users);
        return res.json({ "Users" : users });
    }
    catch(error) 
    { 
        return next(new ErrorFromDB("Service unavailable", "USERS - INDEX - CATCH")); 
    }
}

module.exports = { index };