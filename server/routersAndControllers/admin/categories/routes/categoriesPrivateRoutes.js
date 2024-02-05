const express = require("express");
const router = express.Router();

const { imageUploader } = require("../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const schemaForCategoryStore = require("../../../../validationSchemas/specificSchemas/schemaForCategoryStore");

const categoriesCtrl = require("../controller/categoriesPrivateController");

router.post("/", imageUploader("categories"), validationMiddleware(schemaForCategoryStore), categoriesCtrl.store);

module.exports = router;