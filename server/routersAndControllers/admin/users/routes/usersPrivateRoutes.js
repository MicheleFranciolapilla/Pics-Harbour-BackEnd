const express = require("express");
const router = express.Router();

const validationMiddleware = require("../../../../exceptionsAndMiddlewares/middlewares/validationMiddleware");

const usersCtrl = require("../controller/usersPrivateController");

// Le rotte "/users" protette (private) non devono richiedere alcun "id" poichè esso viene ricavato direttamente dal token per mezzo del middleware autorizzativo che provvede a salvarlo in "req.tokenOwner"

module.exports = router;