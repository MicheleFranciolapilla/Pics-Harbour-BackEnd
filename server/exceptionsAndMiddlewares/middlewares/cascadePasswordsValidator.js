const validationMiddleware = require("./validationMiddleware");
const { returnSchemaForPassword } = require("../../validationSchemas/generalSchemas/schemaForPassword");

const ErrorRequestValidation = require("../exceptions/ErrorRequestValidation");

const validateParams = (req, res, next) =>
{
    const { password, newPassword, confirmNew } = req.body;
    if (newPassword === password)
        return next(new ErrorRequestValidation("The new password must be different than the previous password.", "CASCADE PASSWORDS VALIDATOR"));
    if (!confirmNew)
        return next(new ErrorRequestValidation("The field 'confirmNew' is required!", "CASCADE PASSWORDS VALIDATOR"));
    if (confirmNew.trim() !== newPassword.trim())
        return next(new ErrorRequestValidation("The fields 'newPassword' and 'confirmNew' don't match.", "CASCADE PASSWORDS VALIDATOR"));
    return next();
}

const cascadePasswordsValidators = 
[
    validationMiddleware(returnSchemaForPassword("password")),
    validationMiddleware(returnSchemaForPassword("newPassword")),
    validateParams
];

module.exports = { cascadePasswordsValidators }