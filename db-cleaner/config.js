const allowedActions = ["clean", "set", "reset"];

const timerMinValue = 60000; /*1 minuto */

const configData =
[
    {
        "model"         :   "tokenblacklist",
        "prime"         :   2,
        "method"        :   "deleteMany",
        "objKey"        :   "lt",
        "placeholder"   :   "placeholder",
        "query"         :   { "where" : { "tokenExpAt" : { "lt" : "placeholder" } } }
    },
    {
        "model"         :   "user",
        "prime"         :   3,
        "method"        :   "updateMany",
        "objKey"        :   "lt",
        "placeholder"   :   "placeholder",
        "query"         :   { "where" : { "tokenExpAt" : { "lt" : "placeholder" } }, "data" : { "tokenExpAt" : null } }
    }
];

const actionOutcome =
[
        "db cleaner successfully run",
        "db cleaner already running",
        "requested action impossible: timed cleaner is not set",
        "requested action impossible: timed cleaner is set",
        "error: no table specified for cleaning",
        "requested action impossible: no valid table specified"
]

module.exports = { allowedActions, timerMinValue, configData, actionOutcome }

