const express = require("express");
const router = express.Router();

const schemaForSignUp = require("../../../../validationSchemas/specificSchemas/schemaForSignUp");
const schemaForLogIn = require("../../../../validationSchemas/specificSchemas/schemaForLogIn");
const { returnSchemaForIdLikeParams } = require("../../../../validationSchemas/generalSchemas/schemaForIdLikeParams");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const authorizationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/authorizationMiddleware");

const usersCtrl = require("../controller/usersPrivateController");
const authCtrl = require("../controller/authController");

router.delete("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params", true)), authorizationMiddleware, usersCtrl.destroy);
// Rotte users connesse a registrazione utente ed autenticazione
router.post("/signup", validationMiddleware(schemaForSignUp), authCtrl.signUp);
router.post("/login", validationMiddleware(schemaForLogIn), authCtrl.logIn);
router.post("/checktoken", authCtrl.checkToken);

module.exports = router;