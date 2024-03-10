const reportFileData =
{
    "folder"    :   "reports",
    "prefix"    :   "cleaning"    
}

const allowedActions = ["clean", "set", "reset"];

const timerMinValue = 60000; /* 1 minuto */

const configData =
[
    {
        "model"         :   "tokensblacklist",
        "prime"         :   2,
        "method"        :   "deleteMany",
        "objKey"        :   "lt",
        "placeholder"   :   "placeholder",
        "query"         :   { "where" : { "tokenExpAt" : { "lt" : "placeholder" } } },
        "queryForFind"  :   { "where" : { "tokenExpAt" : { "lt" : "placeholder" } } }
    },
    {
        "model"         :   "user",
        "prime"         :   3,
        "method"        :   "updateMany",
        "objKey"        :   "lt",
        "placeholder"   :   "placeholder",
        "query"         :   { "where" : { "tokenExpAt" : { "lt" : "placeholder" } }, "data" : { "tokenExpAt" : null } },
        "queryForFind"  :   { "where" : { "tokenExpAt" : { "lt" : "placeholder" } } }
    }
];

const cleanerOutcome =
[
        "db cleaner requested action successfully performed",
        "db cleaner already running",
        "no action specified",
        "error: no table specified for cleaning",
        "requested action impossible: timed cleaner is not set",
        "requested action impossible: timed cleaner is set",
        "requested action impossible: no valid table specified"
]

module.exports = { reportFileData, allowedActions, timerMinValue, configData, cleanerOutcome }

