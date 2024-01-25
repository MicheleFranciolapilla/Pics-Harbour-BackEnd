class ErrorFromDB extends Error
{
    constructor(message, errBlock)
    {
        super(message);
        this.status = 503;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorFromDB;