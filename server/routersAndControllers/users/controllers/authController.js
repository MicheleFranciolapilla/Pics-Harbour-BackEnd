const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const ErrorEmailNotNew = require("../../../exceptionsAndMiddlewares/exceptions/ErrorEmailNotNew");
const ErrorFromDB = require("../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");

const tokenLifeTime = "1h";

async function signUp(req, res, next)
{
    const { name, surname, email, password } = req.body;
    // Verifica di non esistenza dell'email nel database
    try
    {
        // Si predilige il metodo findUnique a count poichè più rapido in caso di esistenza
        const checkingEmailExistence = await prisma.user.findUnique({ "where" : { "email" : email } });
        if (checkingEmailExistence)
            return next(new ErrorEmailNotNew("Invalid email - already in use!", "AUTH - SIGNUP - TRY"));
    }
    catch(error)
    {
        return next(new ErrorFromDB("Service unavailable", "USERS - INDEX - CATCH")); 
    }
    // Prosecuzione del blocco "try"
}

module.exports = { signUp }