const jwt = require("jsonwebtoken");

const { formattedOutput } = require("../../utilities/consoleOutput");
const { rolesAccessibilityValue, checkRoleAccessibility } = require("../../utilities/roleManagement");
const { checkIfBlacklisted } = require("../../utilities/tokensBlacklistManagement");

const ErrorUserNotAllowed = require("../exceptions/ErrorUserNotAllowed");

/**
 * Middleware per la verifica del token ed il conseguente salvataggio dei dati, in caso di verifica favorevole
 * Verifica la presenza del token nello header "Authorization", ne verifica la validità 
 * ed eventualmente salva tutte le informazioni utili nel campo "tokenOwner" della request
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns {void}
 */
async function tokenVerifier(req, res, next)
{
    const bearerToken = req.headers.authorization;
    if (!bearerToken || !bearerToken.startsWith("Bearer "))
        return next(new ErrorUserNotAllowed("User not allowed to perform the requested operation.", "AUTHORIZATION MIDDLEWARE - TOKEN VERIFIER"));
    const token = bearerToken.split(" ")[1];
    try
    {
        const isBlacklisted = await checkIfBlacklisted(token, "AUTHORIZATION MIDDLEWARE - TOKEN VERIFIER");
        if (isBlacklisted)
            throw new ErrorUserNotAllowed("User not allowed to perform the requested operation.", "AUTHORIZATION MIDDLEWARE - TOKEN VERIFIER");
    }
    catch(error)
    {
        return next(error);
    }
    jwt.verify(token, process.env.JWT_SECRET, (error, payload) =>
        {
            if (error)
            {
                const exceptionStr = (error.message === "jwt expired") ? "expired" : "wrong";
                return next(new ErrorUserNotAllowed(`User not allowed to perform the requested operation - token is ${exceptionStr}`, "AUTHORIZATION MIDDLEWARE - TOKEN VERIFIER"));
            }
            else
            {
                // Solo per le rotte che prevedono l'utilizzo dei dati del token, gli stessi vengono salvati in request.tokenOwner
                req["tokenOwner"] =
                {
                    "id"    :   parseInt(payload.id),
                    "role"  :   payload.role,
                    ...(req.rolesAccessibility.token && { "token" : token, "exp" : payload.exp })
                };
                console.log("OWNER: ", req.tokenOwner);
                return next();
            }
        });
}

/**
 * Middleware per la verifica del ruolo dell'utente.
 * Verifica che l'utente abbia i diritti per accedere alla rotta richiesta; in caso negativo lancia un errore specifico 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns {void}
 */
const roleVerifier = (req, res, next) =>
{
    if (checkRoleAccessibility(req.tokenOwner.role, req))
    {
        formattedOutput("AUTHORIZATION MIDDLEWARE - USER ALLOWED TO PROCEED", `***** User Id: ${req.tokenOwner.id}`, `***** User Role: ${req.tokenOwner.role}`);
        return next();
    }
    else
        return next(new ErrorUserNotAllowed(`User not allowed to perform the requested operation`, "AUTHORIZATION MIDDLEWARE - ROLE VERIFIER"));
}

/**
 * Middleware di autorizzazione.
 * Combina i middlewares tokenVerifier e roleVerifier per garantire che l'utente abbia le autorizzazioni necessarie.
 * Propedeuticamente, il middleware salva nella request l'oggetto "rolesAccessibility" contenente i dati relativi all'accessibilità alla rotta corrente
 * @param {...string} rolesToAllow - Ruoli autorizzati ad accedere alla rotta richiesta
 * @param {boolean} saveToken - Booleano che comunica al "tokenVerifier" se salvare nella request.tokenOwner anche il token ed il campo "exp"
 * @returns {Function} - Middleware anonimo con chiamata ai due middlewares tokenVerifier e roleVerifier
 */
// N.B. La funzione anonima (middleware) restituito in prima battuta da authorizationMiddleware rappresenta quello riportato in coda al middleware in server.js
module.exports =    (saveToken, ...rolesToAllow) => (req, res, next) => 
                                        {
                                            req["rolesAccessibility"] = 
                                            {
                                                "roles" : rolesToAllow,
                                                "value" : rolesAccessibilityValue(...rolesToAllow),
                                                "token" : saveToken
                                            }
                                            console.log(req["rolesAccessibility"])
                                            tokenVerifier(req, res, (error) => (error ? next(error) : roleVerifier(req, res, next)));
                                        };