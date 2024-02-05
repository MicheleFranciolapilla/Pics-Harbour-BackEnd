// Importazione librerie
require("dotenv").config();
const cors = require("cors");
const express = require("express");

// Importazione routers & controllers
// Parte pubblica
const home = require("./server/routersAndControllers/guest/home/controller/homeController");
const usersPublicRoutes = require("./server/routersAndControllers/guest/users/routes/usersPublicRoutes");
// Parte Privata
const usersPrivateRoutes = require("./server/routersAndControllers/admin/users/routes/usersPrivateRoutes");
const picturesPrivateRoutes = require("./server/routersAndControllers/admin/pictures/routes/picturesPrivateRoutes");
const categoriesPrivateRoutes = require("./server/routersAndControllers/admin/categories/routes/categoriesPrivateRoutes");

// Importazione middlewares
const errorManager = require("./server/exceptionsAndMiddlewares/middlewares/errorManager");
const route404 = require("./server/exceptionsAndMiddlewares/middlewares/middleware404");

// Implementazione server
const   port = process.env.port;
const   server = express();
// Settaggio CORS Policy
server.use(cors(
        {
                origin          :       "*",
                methods         :       "GET, POST, PUT, DELETE",
                credentials     :       true
        }));
// Middleware per file statici
server.use(express.static("public"));
// Body parsers
server.use(express.json());
server.use(express.urlencoded({ extended : true }));
// Rotte pubbliche
server.get("/", home);
server.use("/users", usersPublicRoutes);
// Rotte private
server.use("/users", usersPrivateRoutes);
server.use("/pictures", picturesPrivateRoutes);
server.use("/categories", categoriesPrivateRoutes);

// Middlewares errori
server.use(route404);
server.use(errorManager);

server.listen(port, () => console.log(`Server in esecuzione su ${process.env.HOST}${port}`));
