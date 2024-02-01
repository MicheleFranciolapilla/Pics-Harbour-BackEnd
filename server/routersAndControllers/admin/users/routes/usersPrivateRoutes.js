const express = require("express");
const router = express.Router();

const schemaForSignUp = require("../../../../validationSchemas/specificSchemas/schemaForSignUp");
const schemaForLogIn = require("../../../../validationSchemas/specificSchemas/schemaForLogIn");
const { returnSchemaForIdLikeParams } = require("../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const authorizationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/authorizationMiddleware");

const usersPrivateController = require("../controller/usersPrivateController");
const authController = require("../controller/authController");

router.delete("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params")), authorizationMiddleware, usersPrivateController.destroy);
// Rotte users connesse a registrazione utente ed autenticazione
router.post("/signup", validationMiddleware(schemaForSignUp), authController.signUp);
router.post("/login", validationMiddleware(schemaForLogIn), authController.logIn);
router.post("/checktoken", authController.checkToken);

module.exports = router;