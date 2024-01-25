const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ErrorEmailNotNew = require("../../../exceptionsAndMiddlewares/exceptions/ErrorEmailNotNew");
const ErrorFromDB = require("../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");

const { removeProperties } = require("../../../utilities/general");
const { formattedOutput } = require("../../../utilities/consoleOutput");

const tokenLifeTime = "1h";

/**
 * Consente la registrazione di un nuovo utente (Admin). Nel caso di esito positivo effettua il logIn dello stesso.
 * La registrazione va a buon fine se, oltre alla positiva validazione dei dati forniti, l'email risulta NON già presente nel database
 * @function
 * @async
 * @param {Object} req - Oggetto "express request"
 * @param {Object} res - Oggetto "express response"
 * @param {Function} next - Middleware "express next"
 * @returns {Promise<{ newUser: Object, token: string }>|Error} - Promise che si risolve con un oggetto le cui proprietà sono "newUser" (senza la proprietà password) e "token" (JWT con durata stabilita, generato al netto della password) in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
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
        return next(new ErrorFromDB("Service temporarily unavailable", 503, "AUTH - SIGNUP - CATCH")); 
    }
    // Prosecuzione del blocco "try"
    const hashedPsw = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    try
    {
        const newUser = await prisma.user.create(   
            {   "data"  :   {
                                "name"      :   name,
                                "surname"   :   surname,
                                "email"     :   email,
                                "password"  :   hashedPsw
                            }
            });
        if (!newUser)
            return next(new ErrorFromDB("Operation refused", 403, "AUTH - SIGNUP - TRY"));
        // Se l'operazione va a buon fine si restituisce il record salvato (senza password) ed il token jwt
        removeProperties([newUser], "password");
        const token = jwt.sign(newUser, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
        formattedOutput("AUTH - SIGNUP - SUCCESS", "***** Status: 201", "***** New User: ", newUser, "***** Token: ", token);
        return res.status(201).json({ newUser, token });
    }
    catch(error)
    {
        return next(new ErrorFromDB("Operation refused", 403, "AUTH - SIGNUP - CATCH"));
    }
}

module.exports = { signUp }