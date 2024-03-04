const jwt = require("jsonwebtoken");

const { tokenLifeTime } = require("./variables");
const { removeProperties } = require("./general");
const { formattedOutput } = require("./consoleOutput");
const { noError, createRecord, getUniqueItem } = require("./prismaCalls");

const tokenExpAt = (token) => new Date(jwt.decode(token).exp * 1000);

const createNewToken = (user) =>
{
    let userData = { ...user };
    removeProperties([userData], "password", "thumb", "website", "createdAt", "updatedAt");
    const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn : tokenLifeTime });
    return token;
}

const checkIfAlreadyLogged = (tokenExpDateTime) =>
{
    let logged = false;
    let expiresIn = null;
    if (tokenExpDateTime)
    {
        const tokenMSecs = new Date(tokenExpDateTime).getTime();
        const now = Date.now();
        if (tokenMSecs > now)
        {
            logged = true;
            expiresIn = {};
            let gap = Math.ceil((tokenMSecs - now) / 1000);
            expiresIn["h"] = Math.floor(gap / 3600);
            gap = gap % 3600;
            expiresIn["m"] = Math.floor(gap / 60);
            expiresIn["s"] = gap % 60;
            if (expiresIn.h == 0)
                delete expiresIn.h;
            if (!expiresIn.h && (expiresIn.m == 0))
                delete expiresIn.m;
        }
    }
    return { logged, expiresIn };
}

const addTokenToBlacklist = async (token, callerBlock) => 
{
    let success = true;
    const expAt = tokenExpAt(token);
    try
    {
        await createRecord("tokensblacklist", { "data" : { "token" : token, "tokenExpAt" : expAt } }, "");
    }
    catch(error)
    {
        success = false;
    }
    formattedOutput(`TOKEN BLACKLISTING BY ${callerBlock}`, "***** Token:", token, "***** Token expire time:", expAt, success ? "Token successfully blacklisted" : "Token not blacklisted, <<< UPDATE BLACK LIST MANUALLY >>>");
}

const checkIfBlacklisted = async (tokenToCheck, callerBlock) =>
{
    const result = await getUniqueItem("tokensblacklist", { "where" : { "token" : tokenToCheck } }, noError, callerBlock, "");
    return (result !== null);
}

module.exports = { tokenExpAt, createNewToken, checkIfAlreadyLogged, addTokenToBlacklist, checkIfBlacklisted }