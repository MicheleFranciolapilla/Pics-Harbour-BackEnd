const express = require("express");
const router = express.Router();

const users = require("../controllers/usersController");
const auth = require("../controllers/authController");

router.get("/", users.index);
// Rotte users connesse a registrazione utente ed autenticazione
router.post("/signup", auth.signUp);
router.post("/login", auth.logIn);
router.post("/checktoken", auth.checkToken);

module.exports = router;