const express = require("express");
const router = express.Router();

const { returnSchemaForIdLikeParams } = require("../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");

const usersPublicController = require("../controller/usersPublicController");

router.get("/", usersPublicController.index);
router.get("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params")), usersPublicController.show);

module.exports = router;