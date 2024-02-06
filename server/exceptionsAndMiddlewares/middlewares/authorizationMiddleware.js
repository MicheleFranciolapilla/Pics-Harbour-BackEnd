const jwt = require("jsonwebtoken");

const { formattedOutput } = require("../../utilities/consoleOutput");
const { normalizeSpaces, upperStartingChar } = require("../../utilities/general");
const { returnRoleData } = require("../../utilities/roleManagement");

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
function tokenVerifier(req, res, next)
{
    const bearerToken = req.headers.authorization;
    if (!bearerToken || !bearerToken.startsWith("Bearer "))
        return next(new ErrorUserNotAllowed("User not allowed to perform the requested operation.", "AUTHORIZATION MIDDLEWARE - TOKEN VERIFIER"));
    const token = bearerToken.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (error, payload) =>
        {
            if (error)
            {
                const exceptionStr = (error.message === "jwt expired") ? "expired" : "wrong";
                return next(new ErrorUserNotAllowed(`User not allowed to perform the requested operation - token is ${exceptionStr}`, "AUTHORIZATION MIDDLEWARE - TOKEN VERIFIER"));
            }
            else
            {
                req["tokenOwner"] =
                {
                    "id"    :   parseInt(payload.id),
                    "role"  :   upperStartingChar(normalizeSpaces(payload.role.trim()), true)
                };
                return next();
            }
        });
}

/**
 * Middleware per la verifica del ruolo dell'utente.
 * Verifica che l'utente richiedente abbia un "rango" almeno uguale a quello richiesto per l'accesso all'operazione, nel qual caso consente la prosecuzione; 
 * in caso contrario lancia un errore specifico.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns {void}
 */
function roleVerifier(req, res, next)
{
    const { role } = req.tokenOwner;
    const { roleToAllow } = req;
    if (returnRoleData(role).rank >= returnRoleData(roleToAllow).rank)
    {
        formattedOutput("AUTHORIZATION MIDDLEWARE - USER ALLOWED TO PROCEED", `***** User Id: ${req.tokenOwner.id}`, `***** User Role: ${role}`);
        return next();
    }
    else
        return next(new ErrorUserNotAllowed(`User not allowed to perform the requested operation - access reserved to role [${roleToAllow}]`, "AUTHORIZATION MIDDLEWARE - ROLE VERIFIER"));
}

/**
 * Middleware di autorizzazione.
 * Combina i middlewares tokenVerifier e roleVerifier per garantire che l'utente abbia le autorizzazioni necessarie.
 * Accetta un parametro extra, "roleToAllow", che rappresenta il ruolo minimo richiesto per l'accesso alla route.
 * Aggiunge anche l'informazione "roleToAllow" all'oggetto req per uso successivo, se necessario.
 * @param {string} roleToAllow - Ruolo minimo richiesto per l'accesso alla rotta
 * @returns {Function} - Middleware anonimo con chiamata ai due middlewares tokenVerifier e roleVerifier
 */
// N.B. La funzione anonima (middleware) restituito in prima battuta da authorizationMiddleware rappresenta quello riportato in coda al middleware in server.js
module.exports =    (roleToAllow) => (req, res, next) => 
                                        {
                                            req["roleToAllow"] = upperStartingChar(normalizeSpaces(roleToAllow.trim()), true);
                                            tokenVerifier(req, res, (error) => (error ? next(error) : roleVerifier(req, res, next)));
                                        };