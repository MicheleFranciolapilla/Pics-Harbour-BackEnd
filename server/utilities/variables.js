/**
 * @constant
 * Specifica la durata del JSON Web Token rilasciato in fase di registrazione utente o log In
 */
const tokenLifeTime = "1h";
/**
 * @constant
 * Dimensioni delle colonne specificate, all'interno del database (coerenti con il file schema.prisma)
 */
const tableUsersColumnNameSize = 20;
const tableUsersColumnSurnameSize = 30;
const tableUsersColumnEmailSize = 100;
const tablePicturesColumnTitle = 50;
const minEmailLength = 5;
const minPasswordLength = 8;
const maxPasswordLength = 20;
const minTitleLength = 10;
const maxDescriptionLength = 1000;

module.exports =    { 
                        tokenLifeTime, 
                        tableUsersColumnNameSize, 
                        tableUsersColumnSurnameSize, 
                        tableUsersColumnEmailSize,
                        tablePicturesColumnTitle,
                        minEmailLength,
                        minPasswordLength,
                        maxPasswordLength,
                        minTitleLength,
                        maxDescriptionLength
                    }