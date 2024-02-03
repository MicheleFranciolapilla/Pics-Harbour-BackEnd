const multer = require("multer");

const { routesImagesParams, randomFileName, multerFileExtension, multerFileType, returnRouteLabel } = require("../../utilities/fileManagement");

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
        req["checkFileSizeValidity"] = (file.size <= (routesImagesParams[returnRouteLabel(file)]["maxSize"] * 1024 * 1024));
    next();
}

/**
 * Arrow function che configura il middleware di multer utilizzato in fase di upload di immagini
 * @param {string} routeLabel - Label indicante la rotta in cui si sta invocando il middleware.
 * @returns {Function} - Array con due middlewares: quello di configurazione di multer ed un secondo middleware di validazione della dimensione del file caricato.
 */
const imageUploader = (routeLabel) =>
{
    // Configurazione dello storage engine:
    const paramsObj = routesImagesParams[routeLabel];
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
   * Funzione incaricata di gestire la validazione del file, quanto a: estensione, tipo di file e dimensione.
   * @param {Express.Request} req - Request di express.
   * @param {Express.Multer.File} file - File caricato.
   * @param {Function} cb - CallBack function eseguita a fine operazione.
   */
    const fileFilter = (req, file, cb) =>
    {
        const checkFileExtension = paramsObj.validExt.includes(multerFileExtension(file));
        const checkFileType = multerFileType(file) === "image";
        // Vengono creati due campi specifici in req per indicare se e quali criteri di validità non sono garantiti dal file in upload
        req["checkFileExtensionValidity"] = checkFileExtension;
        req["checkFileTypeValidity"] = checkFileType;
        // Si invoca la call back function passando il valore booleano relativo alla validità in toto dei due criteri analizzati.
        // Nel caso true il file viene salvato, nel caso false viene rigettato
        // La validazione della dimensione del file deve essere eseguita in un middleware successivo (imageWeightCheck) poichè in questa fase, in cui il file non è stato ancora salvato su disco, le informazioni relative alla sua dimensione non sono ancora disponibili
        cb(null, checkFileExtension && checkFileType);
    }

    return [ multer({ "storage" : storage, "fileFilter" : fileFilter }).single(paramsObj.fieldName), imageWeightCheck ];
}

module.exports = { imageUploader };