const ErrorResourceNotFound = require("../exceptions/ErrorResourceNotFound");
const { sendResponse } = require("./errorManager");

/**
 * Middleware invocato quando la rotta richiesta non rientra tra le rotte registrate in server.js
 * @function
 * @param {Object} req - Oggetto "express request" 
 * @param {Object} res - Oggetto "express response" 
 * @param {Function} next - Middleware "express next"
 * @throws {ErrorResourceNotFound} - Lancia un'eccezione del tipo "risorsa (rotta) non trovata"
 */
module.exports =    function(req, res, next)
                    {
                        sendResponse(new ErrorResourceNotFound("Route", "ROUTE - MIDDLEWARE404"), res);
                    }