const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");
const fs = require("fs");

async function store(req, res, next)
{
    console.log(req.file);
    const data = matchedData(req, {onlyValidData:true});
    console.log(data);
    console.log(typeof data.categories[1]);
    console.log(__dirname);
    res.json({});
}

module.exports = { store }