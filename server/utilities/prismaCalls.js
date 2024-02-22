/**
 * Funzione delegata ad eseguire operazioni su database.
 * Questa funzione è stata pensata principalmente per alleggerire il codice dai tanti blocchi try/catch
 * @function
 * @async
 * @param {Object} prismaInstance - Istanza Prisma Client
 * @param {String} model - Nome del modello Prisma su cui operare
 * @param {String} operator - Nome del metodo Prisma da utilizzare (esempio: findUnique, findFirst, findMany, ...)
 * @param {Object} query - Query da passare al metodo Prisma per interrogare il database
 * @returns {Promise<{ outcome: string, data: any }>} - Promise che si risolve con un oggetto le cui proprietà riportano l'esito (outcome) ed il risultato (data = dati ricevuti o errore generato)
 */
async function prismaOperator(prismaInstance, model, operator, query)
{
    try
    {
        const result = await prismaInstance[model][operator](query);
        return { "success" : true, "data" : result };
    }
    catch(error)
    {
        return { "success" : false, "data" : error };
    }
}

module.exports = { prismaOperator }