const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { matchedData } = require("express-validator");

const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");
const ErrorUserNotAllowed = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorUserNotAllowed");
const ErrorResourceNotFound = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorResourceNotFound");
const ErrorOperationRefused = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorOperationRefused");

async function destroy(req, res, next)
{
    const { id } = matchedData(req, { onlyValidData : true });
    // Dopo aver recuperato l'id (validato) dell'utente che si desidera cancellare, per prima cosa si procede verificando che l'id del richiedente coincida, poichè la cancellazione di un utente è permessa solo all'utente interessato, neanche il Super Admin può cancellare alcun utente diverso da sè stesso
    if (id != req.tokenOwner.id)
        return next(new ErrorUserNotAllowed("User not allowed to delete another user.", "USERS (PRIVATE) - DESTROY"));
    // Una volta accertato che l'utente intende cancellare sè stesso dal database, si procede con l'operazione
    // Bisognerà avere le seguenti accortezze:
    // -A- Se ad essere cancellato è un Super Admin, bisognerà autorizzare l'operazione solo se egli non è l'unico Super Admin presente
    // -B- Se ad essere cancellato è un Super Admin, le categories da lui create verranno associate ad un altro Super Admin
    // -C- Contestualmente alla cancellazione dello user bisognerà cancellare anche tutte le sue pictures (annullando il collegamento delle categories correlate ad esse)
    // In linea teorica non ci sarebbe bisogno di verificare la presenza dello user da cancellare all'interno del db, in virtù del fatto che la richiesta è stata formulata dallo stesso che risulta ancora loggato ma si procede, comunque ad effettuare questo controllo di sicurezza.
    try
    {
        const userToDelete = await prisma.user.findUnique(
            {   
                "where"     : 
                                { 
                                    "id"            :   id 
                                },
                "include"   :   {
                                    "pictures"      :   true,
                                    "categories"    :   true
                                }  
            });
        console.log("TO DELETE: ",userToDelete);
        if (!userToDelete)
            return next(new ErrorResourceNotFound("User", "USERS (PRIVATE) - DESTROY - TRY"));
        // -A-
        if (req.tokenOwner.role == "Super Admin")
        {
            // Si procede con il recupero dei dati (con relazioni) di un altro Super Admin (se esistente), diverso da quello che si intende cancellare
            try
            {
                const otherSuperAdmin = await prisma.user.findFirst(
                    {
                        "where"     :   {
                                            "NOT"           :   {
                                                                    "id"    :   id
                                                                },
                                            "role"          :   "Super Admin"
                                        },
                        "include"   :   {
                                            "pictures"      :   true,
                                            "categories"    :   true
                                        }   
                    });
                console.log("OTHER: ", otherSuperAdmin);
                if (!otherSuperAdmin)
                    return next(new ErrorOperationRefused("The operation cannot be performed. Cannot delete the unique Super Admin", "USERS (PRIVATE) - DESTROY - TRY (otherSuperAdmin)"));
                // -B-
                // await prisma.user.update(
                //     {
                //         "where":{"id":id},
                //         "data":{pictures:{"delete":true}}
                //     });
            }
            catch(errorOnOtherSuperAdminQuery)
            {
                return next(new ErrorFromDB("Service temporarily unavailable", 503, "USERS (PRIVATE) - DESTROY - CATCH (otherSuperAdmin)"));
            }
        }
        else
        {

        }
    }
    catch(error)
    {
        return next(new ErrorFromDB("Service temporarily unavailable", 503, "USERS (PRIVATE) - DESTROY - CATCH (userToDelete)"));
    }
}

module.exports = { destroy };