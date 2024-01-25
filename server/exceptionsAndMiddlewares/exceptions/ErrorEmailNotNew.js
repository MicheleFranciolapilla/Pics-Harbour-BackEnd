class ErrorEmailNotNew extends Error
{
    constructor(message, errBlock)
    {
        super(message);
        this.status = 409;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorEmailNotNew;