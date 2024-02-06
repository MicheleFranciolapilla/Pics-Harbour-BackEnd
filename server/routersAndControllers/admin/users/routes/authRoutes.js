const express = require("express");
const router = express.Router();

const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const schemaForSignUp = require("../../../../validationSchemas/specificSchemas/schemaForSignUp");
const schemaForLogIn = require("../../../../validationSchemas/specificSchemas/schemaForLogIn");

const authCtrl = require("../controller/authController");

router.post("/signup", validationMiddleware(schemaForSignUp), authCtrl.signUp);
router.post("/login", validationMiddleware(schemaForLogIn), authCtrl.logIn);
router.post("/checktoken", authCtrl.checkToken);

module.exports = router;