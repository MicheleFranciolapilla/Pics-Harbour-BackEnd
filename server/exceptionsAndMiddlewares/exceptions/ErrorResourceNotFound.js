class ErrorResourceNotFound extends Error
{
    constructor(resource, errBlock)
    {
        super(`Error 404: ${resource} not found!`);
        this.status = 404;
        this.errorBlock = errBlock;
    }
}

module.exports = ErrorResourceNotFound;