// Importazione librerie
require("dotenv").config();
const cors = require("cors");
const express = require("express");

// Importazione routers & controllers
const home = require("./server/routersAndControllers/guest/controllers/homeController");
const usersRouter = require("./server/routersAndControllers/users/routers/usersRouter");

// Importazione middlewares
const errorManager = require("./server/exceptionsAndMiddlewares/middlewares/errorManager");
const route404 = require("./server/exceptionsAndMiddlewares/middlewares/middleware404");

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
// body parsers
server.use(express.json());
server.use(express.urlencoded({ extended : true }));
// Public routes
server.get("/", home);
server.use("/users", usersRouter);
// Private routes

// Middlewares errori
server.use(route404);
server.use(errorManager);

server.listen(port, () => console.log(`Server in esecuzione su ${process.env.HOST}${port}`));
