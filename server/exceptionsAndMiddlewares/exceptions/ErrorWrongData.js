class ErrorWrongData extends Error
{
    constructor(data, errBlock)
    {
        super(`Error 401: wrong ${data}!`);
        this.status = 401;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorWrongData;