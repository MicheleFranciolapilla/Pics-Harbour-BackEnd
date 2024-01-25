const express = require("express");
const router = express.Router();
const users = require("../controllers/usersController");
const auth = require("../controllers/authController");

router.get("/", users.index);
// Rotte users connesse a registrazione utente ed autenticazione
router.post("/signup", auth.signUp);

module.exports = router;