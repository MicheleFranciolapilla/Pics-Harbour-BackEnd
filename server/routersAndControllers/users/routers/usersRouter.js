const express = require("express");
const router = express.Router();

const schemaForSignUp = require("../../../validationSchemas/specificSchemas/schemaForSignUp");
const schemaForLogIn = require("../../../validationSchemas/specificSchemas/schemaForLogIn");
const validationMiddleware = require("../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");

const users = require("../controllers/usersController");
const auth = require("../controllers/authController");

router.get("/", users.index);
// Rotte users connesse a registrazione utente ed autenticazione
router.post("/signup", validationMiddleware(schemaForSignUp), auth.signUp);
router.post("/login", validationMiddleware(schemaForLogIn), auth.logIn);
router.post("/checktoken", auth.checkToken);

module.exports = router;