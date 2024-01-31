const express = require("express");
const router = express.Router();

const schemaForSignUp = require("../../../validationSchemas/specificSchemas/schemaForSignUp");
const schemaForLogIn = require("../../../validationSchemas/specificSchemas/schemaForLogIn");
const { returnSchemaForIdLikeParams } = require("../../../validationSchemas/generalSchemas/schemaForIdLikeParams");
const validationMiddleware = require("../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const authorizationMiddleware = require("../../../exceptionsAndMiddlewares/middlewares/authorizationMiddleware");

const users = require("../controllers/usersController");
const auth = require("../controllers/authController");

router.get("/", users.index);
router.get("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params")), users.show);
router.delete("/:id", validationMiddleware(returnSchemaForIdLikeParams("id", "params")), authorizationMiddleware, users.destroy);
// Rotte users connesse a registrazione utente ed autenticazione
router.post("/signup", validationMiddleware(schemaForSignUp), auth.signUp);
router.post("/login", validationMiddleware(schemaForLogIn), auth.logIn);
router.post("/checktoken", auth.checkToken);

module.exports = router;