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

let prismaQuery = {};
let errorToThrow = null;

async function store(req, res, next)
{
    const { name, userId } = matchedData(req, { onlyValidData : true });
    const { file } = req;
    // In virtù del fatto che le categorie possono essere create solo dai "Super Admin", contestualmente alla verifica di esistenza dello user (creatore della category), se ne verifica anche il ruolo
    // VALUTARE IN FUTURO SE SPOSTARE I CONTROLLI RELATIVI ALLE AUTORIZZAZIONI DENTRO UNO SPECIFICO MIDDLEWARE DI ROTTA PRIVATA
    prismaQuery =
    {
        "where"     :   { "id" : userId },
        "select"    :   { "role" : true }
    };
    const userIdCheck = await prismaOperator(prisma, "user", "findUnique", prismaQuery);
    if (userIdCheck.success)
    {
        if (!userIdCheck.data)
            errorToThrow = new ErrorResourceNotFound(`UserId [${userId}]`, "CATEGORIES (private) - STORE");
        else if (userIdCheck.data.role !== "Super Admin")       
            errorToThrow = new ErrorUserNotAllowed("User not allowed to create categories", "CATEGORIES (PRIVATE) - STORE");
        else
        {
            const nameSlug = basicSlug(name, "-");
            // Si verifica che non sia già presente una category con lo stesso slug
            prismaQuery = { "where" :   { "slug" : nameSlug } };
            const slugCheck = await prismaOperator(prisma, "category", "findUnique", prismaQuery);
            if (!slugCheck.success)
                errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - STORE");
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