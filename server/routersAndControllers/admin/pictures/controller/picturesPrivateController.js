const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const exceptionsFolder = "../../../../exceptionsAndMiddlewares/exceptions/";
const ErrorFromDB = require(`${exceptionsFolder}ErrorFromDB`);
const ErrorResourceNotFound = require(`${exceptionsFolder}ErrorResourceNotFound`);

const { prismaOperator } = require("../../../../utilities/general");
const { deleteFileBeforeThrow } = require("../../../../utilities/fileManagement");
const { formattedOutput } = require("../../../../utilities/consoleOutput");

let prismaQuery = {};
let errorToThrow = null;

// Crud Store su rotta pictures (private)
async function store(req, res, next)
{
    let { title, description, visible, categories } = matchedData(req, { onlyValidData : true });
    const userId = req.tokenOwner.id;
    const { file } = req;
    categories = categories ?? [];
    prismaQuery =
    {
        "where"     :   { "id" : userId },
        "select"    :   { "id" : true }
    };
    // Come visto per le rotte private su "/categories", potrebbe anche essere che lo user si sia cancellato dopo essersi loggato e che dunque non sia più presente nel database, ragion per cui si procede con il check seguente
    const userIdCheck = await prismaOperator(prisma, "user", "findUnique", prismaQuery);
    // Si inizializzano "categoriesCheck" e "misingCategories"
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

module.exports = { store }