const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

async function store(req, res, next)
{
    console.log("BODY: ", req.body);
    console.log("TYPE VIS: ", typeof req.body.visible);
    console.log("BIS", req.file);
    console.log("EXT: ", req.checkFileExtensionValidity);
    console.log("TYPE: ", req.checkFileTypeValidity);
    console.log("SIZE: ", req.checkFileSizeValidity);
    console.log(matchedData(req, { onlyValidData : true }));
}

module.exports = { store }