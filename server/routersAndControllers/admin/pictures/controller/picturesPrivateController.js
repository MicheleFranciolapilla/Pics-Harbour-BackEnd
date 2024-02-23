const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorUserNotAllowed = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUserNotAllowed");
const ErrorRequestValidation = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorRequestValidation");

const { findAllCategories, createRecord, checkPictureOwnership, deletePictureIfOwner } = require("../../../../utilities/prismaCalls");
const { prismaOperator } = require("../../../../utilities/general");
const { deleteFileBeforeThrow, buildFileObject } = require("../../../../utilities/fileManagement");
const { formattedOutput } = require("../../../../utilities/consoleOutput");

// Crud Store su rotta pictures (private)
async function store(req, res, next)
{
    const { title, description, visible, categories } = matchedData(req, { onlyValidData : true });
    const { file } = req;
    if (!file)
        return next(new ErrorRequestValidation(["Image file not found into the request. Be sure to set the correct Content-Type as 'multipart/form-data' in order to upload the file."], "PICTURES (private) - STORE"));
    try
    {
        const connectedCategories = categories ?? [];
        const { missingCategories } = await findAllCategories(connectedCategories, "PICTURES (private) - STORE");
        if (missingCategories.length !== 0)
            throw new ErrorResourceNotFound(`Category Ids [${missingCategories}]`, "PICTURES (private) - STORE");
        const prismaQuery =
        {
            "data"      :   {
                                "title"         :   title,
                                "description"   :   description,
                                "image"         :   file.filename,
                                "visible"       :   visible,
                                "userId"        :   req.tokenOwner.id,
                                "categories"    :   { "connect" :   connectedCategories.map( catId => ({ "id" : catId })) }
                            },
            "include"   :   {   "categories"    :   { "select"  :   { "id" : true }}}
        }
        const picture = await createRecord("picture", prismaQuery, "PICTURES (private) - STORE");
        formattedOutput("PICTURES (private) - STORE - SUCCESS", "***** Status: 201", "***** New Picture: ", picture);
        return res.status(201).json({ picture });
    }
    catch(error)
    {
        await deleteFileBeforeThrow(file, "PICTURES (private) - STORE");
        return next(error);
    }
}

async function update(req, res, next)
{
    // Nell'ambito dell'update della picture, bisogna tenere in conto i seguenti punti:
    // - la foto in sè non è modificabile
    // - sono modificabili tutti i campi "dato", incluse le categories di riferimento
    // - è modificabile anche il titolo a patto che esso mantenga una lunghezza compresa tra il minimo e massimo consentito
    // - ovviamente non è modificabile la userId (utente titolare della foto)
    let { id, title, description, visible, categories } = matchedData(req, { onlyValidData : true });
    // Si inizia verificando che l'id della picture esista effettivamente nel database, 
    // dopodichè, in caso affermativo, si verifica che lo user titolare della foto coincida con lo user che ne sta richiedendo la modifica
    let errorToThrow = null;
    let prismaQuery = { "where" : { "id" : id }, "include" : { "categories" : { "select" : { "id" : true } } } };
    const pictureToUpdate = await prismaOperator(prisma, "picture", "findUnique", prismaQuery);
    console.log("LOG: ",pictureToUpdate);
    if (!pictureToUpdate.success)
        errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "PICTURES (private) - UPDATE");
    else if (!pictureToUpdate.data)
        errorToThrow = new ErrorResourceNotFound(`Picture Id [${id}]`, "PICTURES (private) - UPDATE");
    else
    {
        if (pictureToUpdate.data.userId !== req.tokenOwner.id)
            errorToThrow = new ErrorUserNotAllowed("User not allowed to modify another user's picture", "PICTURES (private) - UPDATE");
        else
        {
            categories = categories ?? [];
            let categoriesCheck = { "success" : true, "data" : [] };
            let missingCategories = [];
            if (categories.length !== 0)
            {
                // Si verifica che tutte le categories collegate siano effettivamente esistenti nel db
                prismaQuery =
                {
                    "where"     :   { "id" : { "in" : categories } },
                    "select"    :   { "id" : true }
                };
                categoriesCheck = await prismaOperator(prisma, "category", "findMany", prismaQuery);
            }
            if (!categoriesCheck.success)
                errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "PICTURES (private) - UPDATE");
            // Il seguente blocco "else if" consente di verificare quali siano le categories richieste e non esistenti (laddove ce ne siano) e, conseguentemente lanciare un errore. Avendo inizializzato a ("data" : []) l'oggetto "categoriesCheck" si ha la certezza di poter eseguire correttamente la seguente condizione sempre, senza incorrere in alcun errore logico anche nel caso in cui non siano stati richiesti collegamenti ad alcuna category.
            else if (categoriesCheck.data.length < categories.length)
            {
                categories.forEach( catId =>
                    {
                        if (!categoriesCheck.data.some( idObject => idObject.id === catId ))
                            missingCategories.push(catId);
                    });
                errorToThrow = new ErrorResourceNotFound(`Category Ids [${missingCategories}]`, "PICTURES (private) - UPDATE");
            }
            else
            {
                prismaQuery =
                {
                    "where"     :   {   "id"            :   id },
                    "data"      :   {
                                        "title"         :   title ?? pictureToUpdate.data.title,
                                        "description"   :   description ?? pictureToUpdate.data.description,
                                        "image"         :   pictureToUpdate.data.image,
                                        "visible"       :   (visible !== undefined) ? visible : pictureToUpdate.data.visible,
                                        "userId"        :   pictureToUpdate.data.userId,
                                        "categories"    :   {
                                                                "set"   :   categories.map( catId => ({ "id" : catId }))
                                                            }
                                    },
                    "include"   :   {   
                                        "categories"    :   {
                                                                "select"    :   { "id" : true }
                                                            }
                                    }
                };
                const updatedPicture = await prismaOperator(prisma, "picture", "update", prismaQuery);
                if ((!updatedPicture.success) || (!updatedPicture.data))
                    errorToThrow = new ErrorFromDB("Operation refused", 403, "PICTURES (private) - UPDATE");
                else 
                {
                    const picture = updatedPicture.data;
                    formattedOutput("PICTURES (private) - UPDATE - SUCCESS", "***** Status: 200", "***** Previous: ", pictureToUpdate.data, "***** Updated: ", picture);
                    return res.json({ previous : {...pictureToUpdate.data}, updated : {...picture} });
                }
            }
        }
    }
    return next(errorToThrow);
}

async function destroy(req, res, next)
{
    const { id } = matchedData(req, { onlyValidData : true });
    // Viene eseguita la funzione "deletePictureIfOwner", la quale esegue, in ordine, i seguenti tasks:
    // verifica che l'id fornito corrisponda ad una picture esistente, altrimenti genera un errore,
    // verifica che il richiedente la cancellazione sia l'effettivo titolare della picture da cancellare, altrimenti genera un errore,
    // in assenza di errori procede alla cancellazione e restituisce il record cancellato
    try
    {
        const picture = await deletePictureIfOwner(id, req.tokenOwner.id, "PICTURES (private) - DESTROY");
        await deleteFileBeforeThrow(buildFileObject(picture.image), "PICTURES (private) - DESTROY");
        formattedOutput("PICTURES (private) - DESTROY - SUCCESS", "***** Status: 200", "***** Deleted Picture: ", picture);
        return res.json({ picture });
    }
    catch(error)
    {
        return next(error);
    }
}

module.exports = { store, update, destroy }