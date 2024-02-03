const express = require("express");
const router = express.Router();

const { imageUploader } = require("../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const schemaForPictureStore = require("../../../../validationSchemas/specificSchemas/schemaForPictureStore");

const picturesCtrl = require("../controller/picturesPrivateController");

router.post("/", imageUploader("pictures"), validationMiddleware(schemaForPictureStore), picturesCtrl.store);

module.exports = router;