const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorUserNotAllowed = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUserNotAllowed");

const { prismaOperator } = require("../../../../utilities/general");
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
            prismaQuery =
            {
                "data"  :   {
                                "name"      :   name,
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
    }
    else
        errorToThrow = new ErrorFromDB("Service temporarily unavailable", 503, "CATEGORIES (private) - STORE");
    await deleteFileBeforeThrow(file, "CATEGORIES (private) - STORE");
    return next(errorToThrow);
}

module.exports = { store }