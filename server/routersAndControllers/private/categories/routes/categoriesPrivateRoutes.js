const express = require("express");
const router = express.Router();

const { imageUploader } = require("../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const schemaForCategoryStore = require("../../../../validationSchemas/specificSchemas/schemaForCategoryStore");
const schemaForCategoryUpdate = require("../../../../validationSchemas/specificSchemas/schemaForCategoryUpdate");
const { returnSchemaForIdLikeParams } = require("../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");

const categoriesCtrl = require("../controller/categoriesPrivateController");

router.post("/", imageUploader, validationMiddleware(schemaForCategoryStore), categoriesCtrl.store);
router.put("/:id", imageUploader, validationMiddleware(schemaForCategoryUpdate), categoriesCtrl.update);
router.delete("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params", true)), categoriesCtrl.destroy);

module.exports = router;