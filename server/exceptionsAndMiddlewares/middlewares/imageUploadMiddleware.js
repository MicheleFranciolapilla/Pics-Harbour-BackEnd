const multer = require("multer");

const ErrorUnsupportedFile = require("../exceptions/ErrorUnsupportedFile");
const ErrorMulterMiddleware = require("../exceptions/ErrorMulterMiddleware");
const ErrorResourceNotFound = require("../exceptions/ErrorResourceNotFound");

const { imgFileParams, randomFileName, multerFileExtension, multerFileType, fileUploadReport, deleteFileBeforeThrow } = require("../../utilities/fileManagement");

const { formattedOutput } = require("../../utilities/consoleOutput");

const imageUploader = async (req, res, next) =>
{

    // Configurazione dello storage engine:
    const storage = multer.diskStorage(
        {
            destination : (req, file, callBack) => callBack(null, `public/images/${fileParams.folder}`),
            filename    : (req, file, callBack) => callBack(null, randomFileName(dbTable).concat(".", multerFileExtension(file)))
        });

    const fileFilter = (req, file, callBack) =>
    {
        const validExtension = fileParams.validExt.includes(multerFileExtension(file));
        const validType = (multerFileType(file) === "image");
        // Nella request viene creato l'oggeto "fileData", contenente tutti i campi dell'oggetto "file", generato da multer, con l'aggiunta di ulteriori campi...
        // - campo "dbTable", indicante la tabella di riferimento del db, ovvero il campo specifico dell'oggetto "imgFileParams".
        // - campi booleani "validExtension" e "validType" indicanti le specifiche validità del file in upload.
        // L'oggetto "fileData" è necessario poichè, se si facesse solo riferimento all'oggetto "file" creato da multer ci si ritroverebbe senza di esso (e delle informazioni in esso contenute) nel caso di upload non realizzato a seguito di non validità del file in termini di tipo e/o estensione.
        req["fileData"] = {...file};
        req.fileData["dbTable"] = dbTable;
        req.fileData["validExtension"] = validExtension;
        req.fileData["validType"] = validType;
        // Il passaggio del parametro booleano "validExtension && validType" alla call back assicura il caricamento del file solo se di tipo ed estensione validi.
        callBack(null, validExtension && validType);
    }

    // Middleware validatore della dimensione del file caricato
    const imageSizeValidator = (req, res, next) =>
    {
        const { file } = req;
        // Se nella request è presente l'oggetto "file" significa che tipo e dimensione del file sono validi.
        // In questo caso, nell'oggetto "fileData" viene salvato il valore booleano della validazione.
        if (file)
            req.fileData["validSize"] = (file.size <= fileParams.maxSize * 1024 * 1024);
        next();
    }

    // Middleware incaricato di concludere il processo di upload del file.
    const imageUploadProcessTerminator = async (req, res, next) =>
    {
        const { fileData } = req;
        if (!fileData)
        // L'assenza di "fileData" nella request implica che non è stato richiesto l'upload di alcun file.
        {
            // Caso A: (metodo POST) --> la rotta chiamante richiede obbligatoriamente il caricamento di un file immagine (valido). Si termina il processo con errore.
            // Caso B: (metodo POST) --> la rotta chiamante non richiede l'obbligo del file immagine. Si prosegue con il middleware di express-validator.
            // Caso C: (metodo PUT) --> l'update non richiede obbligatoriamente un file, quindi si prosegue con il middleware di express-validator
            if ((routeMethod === "POST") && (fileParams.imgRequired))
            {
                // Caso A
                return next(new ErrorResourceNotFound("Image file", "IMAGE UPLOAD MIDDLEWARE"))
            }
            else
            {
                // Casi B e C
                return next();
            }
        }
        else
        // La presenza di "fileData" implica che è stato richiesto il caricamento di un file
        {
            const uploadReport = fileUploadReport(req);
            formattedOutput("FILE UPLOAD REPORT", uploadReport);
            // Caso A: (tipo valido, estensione valida, dimensione valida) -->
            // il file è valido ed è stato caricato nel server. Si prosegue con express-validator
            // Caso B: (validSize è definita) il che implica che gli attributi "tipo" ed "estensione" sono entrambi true, altrimenti il file non sarebbe stato salvato e non sarebbe mai stato possibile verificarne il size, inoltre questo implica anche che "validSize" è false (altrimenti si ricadrebbe nel caso A). -->
            // il file, in quanto salvato e non valido, deve essere cancellato.
            // Una volta cancellato il file si ripetono i controlli e le azioni già fatte per "fileData" non definito, ovvero:
            // Caso B1: (metodo POST) e rotta chiamante con l'obbligo del file --> si termina il processo con errore.
            // Caso B2: (metodo PUT oppure metodo POST e rotta senza obbligo del file) --> si procede con express-validator
            if (fileData.validType && fileData.validExtension && fileData.validSize)
            {
                // Caso A
                return next();
            }
            if (fileData.validSize !== undefined)
            {
                // Caso B
                const { file } = req;
                await deleteFileBeforeThrow(file, "IMAGE UPLOAD PROCESS TERMINATOR");
            }
            if ((routeMethod === "POST") && (fileParams.imgRequired))
            {
                // Caso B1
                return next(new ErrorUnsupportedFile("Unsupported file: " + JSON.stringify(uploadReport, null, 3), "IMAGE UPLOAD MIDDLEWARE"));
            }
            else
            {
                // Caso B2
                return next();
            }
        }
    }

    // Middleware incaricato di chiamare, asincronicamente, tutti i middlewares intermedi di upload e validazione del file
    const checkHTTPContentType = async (req, res, next) =>
    {
        try
        {
            // Si recupera il "Content-Type" dalla request
            const contentType = req.get("Content-Type");
            if (!contentType)
                // Se il "Content-Type" è assente si conclude con un errore,
                throw new ErrorMulterMiddleware("Missing Content-Type into the request.", 415, "CHECK HTTP CONTENT-TYPE MIDDLEWARE");
            if (!contentType.toLowerCase().startsWith("multipart/form-data"))
                // se invece è presente ma non è di tipo "Multipart/form-data" si bypassano tutti i middlewares di multer e si passa direttamente alla validazione dei dati per mezzo del body parser corretto.
                return next();
                // nel caso in cui, invece, il "Content-Type" è di tipo "Multipart/form-data" si procede con la chiamata ai middlewares multer in sequenza sincronizzata
            await new Promise( (resolve, reject) =>
                {
                    multer({ "storage": storage, "fileFilter": fileFilter }).single(fileParams.fieldName)(req, res, (multerError) =>
                        {
                            if (multerError)
                                reject(new ErrorMulterMiddleware("Multer configuration error. No fields into the request or file field name could be wrong.", 415, "MULTER CONFIGURATION MIDDLEWARE"));
                            else
                                imageSizeValidator(req, res, (sizeValidatorError) =>
                                    {
                                        if (sizeValidatorError)
                                           reject(new ErrorMulterMiddleware("Image file size error.", 415, "IMAGE WEIGHT MIDDLEWARE"));
                                        else 
                                            imageUploadProcessTerminator(req, res, (terminatorError) =>
                                                {
                                                    if (terminatorError)
                                                        reject(new ErrorMulterMiddleware("Multer final process error.", 415, "PROCESS TERMINATOR MIDDLEWARE"));
                                                    else
                                                        resolve();
                                                });
                                    });
                        });
                });
            return next();
        }
        catch(error)
        {
            return next(error);
        }
    }

    // In primo luogo si acquisiscono metodo usato e rotta base, dalla request
    const routeMethod = req.method.toUpperCase();
    const dbTable = (req.baseUrl.toLowerCase() === "/auth") ? "users" : req.baseUrl.substring(1).split("/")[1].toLowerCase();
    const fileParams = imgFileParams[dbTable];

    await checkHTTPContentType(req, res, next);
}

module.exports = { imageUploader };