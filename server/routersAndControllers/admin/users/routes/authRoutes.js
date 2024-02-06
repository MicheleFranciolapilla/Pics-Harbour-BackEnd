const express = require("express");
const router = express.Router();

const { imageUploader } = require("../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");
const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");
const schemaForSignUp = require("../../../../validationSchemas/specificSchemas/schemaForSignUp");
const schemaForLogIn = require("../../../../validationSchemas/specificSchemas/schemaForLogIn");

const authCtrl = require("../controller/authController");

router.post("/signup", imageUploader("users", false), validationMiddleware(schemaForSignUp), authCtrl.signUp);
router.post("/login", validationMiddleware(schemaForLogIn), authCtrl.logIn);
router.post("/checktoken", authCtrl.checkToken);

module.exports = router;