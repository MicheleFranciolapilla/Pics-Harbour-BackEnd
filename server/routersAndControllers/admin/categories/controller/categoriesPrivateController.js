const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorUserNotAllowed = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUserNotAllowed");
const ErrorRepeatedData = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorRepeatedData");

const { prismaOperator, basicSlug } = require("../../../../utilities/general");
const { deleteFileBeforeThrow } = require("../../../../utilities/fileManagement");
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
        "select"    :   { "id" : true }
    };
    // Si verifica l'esistenza della userId nel database poichè, in casi estremi, lo user (Super Admin per le rotte private di "/categories") potrebbe anche essersi cancellato dopo essersi loggato ed il suo token potrebbe ancora essere valido.
    // In futuro si potrebbe considerare l'eventualità che lo user (Super Admin) possa, nel frattempo anche essere stato degradato a semplice "Admin". Al momento non si considera questa possibilità.
    const userIdCheck = await prismaOperator(prisma, "user", "findUnique", prismaQuery);
    if (userIdCheck.success)
    {
        if (!userIdCheck.data)
            errorToThrow = new ErrorResourceNotFound(`UserId [${userId}]`, "CATEGORIES (private) - STORE");
        // Il blocco "else if" seguente può essere ripreso in considerazione nel caso futuro enunciato nel commento precedente
        // else if (userIdCheck.data.role !== "Super Admin")       
        //     errorToThrow = new ErrorUserNotAllowed("User not allowed to create categories", "CATEGORIES (PRIVATE) - STORE");
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

module.exports = { store }