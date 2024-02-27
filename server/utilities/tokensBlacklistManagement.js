const jwt = require("jsonwebtoken");
const { noError, createRecord, getUniqueItem } = require("./prismaCalls");

const addTokenToBlacklist = async (tokenData, callerBlock) => 
    await createRecord("tokensblacklist", { "data" : { "token" : tokenData.token, "expAt" : new Date(tokenData.exp * 1000) } }, callerBlock);

const checkIfBlacklisted = async (tokenToCheck, callerBlock) =>
{
    const result = await getUniqueItem("tokensblacklist", { "where" : { "token" : tokenToCheck } }, noError, callerBlock, "");
    return (result !== null);
}

module.exports = { addTokenToBlacklist, checkIfBlacklisted }