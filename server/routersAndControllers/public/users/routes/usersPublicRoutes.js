const express = require("express");
const router = express.Router();

const { returnSchemaForIdLikeParams } = require("../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");

const usersCtrl = require("../controller/usersPublicController");

router.get("/", usersCtrl.index);
router.get("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params", true)), usersCtrl.show);

module.exports = router;