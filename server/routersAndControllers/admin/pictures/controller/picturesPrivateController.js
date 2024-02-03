const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function store(req, res, next)
{
    console.log("BIS", req.file);
    console.log("EXT: ", req.checkFileExtensionValidity);
    console.log("TYPE: ", req.checkFileTypeValidity);
    console.log("SIZE: ", req.checkFileSizeValidity);
}

module.exports = { store }