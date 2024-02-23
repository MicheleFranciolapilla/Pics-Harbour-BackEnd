const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorUserNotAllowed = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUserNotAllowed");
const ErrorRequestValidation = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorRequestValidation");

const { findAllCategories, createRecord, checkPictureOwnership, updateRecord, deletePictureIfOwner } = require("../../../../utilities/prismaCalls");
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
            "include"   :   {   "categories"    :   { "select"  :   { "id" : true } } }
        };
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
    const { id, title, description, visible, categories } = matchedData(req, { onlyValidData : true });
    try
    {
        // Si inizia eseguendo la funzione "checkPictureOwnership", la quale eseguirà i seguenti tasks:
        // verificherà l'esistenza della picture, lanciando un errore in caso negativo, dopodichè
        // verificherà che il richiedente la modifica sia il titolare della picture, fornendo il risultato booleano del check, più il record della picture trovata
        const { ownership, picture } = await checkPictureOwnership(id, req.tokenOwner.id, "PICTURES (private) - UPDATE");
        if (!ownership)
            throw new ErrorUserNotAllowed("User not allowed to modify another user's picture", "PICTURES (private) - UPDATE");
        const connectedCategories = categories ?? [];
        const { missingCategories } = await findAllCategories(connectedCategories, "PICTURES (private) - UPDATE");
        if (missingCategories.length !== 0)
            throw new ErrorResourceNotFound(`Category Ids [${missingCategories}]`, "PICTURES (private) - UPDATE");
        const prismaQuery =
        {
            "where"     :   {   "id"            :   id },
            "data"      :   {
                                "title"         :   title ?? picture.title,
                                "description"   :   description ?? picture.description,
                                "image"         :   picture.image,
                                "visible"       :   (visible !== undefined) ? visible : picture.visible,
                                "userId"        :   picture.userId,
                                "categories"    :   { "set"     :   connectedCategories.map( catId => ({ "id" : catId })) }
                            },
            "include"   :   {   "categories"    :   { "select"  :   { "id" : true } } }
        };
        const updatedPicture = await updateRecord("picture", prismaQuery, "PICTURES (private) - UPDATE");
        formattedOutput("PICTURES (private) - UPDATE - SUCCESS", "***** Status: 200", "***** Previous: ", picture, "***** Updated: ", updatedPicture);
        return res.json({ previous : {...picture}, updated : {...updatedPicture} });
    }
    catch(error)
    {
        return next(error);
    }
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