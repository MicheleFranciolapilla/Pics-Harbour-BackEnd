const jwt = require("jsonwebtoken");

const { formattedOutput } = require("../../utilities/consoleOutput");

const ErrorUserNotAllowed = require("../exceptions/ErrorUserNotAllowed");

module.exports =    (req, res, next) =>
                    {
                        const bearerToken = req.headers.authorization;
                        if (!bearerToken || !bearerToken.startsWith("Bearer ")) 
                            return next(new ErrorUserNotAllowed("User not allowed to perform the requested operation.", "AUTHORIZATION MIDDLEWARE"));
                        const token = bearerToken.split(" ")[1];
                        try
                        {
                            const payLoad = jwt.verify(token, process.env.JWT_SECRET);
                            req["tokenOwner"] = { 
                                                    id      :   parseInt(payLoad.id),
                                                    role    :   payLoad.role
                                                };
                            formattedOutput("AUTHORIZATION MIDDLEWARE - USER ALLOWED TO PROCEED", `***** User Id: ${payLoad.id}`, `***** User Role: ${payLoad.role}`);
                            return next();
                        }
                        catch(error)
                        {
                            const exceptionStr = (error.message == "jwt expired") ? "expired" : "wrong";
                            return next(new ErrorUserNotAllowed(`User not allowed to perform the requested operation - token is ${exceptionStr}`, "AUTHORIZATION MIDDLEWARE"));
                        }
                    }
