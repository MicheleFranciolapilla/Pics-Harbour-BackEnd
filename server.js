// Importazione librerie
require("dotenv").config();
const express = require("express");

// Implementazione server
const   port = process.env.port
const   server = express();
        server.listen(port, () => console.log(`Server in esecuzione su ${process.env.HOST}${port}`));