// Importazione librerie
require("dotenv").config();
const cors = require("cors");
const express = require("express");

// Implementazione server
const   port = process.env.port
const   server = express();
        // Settaggio CORS Policy
        server.use(cors(
                {
                        origin          :       "*",
                        methods         :       "GET, POST, PUT, DELETE",
                        credentials     :       true
                }));
        server.listen(port, () => console.log(`Server in esecuzione su ${process.env.HOST}${port}`));