const { formattedOutput } = require("../../utilities/consoleOutput");

module.exports =    (err, req, res, next) => sendResponse(err, res);
  
  /**
   * Per poter usare la stessa risposta anche nel middleware per le rotte non trovate
   * esporto questa funzione in modo da poterla riutilizzare
   * 
   * @param {*} err 
   * @param {*} res 
   * @returns 
   */

  function sendResponse(err, res) 
  {
    formattedOutput(err.errorBlock ?? "DIRECT ERROR", `*** ${err.status ?? 500}`, `*** ${err.message}`, `*** ${err.constructor.name}`, err.errors ? `*** ${err.errors}` : "");
    return res.status(err.status ?? 500).json(  {
                                                    "message"   :   err.message,
                                                    "error"     :   err.constructor.name,
                                                    "details"   :   err.errors ?? [],
                                                });
  }
  
  module.exports.sendResponse = sendResponse;