class ErrorResourceNotFound extends Error
{
    constructor(resource)
    {
        super(`Error 404: ${resource} not found!`);
        this.status = 404;
        console.log(`Error 404: ${resource} not found!`);
    }
}

module.exports = ErrorResourceNotFound;