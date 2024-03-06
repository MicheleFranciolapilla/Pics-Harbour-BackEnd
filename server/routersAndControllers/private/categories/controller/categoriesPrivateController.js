const { matchedData } = require("express-validator");

const ErrorUnsupportedFile = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUnsupportedFile");
const ErrorRequestValidation = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorRequestValidation");

const { errorIfExists, errorIfDoesntExist, checkSlug, createRecord, updateRecord, deleteRecord, getUniqueItem } = require("../../../../utilities/prismaCalls");
const { basicSlug, removeProperties } = require("../../../../utilities/general");
const { deleteFileBeforeThrow, buildFileObject, fileUploadReport } = require("../../../../utilities/fileManagement");
const { formattedOutput } = require("../../../../utilities/consoleOutput");

async function store(req, res, next)
{
    const { name } = matchedData(req, { onlyValidData : true });
    const { file } = req;
    if (!file)
        return next(new ErrorRequestValidation("Image file not found into the request. Be sure to set the correct Content-Type as 'multipart/form-data' in order to upload the file.", "CATEGORIES (private) - STORE"));
    // Superata la barriera del middleware autorizzativo, si può essere certi che lo user che ha richiesto l'operazione è un "Admin", esistente e loggato.
    const nameSlug = basicSlug(name);
    try
    {
        // Si verifica che non sia già presente una category con lo stesso slug
        await checkSlug(nameSlug, errorIfExists, "CATEGORIES (private) - STORE");
        // Se nel db non è presente una category con lo stesso slug si può procedere con la creazione della stessa
        const prismaQuery = { "data" : { "name" : name, "slug" : nameSlug, "thumb" : file.filename, "userId" : req.tokenOwner.id } };
        const category = await createRecord("category", prismaQuery, "CATEGORIES (private) - STORE");
        formattedOutput("CATEGORIES (private) - STORE - SUCCESS", "***** Status: 201", "***** New Category: ", category);
        return res.status(201).json({ category });
    }
    catch(error)
    {
        await deleteFileBeforeThrow(file, "CATEGORIES (private) - STORE");
        return next(error);
    }
}

async function update(req, res, next)
{
    // La modifica della category segue la stessa regola generale della cancellazione
    // Gli unici elementi modificabili sono il "name" (quindi lo "slug") ed il file immagine ("thumb")
    // Indipendentemente dalla modifica del "name" e/o del file, è possibile richiedere la disconnessione della category dalle pictures ad essa collegate.
    // Per la disconnessione bisogna includere nel body della request il campo "disconnect" con valore true
    // Se si richiede la disconnessione contestualmente all'update (nuovo "name" e/o nuovo file), allora essa ha luogo solo ad update avvenuto con successo.
    // A seguito dell'eventuale update, la userId della category sarà quella dell'Admin che ne ha richiesto la modifica
    const { id, name, disconnect } = matchedData(req, { onlyValidData : true });
    const { fileData } = req;
    // Se il middleware autorizzativo ha permesso di giungere fin quì significa che il richiedente è un Admin, quindi non si effettua il check in tal senso.
    let responseObj = {};
    let prismaQuery = { "where" : { "id" : id }, "include" : { "pictures" : { "select" : { "id" : true } } } };
    let categoryIdCheck = {};
    try
    {
        // Si inizia verificando che la categoria esista
        categoryIdCheck = await getUniqueItem("category", prismaQuery, errorIfDoesntExist, "CATEGORIES (private) - UPDATE", `Category Id [${id}]`);
        const nameSlug = (name) ? basicSlug(name) : categoryIdCheck.slug;
        // Si setta l'attributo "data" della "prismaQuery" con tutti i dati corretti, al fine di poter effettuare tutte le seguenti chiamate al DB
        // Il settaggio è tale che, nella query figurino tutti i dati aggiornati della category, pronti per l'update.
        // Vengono inoltre rimossi i campi che ostacolerebbero il corretto funzionamento del metodo "update"
        prismaQuery["data"] = {...categoryIdCheck};
        prismaQuery.data.userId = req.tokenOwner.id;
        if (name)
            prismaQuery.data.name = name;
        prismaQuery.data.slug = nameSlug;
        removeProperties([prismaQuery.data], "id", "createdAt", "updatedAt", "pictures");
        if ((name) && (nameSlug !== categoryIdCheck.slug))
        // Se "name" è definito ed il nuovo "slug" è diverso dal vecchio, si verifica che non sia già presente nel db
            await checkSlug(nameSlug, errorIfExists, "CATEGORIES (private) - UPDATE");
        // Giunti a questo punto, si aprono i seguenti scenari.....
        // -A-  Non è stato richiesto l'upload di un nuovo file immagine, quindi, se un update ci sarà riguarderà il "name"
        // -A1- "name" è definito --> si procede con l'update.
        //      In caso di insuccesso si genera un errore
        //      In caso di successo si rimanda al check finale di "disconnect" 
        // -A2- "name" è undefined --> si rimanda al check finale di "disconnect"
        // -B-  E' stato richiesto l'upload di un nuovo file immagine, quindi l'update riguarderà sicuramente il file e, eventualmente anche il "name"
        // -B1- Il file non è valido --> si genera un errore
        // -B2- Il file è valido --> si procede con l'update.
        //      In caso di insuccesso si genera un errore
        //      In caso di successo si rimanda al check finale di "disconnect"
        // -C-  Si procede con il check finale di "disconnect" ma solo in assenza di errori
        if (!fileData)
        // Caso A
        {
            if (name)
            // Caso A1
            {
                const categoryToUpdate = await updateRecord("category", prismaQuery, "CATEGORIES (private) - UPDATE");
                // Se l'update non genera errori si procede aggiornando "responseObj"
                responseObj["previous"] = {...categoryIdCheck};
                responseObj["updated"] = {...categoryToUpdate};
            }
        }
        else
        // Caso B
        {
            const uploadReport = fileUploadReport(req);
            if (!uploadReport.File_uploaded)
            // Caso B1 (file non valido; mai caricato oppure già cancellato dal multer middleware terminator)
                throw new ErrorUnsupportedFile("Unsupported file: " + JSON.stringify(uploadReport, null, 3), "CATEGORIES (private) - UPDATE");
            else
            // Caso B2
            {
                // si aggiunge la proprietà "thumb" a "prismaQuery.data" di modo da poter procedere con l'update con il nuovo file immagine
                // Essendo stato caricato il file, da multer, esiste sicuramente l'oggetto "file" nella request, contenente il nome del file
                prismaQuery.data.thumb = req.file.filename;
                const categoryToUpdate = await updateRecord("category", prismaQuery, "CATEGORIES (private) - UPDATE");
                // In caso di successo bisognerà rimuovere dal server il vecchio file immagine
                await deleteFileBeforeThrow(buildFileObject(categoryIdCheck.thumb), "CATEGORIES (private) - UPDATE (SUCCESSED)");
                responseObj["previous"] = {...categoryIdCheck};
                responseObj["updated"] = {...categoryToUpdate};
            }
        }
    }
    catch(error)
    // Se il processo ha generato un errore si chiude ma prima bisogna cancellare l'eventuale file caricato da multer
    {
        if (fileData)
            if (fileUploadReport(req).File_uploaded)
                await deleteFileBeforeThrow(req.file, "CATEGORIES (private) - UPDATE (NOT SUCCESSED)");
        return next(error);
    }
    // Altrimenti si entra nel caso C, dentro cui ricade uno dei casi A1 (prosecuzione), A2, B2 (prosecuzione).
    // Nel caso C si valuta se è stata richiesta la disconnessione delle pictures dalla category in oggetto
    if (disconnect)
    // Solo se "disconnect" è truthy (definito, non nullo e true) si procede alla disconnessione delle pictures
    {
        // Si completa la proprietà "data" della query, essendo "where" e "include" già definite e valide
        prismaQuery.data["pictures"] = { "set" : [] };
        try
        {
            const disconnectPictures = await updateRecord("category", prismaQuery, "CATEGORIES (private) - PICTURES DISCONNECTION");
            // In caso di successo si aggiorna, in responseObj il campo "updated" e si comunica l'avvenuta disconnessione
            // Si assegna anche il campo "previous" poichè potrebbe essere stata richiesta la sola disconnessione, senza alcun "update" di "name" o file
            responseObj["previous"] = {...categoryIdCheck};
            responseObj["updated"] = {...disconnectPictures};
            responseObj["disconnection"] = "success";

        }
        catch(error)
        {
            // In caso di insuccesso si hanno le seguenti conseguenze:
            // Se "responseObj" è oggetto vuoto significa che è stata richiesta la sola disconnessione, quindi si deve generare un errore
            if (Object.keys(responseObj).length === 0)
                return next(error);
            // Altrimenti si restituisce una response globalmente positiva, specificando la non avvenuta disconnessione
            responseObj["disconnection"] = "not successed";
        }
    }
    // Si chiude restituendo lo status 200 con i dati riportati in "responseObj"
    // Laddove non fosse stata eseguita alcuna operazione (name undefined, file immagine non caricato e disconnect undefined o false) si otterrà comunque uno status 200 con campi vuoti
    formattedOutput("CATEGORIES (private) - UPDATE - SUCCESS", "***** Status: 200", "***** Previous: ", responseObj.previous, "***** Updated: ", responseObj.updated, disconnect && "***** Pictures disconnection: ", disconnect && responseObj.disconnection);
    return res.json({...responseObj});
}

async function destroy(req, res, next)
{
    // La cancellazione della categoria è permessa ai soli "Admin", a prescindere che il richiedente sia l'effettivo creatore o ultimo modificatore della stessa.
    const { id } = matchedData(req, { onlyValidData : true });
    // Il controllo di esistenza e la generazione degli eventuali, conseguenti errori, vengono effettuati direttamente all'interno della funzione "deleteRecord"
    try
    {
        const category = await deleteRecord("category", { "where" : { "id" : id } }, "CATEGORIES (private) - DESTROY", `Category Id [${id}]`);
        await deleteFileBeforeThrow(buildFileObject(category.thumb), "CATEGORIES (private) - DESTROY");
        formattedOutput("CATEGORIES (private) - DESTROY - SUCCESS", "***** Status: 200", "***** Deleted Category: ", category);
        return res.json({ category });
    }
    catch(error)
    {
        return next(error);
    }
}

module.exports = { store, update, destroy }