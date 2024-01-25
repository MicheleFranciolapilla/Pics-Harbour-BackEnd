const errorRoute404 = require("../exceptions/ErrorResourceNotFound");
const { sendResponse } = require("./errorManager");

module.exports =    function(req, res, next)
                    {
                        sendResponse(new errorRoute404("Route", "ROUTE - MIDDLEWARE404"), res);
                    }