const express = require("express");
const router = express.Router();

const { imageUploader } = require("../../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");
const validationMiddleware = require("../../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const { returnSchemaForPictureStoreOrUpdate } = require("../../../../../validationSchemas/specificSchemas/schemaForPictureStoreOrUpdate");
const { returnSchemaForIdLikeParams } = require("../../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");
 
const schemaForUpdate = 
{
    ...returnSchemaForIdLikeParams("id", "params", true),
    ...returnSchemaForPictureStoreOrUpdate(false)
};

const picturesCtrl = require("../controller/picturesPrivateController");

router.post("/", imageUploader, validationMiddleware(returnSchemaForPictureStoreOrUpdate(true)), picturesCtrl.store);
// Nell'ambito della picture saranno modificabili tutti i campi, tranne la foto in sè
router.put("/:id", validationMiddleware(schemaForUpdate), picturesCtrl.update);
router.delete("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params", true)), picturesCtrl.destroy);

module.exports = router;