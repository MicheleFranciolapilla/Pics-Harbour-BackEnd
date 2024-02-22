const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorInvalidData = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorInvalidData");

const { errorIfExists } = require("../../../../utilities/prismaCalls");
const { prismaCall, checkEmail, getUser } = require("../../../../utilities/prismaCalls");
const { removeProperties } = require("../../../../utilities/general");
const { formattedOutput } = require("../../../../utilities/consoleOutput");
const { tokenLifeTime } = require("../../../../utilities/variables");
const { fileUploadReport, deleteFileBeforeThrow } = require("../../../../utilities/fileManagement");

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
    // Nella rotta "/auth/signup" è previsto, facoltativamente, anche il caricamente del file immagine della "thumb".
    // In questo punto del processo, oltre ad avere i dati già validati, ci si può trovare in una delle seguenti situazioni:
    // A - Non è stato richiesto alcun caricamento del file della thumb
    // B - E' stato tentato il caricamento del file della thumb ma, poichè non valido in termini di estensione e/o tipo, non è mai stato salvato nel server.
    // C - E' stato tentato il caricamento del file della thumb ma, poichè non valido per la dimensione eccessiva, è stato rimosso dopo il salvataggio.
    // D - Il file della thumb è stato correttamente caricato nel server.
    const { name, surname, email, password } = matchedData(req, { onlyValidData : true });
    const { fileData } = req;
    let thumb = null;
    if (fileData)
    // Casi B, C o D
        if (fileUploadReport(req).File_uploaded)
        // Caso D
            thumb = req.file.filename;
    try
    {
        await checkEmail(email, prisma, errorIfExists, "AUTH - SIGNUP");
        const hashedPsw = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
        const prismaQuery =
        {
            "data"  :   {
                            "name"      :   name,
                            "surname"   :   surname,
                            "email"     :   email,
                            "password"  :   hashedPsw,
                            "thumb"     :   thumb
                        }
        };
        const user = await prismaCall(prisma, "user", "create", prismaQuery, "AUTH - SIGNUP");
        if (!user)
            throw new ErrorFromDB("Operation refused", 403, "AUTH - SIGNUP");
        // Se l'operazione di creazione nuovo utente va a buon fine si restituisce il record salvato (senza password) ed il token jwt
        removeProperties([user], "password");
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
        formattedOutput("AUTH - SIGNUP - SUCCESS", "***** Status: 201", "***** New User: ", user, "***** Token: ", token);
        return res.status(201).json({ user, token });
    }
    catch(error)
    {
        if (thumb)
        // Caso D
        // Se ci sono stati errori tali da non consentire la creazione del nuovo utente, prima di lanciarli, si rimuove l'eventuale file immagine dal server
            await deleteFileBeforeThrow(req.file, "AUTH - SIGNUP");
        return next(error);
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
 * @returns {Promise<{ user: Object, token: string }>|Error} - Promise che si risolve con un oggetto le cui proprietà sono "user" (senza la proprietà password) e "token" (JWT con durata stabilita, generato al netto della password) in caso di successo, o viene respinta con un errore in caso di fallimento.
 */
async function logIn(req, res, next)
{
    const { email, password } = matchedData(req, { onlyValidData : true });
    try
    {
        const user = await getUser(email, prisma, "AUTH - LOGIN");
        // Se l'email esiste si prosegue verificando la correttezza della password, confrontando, mediante il metodo bcrypt.compare, la password (plain) ricevuta dal client con la password criptata ricavata dal db
        const checkPsw = await bcrypt.compare(password, user.password);
        if (!checkPsw)
            throw new ErrorInvalidData("password", "AUTH - LOGIN");
        // Se la password è corretta si prosegue con l'ottenimento del jwt
        removeProperties([user], "password");
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
        formattedOutput("AUTH - LOGIN - SUCCESS", "***** Status: 200", "***** Logged user: ", user, "***** Token: ", token);
        return res.json({ user, token });
    }
    catch(error)
    {
        return next(error);
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
        jwt.verify(token, process.env.JWT_SECRET, (error, payload) =>
            {
                if (error)
                {
                    const exceptionStr = (error.message === "jwt expired") ? "expired" : "wrong";
                    return next(new ErrorInvalidData(`token (${exceptionStr})`, "AUTH - CHECKTOKEN"));
                }
                else
                {
                    formattedOutput("AUTH - CHECKTOKEN - SUCCESS", "***** Status: 200", "***** Token: ", token, "***** Payload: ", payload);
                    return res.json({ token, payload });
                }
            });
    else
        return next(new ErrorInvalidData("token (missing)", "AUTH - CHECKTOKEN"));
}

module.exports = { signUp, logIn, checkToken }