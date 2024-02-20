const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorUserNotAllowed = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUserNotAllowed");
const ErrorRepeatedData = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorRepeatedData");
const ErrorUnsupportedFile = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUnsupportedFile");

const { prismaOperator, basicSlug, addPropertyAtPosition } = require("../../../../utilities/general");
const { deleteFileBeforeThrow, buildFileObject, fileUploadReport } = require("../../../../utilities/fileManagement");
const { formattedOutput } = require("../../../../utilities/consoleOutput");

async function store(req, res, next)
{
    const { name } = matchedData(req, { onlyValidData : true });
    const userId = req.tokenOwner.id;
    const { file } = req;
    let prismaQuery = {};
    let errorToThrow = null;
    prismaQuery =
    {
        "where"     :   { "id" : userId },
        "select"    :   { "id" : true, "role" : true }
    };
    // In linea teorica, una volta superata la barriera del middleware autorizzativo, si può essere certi che lo user che ha richiesto l'operazione sia un "Super Admin" e che sia esistente e loggato, ma, ad ogni modo, eseguiamo un double check.
    const userIdCheck = await prismaOperator(prisma, "user", "findUnique", prismaQuery);
    if (userIdCheck.success)
    {
        if (!userIdCheck.data)
            errorToThrow = new ErrorResourceNotFound(`UserId [${userId}]`, "CATEGORIES (private) - STORE");
        else if (userIdCheck.data.role !== "Super Admin")       
            errorToThrow = new ErrorUserNotAllowed("User not allowed to create categories", "CATEGORIES (PRIVATE) - STORE");
        else
        {
            const nameSlug = basicSlug(name);
            // Si verifica che non sia già presente una category con lo stesso slug
            prismaQuery = { "where" :   { "slug" : nameSlug } };
            const slugCheck = await prismaOperator(prisma, "category", "findUnique", prismaQuery);
            if (!slugCheck.success)
                errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - STORE");
            // Se nel db non è presente una category con lo stesso slug si può procedere con la creazione della stessa
            else if (!slugCheck.data)
            {
                prismaQuery =
                {
                    "data"  :   {
                                    "name"      :   name,
                                    "slug"      :   nameSlug,
                                    "thumb"     :   file.filename,
                                    "userId"    :   userId
                                }
                }
                const newCategory = await prismaOperator(prisma, "category", "create", prismaQuery);
                if ((!newCategory.success) || (!newCategory.data))
                    errorToThrow = new ErrorFromDB("Operation refused", 403, "CATEGORIES (private) - STORE");
                else
                {
                    const category = newCategory.data;
                    formattedOutput("CATEGORIES (private) - STORE - SUCCESS", "***** Status: 201", "***** New Category: ", category);
                    return res.status(201).json({ category });
                }
            }
            else
                errorToThrow = new ErrorRepeatedData("slug", "CATEGORIES (private) - STORE");
        } 
    }
    else
        errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - STORE");
    await deleteFileBeforeThrow(file, "CATEGORIES (private) - STORE");
    return next(errorToThrow);
}

async function update(req, res, next)
{
    // La modifica della category segue la stessa regola generale della cancellazione
    // Gli unici elementi modificabili sono il "name" (quindi lo "slug") ed il file immagine ("thumb")
    // Indipendentemente dalla modifica del "name" e/o del file, è possibile richiedere la disconnessione della category dalle pictures ad essa collegate.
    // Per la disconnessione bisogna includere nel body della request il campo "disconnect" con valore true
    // Se si richiede la disconnessione contestualmente all'update (nuovo "name" e/o nuovo file), allora essa ha luogo solo ad update avvenuto con successo.
    // A seguito dell'eventuale update, la userId della category sarà quella del Super Admin che ne ha richiesto la modifica
    const { id, name, disconnect } = matchedData(req, { onlyValidData : true });
    let errorToThrow = null;
    let responseObj = {};
    let uploadReport = null;
    let prismaQuery = { "where" : { "id" : id }, "include" : { "pictures" : { "select" : { "id" : true } } } };
    let dataQuery = { "data" : { "userId" : req.tokenOwner.id } };
    // Si inizia verificando che la categori esista
    const categoryIdCheck = await prismaOperator(prisma, "category", "findUnique", prismaQuery);
    console.log(categoryIdCheck.data);
    if (!categoryIdCheck.success)
        errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - UPDATE");
    else if (!categoryIdCheck.data)
        errorToThrow = new ErrorResourceNotFound(`Category Id [${id}]`, "CATEGORIES (private) - UPDATE");
    else
    {
        // A rigor di logica, se il middleware autorizzativo ha permesso di giungere fin quì significa che il richiedente è un Super Admin.
        // Ad ogni modo si effettua il controllo specifico, seppur ridondante
        if (req.tokenOwner.role !== "Super Admin")
            errorToThrow = new ErrorUserNotAllowed("User not allowed to modify categories", "CATEGORIES (PRIVATE) - UPDATE");
        else
        {
            const nameSlug = (name) ? basicSlug(name) : categoryIdCheck.data.slug;
            dataQuery.data["name"] = (name) ? name : categoryIdCheck.data.name;
            dataQuery.data["slug"] = nameSlug;
            // Il flag "canProceed" consente di unificare i percorsi relativi all'ipotetico "else" sulla seguente condizione e al caso di "slug" valido dentro l'"if"
            let canProceed = true;
            if ((name) && (nameSlug !== categoryIdCheck.data.slug))
            {
                // Se "name" è definito ed il nuovo "slug" è diverso dal vecchio, si verifica che non sia già presente nel db
                canProceed = false;
                const categorySlugCheck = await prismaOperator(prisma, "category", "findUnique", { "where" : { "slug" : nameSlug } })
                if (!categorySlugCheck.success)
                    errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - UPDATE");
                else if (categorySlugCheck.data)
                    errorToThrow = new ErrorRepeatedData("slug", "CATEGORIES (private) - UPDATE");
                else    
                    canProceed = true;
            }
            if (canProceed)
            {
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
                // -C-  Si procede con il check finale di "disconnect" solo in assenza di errori (errorToThrow = null)

                const { fileData } = req;
                if (!fileData)
                // Caso A
                {
                    if (name)
                    // Caso A1
                    {
                        // "dataQuery" è completa, si può quindi comporre la "prismaQuery" e procedere
                        prismaQuery = addPropertyAtPosition(prismaQuery, "data", dataQuery.data, 1);
                        console.log(prismaQuery)
                        const categoryToUpdate = await prismaOperator(prisma, "category", "update", prismaQuery);
                        if (!(categoryToUpdate.success && categoryToUpdate.data))
                            errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - UPDATE");
                        else
                        {
                            responseObj["previous"] = {...categoryIdCheck.data};
                            responseObj["updated"] = {...categoryToUpdate.data};
                        }
                    }
                }
                else
                // Caso B
                {
                    uploadReport = fileUploadReport(req);
                    if (!uploadReport.File_uploaded)
                    // Caso B1 (file non valido; mai caricato oppure già cancellato dal multer middleware terminator)
                        errorToThrow = new ErrorUnsupportedFile("Unsupported file: " + JSON.stringify(uploadReport, null, 3), "CATEGORIES (private) - UPDATE");
                    else
                    // Caso B2
                    {
                        // si aggiunge la proprietà "thumb" a "dataQuery.data", dopodichè si può comporre la "prismaQuery" e procedere
                        dataQuery.data["thumb"] = fileData.filename;
                        prismaQuery = addPropertyAtPosition(prismaQuery, "data", dataQuery.data, 1);
                        console.log(prismaQuery)
                        const categoryToUpdate = await prismaOperator(prisma, "category", "update", prismaQuery);
                        if (!(categoryToUpdate.success && categoryToUpdate.data))
                        {
                            // In caso di errore nell'upload si dovrà rimuovere dal server il nuovo file immagine
                            deleteFileBeforeThrow(fileData, "CATEGORIES (private) - UPDATE (NOT SUCCESSED)");
                            errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - UPDATE");
                        }
                        else
                        {
                            // In caso di successo bisognerà rimuovere dal server il vecchio file immagine
                            deleteFileBeforeThrow(buildFileObject(categoryIdCheck.data.thumb), "CATEGORIES (private) - UPDATE (SUCCESSED)");
                            responseObj["previous"] = {...categoryIdCheck.data};
                            responseObj["updated"] = {...categoryToUpdate.data};
                        }
                    }
                }
            }
        }
    }
    if (errorToThrow)
    // Se il processo ha generato un errore si chiude
        return next(errorToThrow);
    // Altrimenti si entra nel caso C, dentro cui ricade uno dei casi A1 (prosecuzione), A2, B2 (prosecuzione).
    // Nel caso C si valuta se è stata richiesta la disconnessione delle pictures dalla category in oggetto
    if (disconnect)
    {
        // Si sovrascrive (o si crea) solo la proprietà "data", essendo "where" e "include" già definite e valide
        prismaQuery["data"] = { "pictures" : { "set" : [] } };
        console.log(prismaQuery);
        const disconnectPictures = await prismaOperator(prisma, "category", "update", prismaQuery);
        if (!(disconnectPictures.success && disconnectPictures.data))
        {
            // In caso di insuccesso si hanno le seguenti conseguenze:
            // Se "responseObj" è oggetto vuoto significa che è stata richiesta la sola disconnessione, quindi si deve generare un errore
            if (Object.keys(responseObj).length === 0)
                return next(new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - PICTURES DISCONNECTION"));
            // Altrimenti si restituisce una response globalmente positiva, specificando la non avvenuta disconnessione
            responseObj["disconnection"] = "not successed";
        }
        else
        {
            // In caso di successo si aggiorna, in responseObj il campo "updated" e si comunica l'avvenuta disconnessione
            responseObj["updated"] = {...disconnectPictures.data};
            responseObj["disconnection"] = "success";
        }
    }
    // Si chiude restituendo lo status 200 con i dati riportati in "responseObj"
    formattedOutput("CATEGORIES (private) - UPDATE - SUCCESS", "***** Status: 200", "***** Previous: ", responseObj.previous, "***** Updated: ", responseObj.updated, disconnect && "***** Pictures disconnection: ", disconnect && responseObj.disconnection);
    return res.json({...responseObj});
}

async function destroy(req, res, next)
{
    // La cancellazione della categoria è permessa ai soli "Super Admin", a prescindere che il richiedente sia l'effettivo creatore o ultimo modificatore della stessa.
    const { id } = matchedData(req, { onlyValidData : true });
    let errorToThrow = null;
    let prismaQuery = { "where" : { "id" : id } };
    // Si inizia verificando che la categoria esista
    const categoryIdCheck = await prismaOperator(prisma, "category", "findUnique", prismaQuery);
    if (!categoryIdCheck.success)
        errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - DESTROY");
    else if (!categoryIdCheck.data)
        errorToThrow = new ErrorResourceNotFound(`Category Id [${id}]`, "CATEGORIES (private) - DESTROY");
    else
    {
        // A rigor di logica, se il middleware autorizzativo ha permesso di giungere fin quì, significa che il richiedente è un super admin; ad ogni modo effettuiamo il controllo specifico, seppur ridondante
        if (req.tokenOwner.role !== "Super Admin")
            errorToThrow = new ErrorUserNotAllowed("User not allowed to delete categories", "CATEGORIES (PRIVATE) - DESTROY");
        else
        {
            const categoryToDelete = await prismaOperator(prisma, "category", "delete", prismaQuery);
            if (!(categoryToDelete.success && categoryToDelete.data))
                errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - DESTROY");
            else
            {
                deleteFileBeforeThrow(buildFileObject(categoryToDelete.data.thumb), "CATEGORIES (private) - DESTROY");
                const category = categoryToDelete.data;
                formattedOutput("CATEGORIES (private) - DESTROY - SUCCESS", "***** Status: 200", "***** Deleted Category: ", category);
                return res.json({ category });
            }
        }
    }
    return next(errorToThrow);
}

module.exports = { store, update, destroy }