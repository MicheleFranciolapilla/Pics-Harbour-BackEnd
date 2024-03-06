const bcrypt = require("bcrypt");

const ErrorOperationRefused = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorOperationRefused");
const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorInvalidData = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorInvalidData");

const { prisma, errorIfDoesntExist, prismaCall, getUniqueItem, updateRecord } = require("../../../../utilities/prismaCalls");
const { removeProperties } = require("../../../../utilities/general");
const { deleteFileBeforeThrow, buildFileObject, fileUploadReport } = require("../../../../utilities/fileManagement");
const { formattedOutput } = require("../../../../utilities/consoleOutput");
const { addTokenToBlacklist, createNewToken, tokenExpAt } = require("../../../../utilities/tokenManagement");
const { matchedData } = require("express-validator");

async function update(req, res, next)
{
    const { name, surname, website, noThumb } = matchedData(req, { onlyValidData : true });
    const { noWebsite } = req.body;
    console.log("NOWEBSITE: ", noWebsite);
    console.log("WEBSITE: ", website);
    console.log("NAME: ", name);
    const { fileData } = req;
    // Logica della funzione:
    // Caso A:  "noThumb" non definito oppure "false"...
    // A1:  non è stato richiesto il caricamento di alcun file immagine --> 
    //      si tenta l'update dei dati, mantenendo l'eventuale file immagine corrente
    // A2:  è stato richiesto il caricamento del file immagine ma è risultato non valido -->
    //      si tenta l'update dei dati, mantenendo l'eventuale file immagine corrente
    // A3:  è stato richiesto il caricamento del file immagine ed è risultato valido -->
    //      si tenta l'update di tutto e, se va a buon fine, si rimuove il file immagine corrente, altrimenti si cancella il nuovo
    // Caso B:  "noThumb" è "true"...
    // B1:  non è stato richiesto il caricamento di alcun file immagine -->
    //      si tenta l'update dei dati e, se va a buon fine, si rimuove il file immagine corrente
    // B2:  è stato richiesto il caricamento del file immagine -->
    //      si cancella dal server il file immagine nuovo (se risultato valido) e si esegue la stessa logica del punto B1  
    // Comunque, al termine dell'operazione di update (se andata a buon fine) si rilogga l'utente, spostando in black list il token corrente
    // Se l'update non va a buon fine, tutto viene lasciato invariato, inclusa l'eventuale presenza del file immagine corrente (anche con noThumb true)
    // Se "noWebsite" è true significa che si intende rimuovere il campo "website" laddove presente
    let newThumb = null;
    if (fileData)
        if (fileUploadReport(req).File_uploaded)
            newThumb = req.file.filename;
    try
    {
        // Si recupera il record relativo allo user per acquisire il campo "thumb" e quindi l'eventuale file immagine corrente
        // L'utilizzo di "errorIfDoesntExist" è puramente formale poichè lo user, avendo richiesto l'operazione (essendo loggato) esiste sicuramente
        let prismaQuery = { "where" : { "id" : req.tokenOwner.id } };
        let user = await getUniqueItem("user", prismaQuery, errorIfDoesntExist, "USERS (PRIVATE) - UPDATE", "");
        const currentThumb = user.thumb;
        const newToken = createNewToken(user);
        prismaQuery["data"] =
        {
            "name"          :   name ?? user.name,
            "surname"       :   surname ?? user.surname,
            "website"       :   noWebsite ? null : (website ?? user.website),
            "thumb"         :   noThumb ? null : (newThumb || currentThumb),
            "tokenExpAt"    :   tokenExpAt(newToken)
        };
        let updatedUser = await updateRecord("user", prismaQuery, "USERS (PRIVATE) - UPDATE");
        // Se tutto va a buon fine.....
        // prima di restituire la response bisogna sistemare gli eventuali file immagine nel server, come richiesto dalla "logica della funzione"
        // se "noThumb" è truthy si cancellano il vecchio ed il nuovo file immagine (se presenti)
        // se "noThumb" è falsy e "newThumb" truthy, allora si cancella il vecchio file immagine (se presente)
        if (noThumb)
        {
            if (currentThumb)
                await deleteFileBeforeThrow(buildFileObject(currentThumb), "USERS (PRIVATE) - UPDATE");
            if (newThumb)
                await deleteFileBeforeThrow(req.file, "USERS (PRIVATE) - UPDATE");
        }
        else if (newThumb && currentThumb)
            await deleteFileBeforeThrow(buildFileObject(currentThumb), "USERS (PRIVATE) - UPDATE");
        // Prima di concludere si sposta il vecchio token nella black list
        await addTokenToBlacklist(req.tokenOwner.token, "USERS (PRIVATE) - UPDATE");
        removeProperties([user, updatedUser], "password");
        formattedOutput("USERS (private) - UPDATE", "***** Status: 200", "***** Previous: ", user, "***** Updated: ", updatedUser, "***** New token: ", newToken);
        return res.json({ "previous" : {...user}, "updated" : {...updatedUser}, "token" : newToken });
    }
    catch(error)
    {
        // Si può giungere al blocco catch attraverso una delle seguenti chiamate:
        // - 1: getUniqueItem
        // - 2: updateRecord
        // In entrambi i casi l'update non ha avuto luogo, quindi l'unica operazione da compiere prima di lanciare l'errore è cancellare l'eventuale nuovo file immagine
        if (newThumb)
            await deleteFileBeforeThrow(req.file, "USERS (PRIVATE) - UPDATE");
        return next(error);
    }
}

async function changePassword(req, res, next)
{
    // L'aver utilizzato il middleware "cascadePasswordsValidator" assicura che ...
    // - i campi "password", "newPassword" e "confirmNew" siano validi,
    // - i campi "newPassword" e "confirmNew" (trimmati) coincidano
    // Resta da verificare che la password fornita sia valida e che sia quella effettivamente associata allo user richiedente l'operazione
    const { password, newPassword } = matchedData(req);
    try
    {
        // Si recuperano le informazioni relative allo user per verificare che la password sia corretta.
        // L'utilizzo di "errorIfDoesntExist" è puramente formale poichè lo user, avendo richiesto l'operazione (essendo loggato) esiste sicuramente
        let prismaQuery = { "where" : { "id" : req.tokenOwner.id } };
        let user = await getUniqueItem("user", prismaQuery, errorIfDoesntExist, "USERS (PRIVATE) - CHANGE PASSWORD", "");
        const checkPsw = await bcrypt.compare(password, user.password);
        if (!checkPsw)
            throw new ErrorInvalidData("password", "USERS (PRIVATE) - CHANGE PASSWORD");
        // Una volta verificata l'autenticità della password fornita, si cripta la nuova password che sostituirà la precedente
        const newHashedPsw = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS));
        // Si genera un nuovo token di modo che l'utente venga riloggato ed il vecchio token venga passato in black list
        const newToken = createNewToken(user);
        prismaQuery["data"] = { "password" : newHashedPsw, "tokenExpAt" : tokenExpAt(newToken) };
        user = await updateRecord("user", prismaQuery, "USERS (PRIVATE) - CHANGE PASSWORD");
        // Se l'operazione di update va a buon fine, si passa il vecchio token in black list
        await addTokenToBlacklist(req.tokenOwner.token, "USERS (PRIVATE) - CHANGE PASSWORD");
        formattedOutput("USERS (PRIVATE) - CHANGE PASSWORD", "***** Status: 200", "***** Password changed for user: ", user.id, "***** New token: ", newToken);
        return res.json({ "userId" : user.id, "token" : newToken });
    }
    catch(error)
    {
        return next(error);
    }
}

async function destroy(req, res, next)
{
    // Regole generali:
    // - Nel database deve sempre esistere almeno uno user con ruolo "Admin", quindi un "Admin" può cancellarsi solo se non è l'unico
    // - Essendo le "categories" associate all' "Admin", all'atto della cancellazione dello stesso, le sue "categories" passano ad un altro pari ruolo 
    const { tokenOwner } = req;
    let prismaQuery = { "where" : { "NOT" : { "id" : tokenOwner.id }, "role" : "Admin" } };
    let prismaTransaction = null;
    let alternativeSA = null;
    try
    {
        if (tokenOwner.role === "Admin")
        // Se lo user che intende cancellarsi è un "Admin" se ne ricerca un altro nel db; se non c'è si abbandona con errore specifico
        {
            alternativeSA = await prismaCall("user", "findFirst", prismaQuery, "USERS (PRIVATE) - DESTROY");
            if (!alternativeSA)
                throw new ErrorOperationRefused("The 'unique' Admin cannot be deleted", "USERS (PRIVATE) - DESTROY");
            removeProperties([alternativeSA], "password");
        }
        // Si unifica il codice per "Publisher" e "Admin" facendo ricorso alla "transaction" di Prisma.
        // La "transaction" consente di effettuare più operazioni sul database salvando i risultati solo se tutte vanno a buon fine.
        // Nel caso in cui NON tutte le operazioni della "transaction" vanno a buon fine, viene effettuato un "rollback" per quelle già eseguite con successo.
        await prisma.$transaction( async (instance) =>
            {
                // Nel caso specifico, la "transaction" ha particolare senso nel caso dell' "Admin", poichè esegue le seguenti due operazioni:
                // - riassegnazione delle categories al nuovo Admin
                // - cancellazione dello user Admin
                let updatedCategories = null;
                if (tokenOwner.role === "Admin")
                {
                    // Operazione per il solo caso "Admin"
                    updatedCategories = await instance.category.updateMany({ "where" : { "userId" : tokenOwner.id }, "data" : { "userId" : alternativeSA.id } });
                    formattedOutput(
                        "USERS (PRIVATE) - DESTROY / TRANSACTION: UPDATE CATEGORIES (TENTATIVE)",
                        `***** Numbers of categories updated: ${updatedCategories.count}`,
                        `***** From user Id ${tokenOwner.id} (not yet deleted)`,
                        `***** To user Id ${alternativeSA.id}`);
                }
                // Operazione unificata
                let deletedUser = await instance.user.delete({ "where" : { "id" : tokenOwner.id } , "include" : { "pictures" : { "select" : { "image" : true } } } });
                removeProperties([deletedUser], "password");
                formattedOutput("USERS (private) - DESTROY - SUCCESS", "***** Status: 200", "***** Deleted User: ", deletedUser);
                prismaTransaction = { updatedCategories, deletedUser };
            });
        // Si cancellano dal server il file immagine dello user (se presente)...
        if (prismaTransaction.deletedUser.thumb)
            await deleteFileBeforeThrow(buildFileObject(prismaTransaction.deletedUser.thumb), "USERS (PRIVATE) - DESTROY");
        // ... e tutti i files immagine delle pictures associate allo user (codice unificato ma effettivamente eseguito solo per i Publisher)
        for (let index = 0; index < prismaTransaction.deletedUser.pictures.length; index++)
            await deleteFileBeforeThrow(buildFileObject(prismaTransaction.deletedUser.pictures[index].image), "USERS (PRIVATE) - DESTROY");
        // Si aggiunge il token alla black list in modo da evitare conflitti in caso di riutilizzo, anche se con user cancellato
        await addTokenToBlacklist(tokenOwner.token, "USERS (PRIVATE) - DESTROY");
        return res.json({ "user" : {...prismaTransaction.deletedUser} });
    }
    catch(error)
    {
        if ((error instanceof ErrorFromDB) || (error instanceof ErrorOperationRefused))
            return next(error);
        else
            return next(new ErrorFromDB(`Service temporarily unavailable: ${error.message}`, 503, "USERS (PRIVATE) - DESTROY / TRANSACTION"))
    }
}

module.exports = { update, changePassword, destroy };