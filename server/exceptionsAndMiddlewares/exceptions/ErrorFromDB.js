class ErrorFromDB extends Error
{
    constructor(message)
    {
        super(message);
        this.status = 503;
        console.log("Error from DB...")
    }
}

module.exports = ErrorFromDB;