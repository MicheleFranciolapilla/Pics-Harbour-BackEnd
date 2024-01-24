const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ErrorFromDB = require("../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const { removeProperties } = require("../../../utilities/general");

async function index(req, res, next)
{
    try
    {
        const users = await prisma.user.findMany();
        removeProperties(users, "password");
        console.log("Users: ", users);
        return res.json({ "Users" : users });
    }
    catch(error)
    {
        console.log("Service unavailable");
        return next(new ErrorFromDB("Service unavailable"));
    }
}

module.exports = { index };