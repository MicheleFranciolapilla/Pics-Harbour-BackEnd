/**
* Oggetto contenente i parametri utilizzati dal multer middleware, a seconda della rotta in uso.
* @typedef {Object} RoutesImagesParams
* @property {string} folder - Cartella di salvataggio dei files.
* @property {string[]} validExt - Array contenente le estensioni ammesse.
* @property {number} maxSize - Dimensioni massime ammesse per i files.
*/
const routesImagesParams =  {
                                "users"         :   {
                                                        "folder"    :   "usersThumbs",
                                                        "validExt"  :   ['jpg', 'jpeg', 'png'],
                                                        "maxSize"   :   0.5,
                                                        "fieldName" :   "thumb"
                                                    },   
                                "categories"    :   {
                                                        "folder"    :   "categoriesThumbs",
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

const multerFileExtension = (file) => file.originalname.split(".").pop().toLowerCase();
const multerFileType = (file) => file.mimetype.split("/")[0].toLowerCase();

module.exports = { routesImagesParams, randomFileName, multerFileExtension, multerFileType }