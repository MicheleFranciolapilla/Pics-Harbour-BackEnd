const multer = require("multer");

const ErrorUnsupportedFile = require("../exceptions/ErrorUnsupportedFile");

const { routesImagesParams, randomFileName, multerFileExtension, multerFileType } = require("../../utilities/fileManagement");

/**
 * Arrow function che configura il middleware di multer utilizzato in fase di upload di immagini
 * @param {string} routeLabel - Label indicante la rotta in cui si sta invocando il middleware.
 * @returns {Function} - Multer middleware
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
        ((paramsObj.validExt.includes(multerFileExtension(file))) && (multerFileType(file) === "image"))
        ? cb(null, true) 
        : cb(new ErrorUnsupportedFile(`The file must be a '${paramsObj.validExt.join("/")}' image.`, "IMAGE UPLOAD MIDDLEWARE"));
    return multer(
        {
            "storage"       :   storage,
            "fileFilter"    :   fileFilter
        }).single(paramsObj.fieldName);
}

module.exports = { imageUploader };