module.exports =    function (err, req, res, next) 
                    {
                        console.log("Error Manager...");
                        sendResponse(err, res);
                    };
  
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
    console.log("Method sendResponse invoked...");
    return res.status(err.status ?? 500).json(  {
                                                    "message"   :   err.message,
                                                    "error"     :   err.constructor.name,
                                                    "details"   :   err.errors ?? [],
                                                });
  }
  
  module.exports.sendResponse = sendResponse;