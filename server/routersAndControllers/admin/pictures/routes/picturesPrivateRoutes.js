const express = require("express");
const router = express.Router();

const { imageUploader } = require("../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const schemaForPictureStore = require("../../../../validationSchemas/specificSchemas/schemaForPictureStore");
const { returnSchemaForIdLikeParams } = require("../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");

const picturesCtrl = require("../controller/picturesPrivateController");

router.post("/", imageUploader, validationMiddleware(schemaForPictureStore), picturesCtrl.store);
router.delete("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params", true)), picturesCtrl.destroy);

module.exports = router;