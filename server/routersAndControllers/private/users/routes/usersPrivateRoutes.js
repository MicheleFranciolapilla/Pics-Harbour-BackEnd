const express = require("express");
const router = express.Router();
 
const { imageUploader } = require("../../../../exceptionsAndMiddlewares/middlewares/imageUploadMiddleware");
const { cascadeUserUpdateValidators } = require("../../../../exceptionsAndMiddlewares/middlewares/cascadeUserUpdateValidator");
const { cascadePasswordsValidators } = require("../../../../exceptionsAndMiddlewares/middlewares/cascadePasswordsValidator");

const usersCtrl = require("../controller/usersPrivateController");

// Le rotte "/users" protette (private) non devono richiedere alcun "id" poichè esso viene ricavato direttamente dal token per mezzo del middleware autorizzativo che provvede a salvarlo in "req.tokenOwner"
router.put("/", imageUploader, cascadeUserUpdateValidators, usersCtrl.update);
router.put("/changepassword", cascadePasswordsValidators, usersCtrl.changePassword);
router.delete("/", usersCtrl.destroy);

module.exports = router;