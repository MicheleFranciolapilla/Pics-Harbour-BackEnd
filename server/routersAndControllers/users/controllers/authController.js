const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { matchedData } = require("express-validator");

const ErrorEmailNotNew = require("../../../exceptionsAndMiddlewares/exceptions/ErrorEmailNotNew");
const ErrorFromDB = require("../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorInvalidData = require("../../../exceptionsAndMiddlewares/exceptions/ErrorInvalidData");

const { removeProperties } = require("../../../utilities/general");
const { formattedOutput } = require("../../../utilities/consoleOutput");
const { tokenLifeTime } = require("../../../utilities/variables");

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
    const { name, surname, email, password } = matchedData(req, { onlyValidData : true });
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

/**
 * Esegue il log In dell'utente. 
 * L'operazione va a buon fine se, oltre alla positiva validazione dei dati forniti, email e password risultano corrette.
 * @function
 * @async
 * @param {Object} req - Oggetto "express request"
 * @param {Object} res - Oggetto "express response"
 * @param {Function} next - Middleware "express next"
 * @returns {Promise<{ userToLog: Object, token: string }>|Error} - Promise che si risolve con un oggetto le cui proprietà sono "userToLog" (senza la proprietà password) e "token" (JWT con durata stabilita, generato al netto della password) in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
async function logIn(req, res, next)
{
    const { email, password } = req.body;
    try
    {
        const userToLog = await prisma.user.findUnique({ "where" : { "email" : email } });
        if (!userToLog)
            return next(new ErrorResourceNotFound("Email", "AUTH - LOGIN - TRY"));
        // Se l'email esiste si prosegue verificando la correttezza della password, confrontando, mediante il metodo bcrypt.compare, la password (plain) ricevuta dal client con la password criptata ricavata dal db
        const checkPsw = await bcrypt.compare(password, userToLog.password);
        if (!checkPsw)
            return next(new ErrorInvalidData("password", "AUTH - LOGIN - TRY"));
        // Se la password è corretta si prosegue con l'ottenimento del jwt
        removeProperties([userToLog], "password");
        const token = jwt.sign(userToLog, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
        formattedOutput("AUTH - LOGIN - SUCCESS", "***** Status: 200", "***** Logged user: ", userToLog, "***** Token: ", token);
        return res.json({ userToLog, token });
    }
    catch(error)
    {
        return next(new ErrorFromDB("Service temporarily unavailable", 503, "AUTH - LOGIN - CATCH"));
    }
}

/**
 * Verifica la validità del token
 * @function
 * @param {Object} req - Oggetto "express request"
 * @param {Object} res - Oggetto "express response"
 * @param {Function} next - Middleware "express next"
 * @returns {Promise<{ token: String, payLoad: Object }>|Error} - Promise che si risolve con un oggetto le cui proprietà sono "token" (già ricevuto nella request) e "payLoad" (dati dello user già loggato, senza password) in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
function checkToken(req, res, next)
{
    const { token } = req.body;
    if (token)
    {
        try
        {
            const payLoad = jwt.verify(token, process.env.JWT_SECRET);
            // Si procede senza la verifica del valore del payload poichè, in caso di esito negativo, il metodo "verify" lancia direttamente un'eccezione, gestita, poi, nel blocco catch
            formattedOutput("AUTH - CHECKTOKEN - SUCCESS", "***** Status: 200", "***** Token: ", token, "***** PayLoad: ", payLoad);
            return res.json({ token, payLoad });
        }
        catch(error)
        {
            const exceptionStr = (error.message == "jwt expired") ? "expired" : "wrong";
            return next(new ErrorInvalidData(`token (${exceptionStr})`, "AUTH - CHECKTOKEN - CATCH"));
        }
    }
    else
        return next(new ErrorInvalidData("token (missing)", "AUTH - CHECKTOKEN - ELSE"));
}

module.exports = { signUp, logIn, checkToken }