const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { matchedData } = require("express-validator");

const ErrorInvalidData = require("../../../exceptionsAndMiddlewares/exceptions/ErrorInvalidData");
const ErrorOperationRefused = require("../../../exceptionsAndMiddlewares/exceptions/ErrorOperationRefused");

const { errorIfExists, checkEmail, createRecord, getUser, updateRecord } = require("../../../utilities/prismaCalls");
const { removeProperties } = require("../../../utilities/general");
const { formattedOutput } = require("../../../utilities/consoleOutput");
const { fileUploadReport, deleteFileBeforeThrow } = require("../../../utilities/fileManagement");
const { createNewToken, tokenExpAt, checkIfAlreadyLogged, addTokenToBlacklist, checkIfBlacklisted } = require("../../../utilities/tokenManagement");

/**
 * Consente la registrazione di un nuovo utente (Publisher). Nel caso di esito positivo effettua il logIn dello stesso.
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
    const { name, surname, email, password, website } = matchedData(req, { onlyValidData : true });
    const { fileData } = req;
    let thumb = null;
    let token = null;
    let user = null;
    if (fileData)
    // Casi B, C o D
        if (fileUploadReport(req).File_uploaded)
        // Caso D
            thumb = req.file.filename;
    try
    {
        await checkEmail(email, errorIfExists, "AUTH - SIGNUP");
        const hashedPsw = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
        let prismaQuery = { "data" : { "name" : name, "surname" : surname, "email" : email, "password" : hashedPsw, "thumb" : thumb, "website" : website } };
        user = await createRecord("user", prismaQuery, "AUTH - SIGNUP / CREATE");
        // A creazione utente avvenuta si genera il token
        token = createNewToken(user);
        // Dopo aver creato il token bisogna registrare la sua scadenza nel database, aggiornando il record user appena creato
        prismaQuery = { "where" : { "id" : user.id }, "data" : { "tokenExpAt" : tokenExpAt(token) }};
        user = await updateRecord("user", prismaQuery, "AUTH - SIGNUP / UPDATE");
        // Se anche l'update va a buon fine si restituisce il record dell'utente creato e completo del campo di scadenza token
        removeProperties([user], "password");
        formattedOutput("AUTH - SIGNUP - SUCCESS", "***** Status: 201", "***** New User (logged): ", user, "***** Token: ", token);
        return res.status(201).json({ user, "logged" : true, token });
    }
    catch(error)
    {
        if (thumb && !token)
        // Caso D
        // Se ci sono stati errori tali da non consentire la creazione del nuovo utente, prima di lanciarli, si rimuove l'eventuale file immagine dal server
        // "!token" implica che l'errore si è verificato prima della creazione dello user, quindi il file immagine eventuale va cancellato
        // se invece l'errore si è verificato dopo la creazione ("token non null") significa che lo user è stato salvato con la "thumb" corretta
            await deleteFileBeforeThrow(req.file, "AUTH - SIGNUP");
        if (token)
        // Se l'utente è stato creato ma si è verificato un errore che ne ha impedito l'update con il campo "tokenExpAt" correttamente settato sarà "token not null"
        // Essendo "token not null" e "tokenExpAt" non aggiornato in tabella, bisognerà inserire il token nella black list ma andrà comunque comunicato il successo nella creazione dello user
        {
            await addTokenToBlacklist(token, "AUTH - SIGNUP");
            removeProperties([user], "password");
            formattedOutput("AUTH - SIGNUP - SUCCESS", "***** Status: 201", "***** New User (not logged): ", user);
            return res.status(201).json({ user, "logged" : false });
        }
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
    let token = null;
    try
    {
        let user = await getUser(email, "AUTH - LOGIN");
        // Se l'email esiste si prosegue verificando la correttezza della password, confrontando, mediante il metodo bcrypt.compare, la password (plain) ricevuta dal client con la password criptata ricavata dal db
        const checkPsw = await bcrypt.compare(password, user.password);
        if (!checkPsw)
            throw new ErrorInvalidData("password", "AUTH - LOGIN");
        // Se la password è corretta si verifica se lo user è già loggato
        const { logged, expiresIn } = checkIfAlreadyLogged(user.tokenExpAt);
        if (logged)
        {
            let expireMsg = `${expiresIn.s} ${(expiresIn.s > 1) ? "seconds" : "second"}`;
            if (expiresIn.m)
            {
                expireMsg = `${expiresIn.m} ${(expiresIn.m > 1) ? "minutes" : "minute"}, ` + expireMsg;
                if (expiresIn.h)
                    expireMsg = `${expiresIn.h} ${(expiresIn.h > 1) ? "hours" : "hour"}, ` + expireMsg;
            }
            throw new ErrorOperationRefused(`User already logged In. The token expires in ${expireMsg}.`, "AUTH - LOGIN");
        }
        // Se lo user non è già loggato si procede con il logIn
        token = createNewToken(user);
        // Dopo aver creato il token bisogna registrare la sua scadenza nel database
        user = await updateRecord("user", { "where" : { "id" : user.id }, "data" : { "tokenExpAt" : tokenExpAt(token) } });
        removeProperties([user], "password");
        formattedOutput("AUTH - LOGIN - SUCCESS", "***** Status: 200", "***** Logged user: ", user, "***** Token: ", token);
        return res.json({ user, token });
    }
    catch(error)
    {
        if (token)
            // Se token è definito significa che l'errore è stato generato in fase di "updateRecord", ovvero l'operazione di "logIn" non ha avuto successo, di conseguenza il token generato va in black list
            await addTokenToBlacklist(token, "AUTH - LOGIN"); 
        return next(error);
    }
}

async function logOut(req, res, next)
{
    // Il "logOut" è da considerarsi avvenuto con successo solo quando il database è stato aggiornato con "tokenExpAt" a null
    try
    {
        const user = await updateRecord("user", { "where" : { "id" : req.tokenOwner.id }, "data" : { "tokenExpAt" : null } }, "AUTH - LOGOUT");
        await addTokenToBlacklist(req.tokenOwner.token, "AUTH - LOGOUT");
        formattedOutput("AUTH - LOGOUT - SUCCESS", "***** Status: 200", "***** Unlogged user Id: ", req.tokenOwner.id);
        return res.json({ "Unlogged" : req.tokenOwner.id });
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
async function checkToken(req, res, next)
{
    const { token } = req.body;
    if (token)
    {
        try
        {
            const isBlacklisted = await checkIfBlacklisted(token, "AUTH - CHECKTOKEN");
            if (isBlacklisted)
                throw new ErrorInvalidData("token (in black list)", "AUTH - CHECKTOKEN");
        }
        catch(error)
        {
            return next(error);
        }
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
    }
    else
        return next(new ErrorInvalidData("token (missing)", "AUTH - CHECKTOKEN"));
}

module.exports = { signUp, logIn, logOut, checkToken }