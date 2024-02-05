const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { matchedData } = require("express-validator");

const ErrorRepeatedData = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorRepeatedData");
const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorInvalidData = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorInvalidData");

const { prismaOperator, removeProperties } = require("../../../../utilities/general");
const { formattedOutput } = require("../../../../utilities/consoleOutput");
const { tokenLifeTime } = require("../../../../utilities/variables");

/**
 * Consente la registrazione di un nuovo utente (Admin). Nel caso di esito positivo effettua il logIn dello stesso.
 * La registrazione va a buon fine se, oltre alla positiva validazione dei dati forniti, l'email risulta NON già presente nel database
 * @function
 * @async
 * @param {Object} req - Oggetto "express request"
 * @param {Object} res - Oggetto "express response"
 * @param {Function} next - Middleware "express next"
 * @returns {Promise<{ user: Object, token: string }>|Error} - Promise che si risolve con un oggetto le cui proprietà sono "user" (senza la proprietà password) e "token" (JWT con durata stabilita, generato al netto della password) in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
async function signUp(req, res, next)
{
    const { name, surname, email, password } = matchedData(req, { onlyValidData : true });
    // Verifica di non esistenza dell'email nel database
    // Si predilige il metodo findUnique a count poichè più rapido in caso di esistenza
    let prismaQuery = { "where" : { "email" : email } };
    const checkEmailExistence = await prismaOperator(prisma, "user", "findUnique", prismaQuery);
    // Caso in cui sia stato lanciato un errore:
    if (!checkEmailExistence.success)
        return next(new ErrorFromDB("Service temporarily unavailable", 503, "AUTH - SIGNUP"));
    // Caso in cui l'email sia già presente nel database
    else if (checkEmailExistence.data)
        return next(new ErrorRepeatedData("email", "AUTH - SIGNUP"));
    // Si prosegue se l'email non è già presente nel db
    const hashedPsw = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    prismaQuery =   {
                        "data"  :   {
                                        "name"      :   name,
                                        "surname"   :   surname,
                                        "email"     :   email,
                                        "password"  :   hashedPsw
                                    }
                    };
    const newUser = await prismaOperator(prisma, "user", "create", prismaQuery);
    // Si è scelto di unificare l'errore "Operation refused" anche per l'errore da catch ("Service temporarily unavailable") nell'ipotesi, non testata, di insufficiente spazio nel db
    if ((!newUser.success) || (!newUser.data))
        return next(new ErrorFromDB("Operation refused", 403, "AUTH - SIGNUP"));
    // Se l'operazione va a buon fine si restituisce il record salvato (senza password) ed il token jwt
    const user = newUser.data;
    removeProperties([user], "password");
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
    formattedOutput("AUTH - SIGNUP - SUCCESS", "***** Status: 201", "***** New User: ", user, "***** Token: ", token);
    return res.status(201).json({ user, token });
}

/**
 * Esegue il log In dell'utente. 
 * L'operazione va a buon fine se, oltre alla positiva validazione dei dati forniti, email e password risultano corrette.
 * @function
 * @async
 * @param {Object} req - Oggetto "express request"
 * @param {Object} res - Oggetto "express response"
 * @param {Function} next - Middleware "express next"
 * @returns {Promise<{ user: Object, token: string }>|Error} - Promise che si risolve con un oggetto le cui proprietà sono "user" (senza la proprietà password) e "token" (JWT con durata stabilita, generato al netto della password) in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
async function logIn(req, res, next)
{
    const { email, password } = matchedData(req, { onlyValidData : true });
    const userToLog = await prismaOperator(prisma, "user", "findUnique", { "where" : { "email" : email } });
    if (!userToLog.success)
        return next(new ErrorFromDB("Service temporarily unavailable", 503, "AUTH - LOGIN"));
    else if (!userToLog.data)
        return next(new ErrorResourceNotFound("Email", "AUTH - LOGIN"));
    // Se l'email esiste si prosegue verificando la correttezza della password, confrontando, mediante il metodo bcrypt.compare, la password (plain) ricevuta dal client con la password criptata ricavata dal db
    const checkPsw = await bcrypt.compare(password, userToLog.data.password);
    if (!checkPsw)
        return next(new ErrorInvalidData("password", "AUTH - LOGIN"));
    // Se la password è corretta si prosegue con l'ottenimento del jwt
    const user = userToLog.data;
    removeProperties([user], "password");
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
    formattedOutput("AUTH - LOGIN - SUCCESS", "***** Status: 200", "***** Logged user: ", user, "***** Token: ", token);
    return res.json({ user, token });
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
            return next(new ErrorInvalidData(`token (${exceptionStr})`, "AUTH - CHECKTOKEN"));
        }
    }
    else
        return next(new ErrorInvalidData("token (missing)", "AUTH - CHECKTOKEN"));
}

module.exports = { signUp, logIn, checkToken }