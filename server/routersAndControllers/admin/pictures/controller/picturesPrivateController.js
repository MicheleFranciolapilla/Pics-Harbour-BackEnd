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

async function store(req, res, next)
{
    let { title, description, visible, userId, categories } = matchedData(req, { onlyValidData : true });
    const { file } = req;
    categories = categories ?? [];
    console.log("CATEGORIES: ", categories);
    console.log("FILE OBJ: ",file);
    prismaQuery =
    {
        "where"     :   { "id" : userId },
        "select"    :   { "id" : true }
    };
    const userIdCheck = await prismaOperator(prisma, "user", "findUnique", prismaQuery);
    console.log("QUERY SU USERID.... ", userIdCheck);
    prismaQuery =
    {
        "where"     :   { "id" : { "in" : categories } },
        "select"    :   { "id" : true }
    };
    let categoriesCheck = { "success" : true, "data" : [] };
    let missingCategories = [];
    if (categories.length !== 0)
        categoriesCheck = await prismaOperator(prisma, "category", "findMany", prismaQuery);
    console.log("SUPERATA QUERY SU CATEGORIES ", categoriesCheck);
    let errorToThrow = null;
    if (userIdCheck.success && categoriesCheck.success)
    {
        if (!userIdCheck.data)
            errorToThrow = new ErrorResourceNotFound(`UserId [${userId}]`, "PICTURES (private) - STORE");
        else if (categoriesCheck.data.length < categories.length)
        {
            missingCategories = categories.filter( catId => !(categoriesCheck.data.includes(catId)));
            errorToThrow = new ErrorResourceNotFound(`Category Ids [${missingCategories}]`, "PICTURES (private) - STORE");
        }
        else
        {
            prismaQuery =
            {
                "data"  :   {
                                "title"         :   title,
                                "description"   :   description,
                                "image"         :   file.filename,
                                "visible"       :   visible,
                                "userId"        :   userId,
                                ...((categories.length !== 0) 
                                    && 
                                {"categories"   :   categories})
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
    let success = true;
    try
    {
        await deleteFileBeforeThrow(file);
    }
        catch(error)
    {
        success = false;
    }
    formattedOutput("FILE DELETION BY PICTURES (private) - STORE", `File to delete:   ${file.filename}`, `File folder:   ${file.destination}`, success ? "File successfully deleted" : "File not deleted, <<< DELETE IT MANUALLY >>>");
    return next(errorToThrow);
}

module.exports = { store }