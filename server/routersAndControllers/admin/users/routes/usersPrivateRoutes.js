const express = require("express");
const router = express.Router();

const { returnSchemaForIdLikeParams } = require("../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");

const usersCtrl = require("../controller/usersPrivateController");

router.delete("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params", true)), usersCtrl.destroy);

module.exports = router;