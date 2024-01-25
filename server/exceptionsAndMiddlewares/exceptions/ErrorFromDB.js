class ErrorFromDB extends Error
{
    constructor(message, statusCode, errBlock)
    {
        super(message);
        this.status = statusCode;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorFromDB;