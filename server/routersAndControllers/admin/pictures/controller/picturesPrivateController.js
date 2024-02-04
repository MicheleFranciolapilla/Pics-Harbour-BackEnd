const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

async function store(req, res, next)
{
    console.log(req.file);
    console.log(req.fileData);
}

module.exports = { store }