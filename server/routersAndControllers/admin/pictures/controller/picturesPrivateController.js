const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const exceptionsFolder = "../../../../exceptionsAndMiddlewares/exceptions/";
const ErrorFromDB = require(`${exceptionsFolder}ErrorFromDB`);
const ErrorResourceNotFound = require(`${exceptionsFolder}ErrorResourceNotFound`);
const ErrorUserNotAllowed = require(`${exceptionsFolder}ErrorUserNotAllowed`);

const { prismaOperator } = require("../../../../utilities/general");
const { deleteFileBeforeThrow, buildFileObject } = require("../../../../utilities/fileManagement");
const { formattedOutput } = require("../../../../utilities/consoleOutput");

// Crud Store su rotta pictures (private)
async function store(req, res, next)
{
    let { title, description, visible, categories } = matchedData(req, { onlyValidData : true });
    const userId = req.tokenOwner.id;
    const { file } = req;
    let prismaQuery = {};
    let errorToThrow = null;
    categories = categories ?? [];
    prismaQuery =
    {
        "where"     :   { "id" : userId },
        "select"    :   { "id" : true }
    };
    // Come visto per le rotte private su "/categories", potrebbe anche essere che lo user si sia cancellato dopo essersi loggato e che dunque non sia più presente nel database, ragion per cui si procede con il check seguente
    const userIdCheck = await prismaOperator(prisma, "user", "findUnique", prismaQuery);
    // Si inizializzano "categoriesCheck" e "missingCategories"
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
    // Avendo inizializzato a ("success" : true) l'oggetto "categoriesCheck" si è certi di poter eseguire correttamente la seguente condizione, anche nel caso in cui non sia stato richiesto, per la picture corrente, il collegamento con alcuna category
    if (userIdCheck.success && categoriesCheck.success)
    {
        if (!userIdCheck.data)
            errorToThrow = new ErrorResourceNotFound(`UserId [${userId}]`, "PICTURES (private) - STORE");
        // Il seguente blocco "else if" consente di verificare quali siano le categories richieste e non esistenti (laddove ce ne siano) e, conseguentemente lanciare un errore. Avendo inizializzato a ("data" : []) l'oggetto "categoriesCheck" si ha la certezza di poter eseguire correttamente la seguente condizione sempre, senza incorrere in alcun errore logico anche nel caso in cui non siano stati richiesti collegamenti ad alcuna category.
        else if (categoriesCheck.data.length < categories.length)
        {
            categories.forEach( catId =>
                {
                    if (!categoriesCheck.data.some( idObject => idObject.id === catId ))
                        missingCategories.push(catId);
                });
            errorToThrow = new ErrorResourceNotFound(`Category Ids [${missingCategories}]`, "PICTURES (private) - STORE");
        }
        else
        {
            prismaQuery =
            {
                "data"      :   {
                                    "title"         :   title,
                                    "description"   :   description,
                                    "image"         :   file.filename,
                                    "visible"       :   visible,
                                    "userId"        :   userId,
                                    ...((categories.length !== 0) 
                                        && 
                                    {"categories"   :   {
                                                            "connect"   :   categories.map( catId => ({ "id" : catId }))
                                                        }})
                                },
                "include"   :   {   
                                    "categories"    :   {
                                                            "select"    :   { "id" : true }
                                                        }
                                }
            };
            const newPicture = await prismaOperator(prisma, "picture", "create", prismaQuery);
            if ((!newPicture.success) || (!newPicture.data))
                errorToThrow = new ErrorFromDB("Operation refused", 403, "PICTURES (private) - STORE");
            else 
            {
                const picture = newPicture.data;
                formattedOutput("PICTURES (private) - STORE - SUCCESS", "***** Status: 201", "***** New Picture: ", picture);
                return res.status(201).json({ picture });
            }
        }
    }
    else
        errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "PICTURES (private) - STORE");
    await deleteFileBeforeThrow(file, "PICTURES (private) - STORE");
    return next(errorToThrow);
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
    // Si inizia verificando che l'id della picture esista effettivamente nel database, 
    // dopodichè, in caso affermativo, si verifica che lo user titolare della foto coincida con lo user che ne sta richiedendo la cancellazione
    let errorToThrow = null;
    let prismaQuery = { "where" : { "id" : id }, "select" : { "userId" : true } };
    const pictureIdCheck = await prismaOperator(prisma, "picture", "findUnique", prismaQuery);
    if (!pictureIdCheck.success)
        errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "PICTURES (private) - DESTROY");
    else if (!pictureIdCheck.data)
        errorToThrow = new ErrorResourceNotFound(`Picture Id [${id}]`, "PICTURES (private) - DESTROY");
    else
    {
        if (pictureIdCheck.data.userId !== req.tokenOwner.id)
            errorToThrow = new ErrorUserNotAllowed("User not allowed to delete another user's picture", "PICTURES (private) - DESTROY");
        else
        {
            prismaQuery = { "where" : { "id" : id } };
            const pictureToDelete = await prismaOperator(prisma, "picture", "delete", prismaQuery);
            if (!(pictureToDelete.success && pictureToDelete.data))
                errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "PICTURES (private) - DESTROY");
            else
            {
                deleteFileBeforeThrow(buildFileObject(pictureToDelete.data.image), "PICTURES (private) - DESTROY");
                const picture = pictureToDelete.data;
                formattedOutput("PICTURES (private) - DESTROY - SUCCESS", "***** Status: 200", "***** Deleted Picture: ", picture);
                return res.json({ picture });
            }
        }
    }
    return next(errorToThrow);
}

module.exports = { store, update, destroy }