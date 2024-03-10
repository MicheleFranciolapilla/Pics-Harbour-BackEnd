const { dbCleaner } = require("./dbCleaner");

console.log("Parametri: ", process.argv);
dbCleaner({ "tables" : parseInt(process.argv[2]), "action" : process.argv[3], "timer" : process.argv[4], "requestedBy" : "server" });