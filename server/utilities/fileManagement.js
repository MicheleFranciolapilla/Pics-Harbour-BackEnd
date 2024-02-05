const fileSystem = require("fs");
const path = require("path");

const { formattedOutput } = require("./consoleOutput");

/**
* Oggetto contenente i parametri utilizzati dal multer middleware, a seconda della rotta in uso.
* @typedef {Object} RoutesImagesParams
* @property {string} folder - Cartella di salvataggio dei files.
* @property {string[]} validExt - Array contenente le estensioni ammesse.
* @property {number} maxSize - Dimensioni massime ammesse per i files.
*/
const routesImagesParams =  {
                                "users"         :   {
                                                        "folder"    :   "users",
                                                        "validExt"  :   ['jpg', 'jpeg', 'png'],
                                                        "maxSize"   :   0.5,
                                                        "fieldName" :   "thumb"
                                                    },   
                                "categories"    :   {
                                                        "folder"    :   "categories",
                                                        "validExt"  :   ['jpg', 'jpeg'],
                                                        "maxSize"   :   0.1,
                                                        "fieldName" :   "thumb"
                                                    },
                                "pictures"      :   {
                                                        "folder"    :   "pictures",
                                                        "validExt"  :   ['jpg', 'jpeg', 'png', 'webp'],
                                                        "maxSize"   :   5,
                                                        "fieldName" :   "image"
                                                    }
                            };

/**
 * Funzione che genera un nome file randomico ed univoco (per i file immagine)
 * @function
 * @param {string} routeLabel - Label indicante la rotta in cui si sta invocando il middleware che gestisce l'upload delle immagini (con multer)
 * @returns {string} - Nome del file generato, nel seguente formato: XnnnnnnnnnnnnnRRR.ext, dove:
 * X è un carattere uppercase, iniziale della rotta chiamante: U (users), C (categories), P (pictures)
 * nnnnnnnnnnnnn sono le cifre dei millisecondi trascorsi, al momento della creazione del nome, dal 01/01/1970 - h: 00,00,00 (Date.now())
 * RRR sono tre caratteri lowercase generati randomicamente
 */
function randomFileName(routeLabel)
{
    const finalChars = Array.from({ length : 3 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97));
    return routeLabel[0].toUpperCase().concat(Date.now(), finalChars.join(""));
}

/**
 * Restituisce l'estensione del file caricato da multer
 * @param {Object} file - Oggetto express.request.file
 * @returns {string} - Estensione in lowercase
 */
const multerFileExtension = (file) => file.originalname.split(".").pop().toLowerCase();

/**
 * Resituisce il tipo di file caricato da multer, estrapolandolo dal mimetype
 * @param {Object} file - Oggetto express.request.file 
 * @returns {string} - Tipo del file (image o altro)
 */
const multerFileType = (file) => file.mimetype.split("/")[0].toLowerCase();

/**
 * Restituisce la stringa identificativa della rotta che ha prodotto l'upload del file
 * @function
 * @param {Object} file - Oggetto express.request.file
 * @returns {string} - Label identificativa della cartella in cui il file è stato salvato, ovvero della rotta che ha prodotto l'upload
 */
function returnRouteLabel(file)
{
    const destArray = file.destination.split("/");
    return destArray[destArray.length - 1];
}

/**
 * Arrow function asincrona utilizzata per cancellare un file precedentemente caricato da multer e riportare l'esito dell'operazione nella server console.
 * @function
 * @async
 * @param {Object} file - Oggetto express.request.file
 * @param {string} caller - Stringa identificativa del blocco chiamante
 * @returns {Promise<void>} Restituisce una promise che si risolve con il tentativo di cancellazione del file e la visualizzazione dell'esito dell'operazione sulla console del server.
 */
// Si è utilizzata la API ".promises" di "fs" poichè si è fatto ricorso al "async/await", senza callback function.
const deleteFileBeforeThrow = async (file, caller) => 
{
    let success = true;
    try
    {
        await fileSystem.promises.unlink(path.join(__dirname, "..", "..", file.path));
    }
    catch(error)
    {
        success = false;
    }
    formattedOutput(`FILE DELETION BY ${caller}`, `File to delete:   ${file.filename}`, `File folder:   ${file.destination}`, success ? "File successfully deleted" : "File not deleted, <<< DELETE IT MANUALLY >>>");
}

/**
* Funzione che restituisce il report conclusivo dell'operazione di upload del file immagine, recuperando tutti i dati dalla request
* @function
* @param {Object} req - express.request
* @returns {Object} - Report conclusivo in formato oggetto
*/
function fileUploadReport(req)
{
    const { fileData, checkFileExtensionValidity, checkFileTypeValidity, checkFileSizeValidity } = req;
    const fileType = multerFileType(fileData);
    const fileExt = multerFileExtension(fileData);
    const uploadReportObject =    
        {
            "File_Type"         :   {
                                        "Provided_file_type"    :   fileType,
                                        "Allowed_file_type"     :   "image",
                                        "Is_valid_file_type"    :   checkFileTypeValidity
                                    },
            "File_extension"    :   {
                                        "Provided_file_ext"     :   fileExt,
                                        "Allowed_file_ext"      :   routesImagesParams[fileData.routeLabel].validExt,
                                        "Is_valid_file_ext"     :   checkFileExtensionValidity
                                    },
            ...(checkFileSizeValidity !== undefined) && 
            { 
                "File_size"     :   {
                                        "Provided_file_size"    :   `${req.file.size} bytes`,
                                        "Max_allowed_file_size" :   `${routesImagesParams[fileData.routeLabel].maxSize * 1024 * 1024} bytes - (${routesImagesParams[fileData.routeLabel].maxSize} MB)`,
                                        "Is_valid_file_size"    :   checkFileSizeValidity
                                    }
            },
            // Se checkFileSizeValidity è undefined significa che il file non è mai stato caricato (valore false), altrimenti, il suo valore identifica lo stato di File_uploaded, ovvero true = size confome = file caricato (essendo automaticamente true anche i precedenti due checks), false = size non conforme = file non caricato
            "File_uploaded"     :   (checkFileSizeValidity ?? false)
        };
    return uploadReportObject;
}

module.exports = { routesImagesParams, randomFileName, multerFileExtension, multerFileType, returnRouteLabel, deleteFileBeforeThrow, fileUploadReport }