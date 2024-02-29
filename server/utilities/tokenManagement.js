const jwt = require("jsonwebtoken");

const { tokenLifeTime } = require("./variables");
const { removeProperties } = require("./general");
const { noError, createRecord, getUniqueItem } = require("./prismaCalls");

const tokenExpAt = (token) => new Date(jwt.decode(token).exp * 1000);

const createNewToken = (user) =>
{
    let userData = { ...user };
    removeProperties([userData], "password", "thumb", "website", "createdAt", "updatedAt");
    const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
    return token;
}

const addTokenToBlacklist = async (token, callerBlock) => 
    await createRecord("tokensblacklist", { "data" : { "token" : token, "expAt" : tokenExpAt(token) } }, callerBlock);

const checkIfBlacklisted = async (tokenToCheck, callerBlock) =>
{
    const result = await getUniqueItem("tokensblacklist", { "where" : { "token" : tokenToCheck } }, noError, callerBlock, "");
    return (result !== null);
}

module.exports = { tokenExpAt, createNewToken, addTokenToBlacklist, checkIfBlacklisted }