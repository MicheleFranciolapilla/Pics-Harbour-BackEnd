const multer = require("multer");

const ErrorUnsupportedFile = require("../exceptions/ErrorUnsupportedFile");

const { routesImagesParams, randomFileName, multerFileExtension, multerFileType, fileUploadReport, deleteFileBeforeThrow } = require("../../utilities/fileManagement");

const { formattedOutput } = require("../../utilities/consoleOutput");

/**
* Arrow function (middleware) incaricata di validare la dimensione del file eventualmente caricato
* @param {Express.Request} req - Request di express
* @param {Express.Response} res - Response di express
* @param {Express.next} next - funzione next di express
*/
const imageWeightCheck = (req, res, next) =>
{
    // Si recupera il campo "file" dalla request
    const { file } = req;
    // Se il campo file (oggetto) esiste significa che il file è stato salvato, quindi è possibile leggerne la dimensione e validarla, altrimenti si passa direttamente allo step successivo
    if (file)
        // Si crea un campo specifico nella request in cui si salva il valore booleano della validazione della dimensione del file
        req["checkFileSizeValidity"] = (file.size <= (routesImagesParams[req.fileData.routeLabel]["maxSize"] * 1024 * 1024));
    next();
}

/**
* Arrow function (middleware) incaricata di terminare il processo di upload del file.
* La funzione recupera un oggetto riassuntivo dell'esito dell'upload e, nel caso di invalidità del file, laddove ancora presente nel server, si occupa di eliminarlo.
* In base ad un parametro booleano presente nella request, laddove l'upload non abbia avuto esito favorevole, termina il processo con un errore o lascia proseguire
* @param {Express.Request} req - Request di express
* @param {Express.Response} res - Response di express
* @param {Express.next} next - funzione next di express 
*/
const fileUploadProcessTerminator = async (req, res, next) =>
{
    // Si recupera il report relativo allo stato di upload del file
    const uploadReport = fileUploadReport(req);
    formattedOutput("FILE UPLOAD REPORT", uploadReport);
    // Se lo stato dell'upload è true significa che il file è valido e si passa dunque al middleware seguente (di validazione dei dati)
    if (uploadReport.File_uploaded)
        return next();
    // Se invece lo stato dell'upload è false significa che il file non è valido e dunque non deve persistere nel server.
    // Uno stato false può significare che il file non è mai stato salvato, se la non validità è relativa al tipo o all'estensione oppure
    // può significare che il file è valido da un punto di vista del tipo e dell'estensione (ed è dunque stato salvato nel server) ma che non lo è per la dimensione
    else
    {
        // Per capire in quale dei due casi sopra descritti ci si trova, si valutano gli esiti di validazione di estensione e tipo
        // Se entrambi gli esiti sono true significa che il file è stato salvato e che dunque, risultando complessivamente non valido (per la dimensione, evidentemente), deve essere cancellato.
        if (uploadReport.File_Type.Is_valid_file_type && uploadReport.File_extension.Is_valid_file_ext)
        {
            const { file } = req;
            await deleteFileBeforeThrow(file, "UPLOAD PROCESS TERMINATOR");
        }
        // Una volta certi dell'avvenuta cancellazione del file non valido, si valuta se terminare il processo con un errore (caso in cui l'upload del file è propedeutico a qualunque altra operazione conseguente - fattispecie "pictures" e "categories", oppure la sua non validità e quindi la sua assenza, non preclude alla prosecuzione del processo - fattispecie "users")
        if (req.fileData.throwIfInvalid === false)
            return next();
        else
            return next(new ErrorUnsupportedFile("File non valido: " + JSON.stringify(uploadReport, null, 3), "IMAGE UPLOAD MIDDLEWARE"))
    }
}

/**
 * Arrow function che configura il middleware di multer utilizzato in fase di upload di immagini
 * @param {string} routeLabel - Label indicante la rotta in cui si sta invocando il middleware.
 * @param {boolean} throwIfInvalid - Booleano che stabilisce se si deve terminare con un errore in caso di invalidità del file
 * @returns {Function} - Array con tre middlewares: quello di configurazione di multer, un secondo middleware di validazione della dimensione del file caricato ed il middleware di conclusione del processo di upload.
 */
const imageUploader = (routeLabel, throwIfInvalid = true) =>
{
    const paramsObj = routesImagesParams[routeLabel];
    // Configurazione dello storage engine:
    /**
    * Configurazione specifica di nome e destinazione dei file caricati nel server 
    * @type {object}
    */
    const storage = multer.diskStorage(
        {
            /**
            * Specifica la cartella di destinazione dei file in upload.
            * @param {Express.Request} req - Request di express.
            * @param {Express.Multer.File} file - File caricato.
            * @param {Function} cb - CallBack function eseguita a fine operazione.
            */
            destination :   (req, file, cb) => cb(null, `public/images/${paramsObj.folder}`),
            /**
            * Specifica il nome del file in upload.
            * @param {Express.Request} req - Request di express.
            * @param {Express.Multer.File} file - File caricato.
            * @param {Function} cb - CallBack function eseguita a fine operazione.
            */
            filename    :   (req, file, cb) => cb(null, randomFileName(routeLabel).concat(".", multerFileExtension(file)))
        });

    /**
    * Funzione incaricata di gestire la validazione del file, quanto a: estensione e tipo di file.
    * @param {Express.Request} req - Request di express.
    * @param {Express.Multer.File} file - File caricato.
    * @param {Function} cb - CallBack function eseguita a fine operazione.
    */
    const fileFilter = (req, file, cb) =>
    {
        const checkFileExtension = paramsObj.validExt.includes(multerFileExtension(file));
        const checkFileType = multerFileType(file) === "image";
        // Vengono creati due campi specifici in req per indicare se e quali criteri di validità non sono garantiti dal file in upload.
        // Viene creato anche un terzo campo (in req), chiamato "fileData" riportante le informazioni base relative al file in upload.
        // Il campo fileData è necessario poichè, se si facesse solo riferimento al campo "file" creato da multer ci si ritroverebbe senza di esso (e delle informazioni in esso contenute) nel caso di upload non realizzato a seguito di non validità del file in termini di tipo e/o estensione.
        // In req.fileData vengono creati ulteriori due campi:
        // "routeLabel" contenente il dato relativo alla rotta chiamante.
        // "throwIfInvalid", valore booleano che consente, in caso di file non accettato poichè invalido, di chiudere il processo invocando l'errore "ErrorUnsupportedFile" (fattispecie delle rotte quali "pictures" e "categories", per le quali la validità del file è elemento essenziale per la validazione dei dati) oppure di proseguire con la validazione dei dati, consentendo all'utente il caricamento del file in un secondo momento (rotta "users")
        req["checkFileExtensionValidity"] = checkFileExtension;
        req["checkFileTypeValidity"] = checkFileType;
        req["fileData"] = {...file};
        req.fileData["routeLabel"] = routeLabel;
        req.fileData["throwIfInvalid"] = throwIfInvalid;
        // Si invoca la call back function passando il valore booleano relativo alla validità in toto dei due criteri analizzati.
        // Nel caso true il file viene salvato, nel caso false viene rigettato
        // La validazione della dimensione del file deve essere eseguita in un middleware successivo (imageWeightCheck) poichè in questa fase, in cui il file non è stato ancora salvato su disco, le informazioni relative alla sua dimensione non sono ancora disponibili
        cb(null, checkFileExtension && checkFileType);
    }

    let middlewaresToReturn = [ multer({ "storage" : storage, "fileFilter" : fileFilter }).single(paramsObj.fieldName), imageWeightCheck, fileUploadProcessTerminator ];
    return middlewaresToReturn;
}

module.exports = { imageUploader };