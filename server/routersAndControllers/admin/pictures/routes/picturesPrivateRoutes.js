const express = require("express");
const router = express.Router();

const { imageUploader } = require("../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");

const picturesCtrl = require("../controller/picturesPrivateController");

router.post("/", imageUploader("pictures"), picturesCtrl.store);

module.exports = router;