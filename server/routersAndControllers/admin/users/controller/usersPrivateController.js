const ErrorOperationRefused = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorOperationRefused");
const ErrorFromDB = require("../../../../exceptionsAndMiddlewares/exceptions/ErrorFromDB");

const { prisma, prismaCall } = require("../../../../utilities/prismaCalls");
const { removeProperties } = require("../../../../utilities/general");
const { deleteFileBeforeThrow, buildFileObject } = require("../../../../utilities/fileManagement");
const { formattedOutput } = require("../../../../utilities/consoleOutput");
const { addTokenToBlacklist } = require("../../../../utilities/tokenManagement");

async function update(req, res, next)
{

}

async function destroy(req, res, next)
{
    // Regole generali:
    // - Nel database deve sempre esistere almeno uno user con ruolo "Super Admin", quindi un "Super Admin" può cancellarsi solo se non è l'unico
    // - Essendo le "categories" associate al "Super Admin", all'atto della cancellazione dello stesso, le sue "categories" passano ad un altro pari ruolo 
    const { tokenOwner } = req;
    let prismaQuery = { "where" : { "NOT" : { "id" : tokenOwner.id }, "role" : "Super Admin" } };
    let prismaTransaction = null;
    let alternativeSA = null;
    try
    {
        if (tokenOwner.role === "Super Admin")
        // Se lo user che intende cancellarsi è un "Super Admin" se ne ricerca un altro nel db; se non c'è si abbandona con errore specifico
        {
            alternativeSA = await prismaCall("user", "findFirst", prismaQuery, "USERS (PRIVATE) - DESTROY");
            if (!alternativeSA)
                throw new ErrorOperationRefused("The 'unique' Super Admin cannot be deleted", "USERS (PRIVATE) - DESTROY");
            removeProperties([alternativeSA], "password");
        }
        // Si unifica il codice per "Admin" e "Super Admin" facendo ricorso alla "transaction" di Prisma.
        // La "transaction" consente di effettuare più operazioni sul database salvando i risultati solo se tutte vanno a buon fine.
        // Nel caso in cui NON tutte le operazioni della "transaction" vanno a buon fine, viene effettuato un "rollback" per quelle già eseguite con successo.
        await prisma.$transaction( async (instance) =>
            {
                // Nel caso specifico, la "transaction" ha particolare senso nel caso del "Super Admin", poichè esegue le seguenti due operazioni:
                // - riassegnazione delle categories al nuovo Super Admin
                // - cancellazione dello user Super Admin
                let updatedCategories = null;
                if (tokenOwner.role === "Super Admin")
                {
                    // Operazione per il solo caso "Super Admin"
                    updatedCategories = await instance.category.updateMany({ "where" : { "userId" : tokenOwner.id }, "data" : { "userId" : alternativeSA.id } });
                    formattedOutput(
                        "USERS (PRIVATE) - DESTROY / TRANSACTION: UPDATE CATEGORIES (TENTATIVE)",
                        `***** Numbers of categories updated: ${updatedCategories.count}`,
                        `***** From user Id ${tokenOwner.id} (not yet deleted)`,
                        `***** To user Id ${alternativeSA.id}`);
                }
                // Operazione unificata
                let deletedUser = await instance.user.delete({ "where" : { "id" : tokenOwner.id } , "include" : { "pictures" : { "select" : { "image" : true } } } });
                removeProperties([deletedUser], "password");
                formattedOutput("USERS (private) - DESTROY - SUCCESS", "***** Status: 200", "***** Deleted User: ", deletedUser);
                prismaTransaction = { updatedCategories, deletedUser };
            });
        // Si cancellano dal server il file immagine dello user (se presente)...
        if (prismaTransaction.deletedUser.thumb)
            await deleteFileBeforeThrow(buildFileObject(prismaTransaction.deletedUser.thumb), "USERS (PRIVATE) - DESTROY");
        // ... e tutti i files immagine delle pictures associate allo user (codice unificato ma effettivamente eseguito solo per gli Admin)
        for (let index = 0; index < prismaTransaction.deletedUser.pictures.length; index++)
            deleteFileBeforeThrow(buildFileObject(prismaTransaction.deletedUser.pictures[index].image), "USERS (PRIVATE) - DESTROY");
        // Si aggiunge il token alla black list in modo da evitare conflitti in caso di riutilizzo, anche se con user cancellato
        await addTokenToBlacklist(tokenOwner.token, "USERS (PRIVATE) - DESTROY");
        return res.json({ "user" : {...prismaTransaction.deletedUser} });
    }
    catch(error)
    {
        if ((error instanceof ErrorFromDB) || (error instanceof ErrorOperationRefused))
            return next(error);
        else
            return next(new ErrorFromDB(`Service temporarily unavailable: ${error.message}`, 503, "USERS (PRIVATE) - DESTROY / TRANSACTION"))
    }
}

module.exports = { update, destroy };