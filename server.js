// Importazione librerie
require("dotenv").config();
const cors = require("cors");
const express = require("express");

// Importazione routers & controllers
// Parte pubblica
const home = require("./server/routersAndControllers/guest/home/controller/homeController");
const usersPublicRoutes = require("./server/routersAndControllers/guest/users/routes/usersPublicRoutes");
// Autenticazione
const authRoutes = require("./server/routersAndControllers/admin/auth/routes/authRoutes");
// Parte Privata
const usersPrivateRoutes = require("./server/routersAndControllers/admin/users/routes/usersPrivateRoutes");
const picturesPrivateRoutes = require("./server/routersAndControllers/admin/pictures/routes/picturesPrivateRoutes");
const categoriesPrivateRoutes = require("./server/routersAndControllers/admin/categories/routes/categoriesPrivateRoutes");

// Importazione middlewares
const authorizationMiddleware = require("./server/exceptionsAndMiddlewares/middlewares/authorizationMiddleware");
const route404 = require("./server/exceptionsAndMiddlewares/middlewares/middleware404");
const errorManager = require("./server/exceptionsAndMiddlewares/middlewares/errorManager");

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
// Rotte di autenticazione
server.use("/auth", authRoutes);
// Rotte private
// La sintassi utilizzata per registrare il middleware "authorizationMiddleware" sulle rotte protette è necessaria ai fini di poter passare un argomento extra al middleware stesso quando lo si registra direttamente nella server app. La registrazione eventuale dentro un router sarebbe di tipo più semplice (vedere la sintassi utilizzata nei routers per validationMiddleware").
// Nel caso specifico, la sintassi è assimilabile alla seguente:
// (req, res, next) => 
// {
//    const middlewareFunction = authorizationMiddleware("Super Admin");
//    middlewareFunction(req, res, next);
// }
server.use("/users", (req, res, next) => authorizationMiddleware("Admin")(req, res, next), usersPrivateRoutes);
server.use("/pictures", (req, res, next) => authorizationMiddleware("Admin")(req, res, next), picturesPrivateRoutes);
server.use("/categories", (req, res, next) => authorizationMiddleware("Super Admin")(req, res, next), categoriesPrivateRoutes);

// Middlewares errori
server.use(route404);
server.use(errorManager);

server.listen(port, () => console.log(`Server in esecuzione su ${process.env.HOST}${port}`));