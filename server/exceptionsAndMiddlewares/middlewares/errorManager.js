const { formattedOutput } = require("../../utilities/consoleOutput");

/**
 * Middleware per intercettazione errori. Invoca la funzione "sendResponse" per inviare la response http
 * @function
 * @param {Error} err - Oggetto di classe Error o classe derivata
 * @param {Express.Request} req - Oggetto express request
 * @param {Express.Response} res - Oggetto express response
 * @param {Express.Next} next - Middleware express next
 * @returns {void}
 */
module.exports = (err, req, res, next) => sendResponse(err, res);
  
  /**
   * Funzione incaricata di inviare la response http in conseguenza del lancio di qualsiasi tipo di errore e di generare il corrispondente blocco informativo nella console del server.
   * @function
   * @param {Error} err - Oggetto di classe Error o classe derivata
   * @param {Express.Response} res - Oggetto express response 
   * @returns {Express.Response} - Restituisce la response formattata coerentemente al tipo di eccezione lanciata. La proprietà "validationErrors" fa riferimento ad eventuali errori di validazione settati da express Validator
   */

  function sendResponse(err, res) 
  {
    formattedOutput(err.errorBlock ?? "DIRECT ERROR", `*** ${err.status ?? 500}`, `*** ${err.message}`, `*** ${err.constructor.name}`, err.validationErrors ? `*** ${JSON.stringify(err.validationErrors, null, 3)}` : "");
    return res.status(err.status ?? 500).json(  {
                                                    "message"           :   err.message,
                                                    "error"             :   err.constructor.name,
                                                    "validationErrors"  :   err.validationErrors ?? [],
                                                });
  }
  
  module.exports.sendResponse = sendResponse;