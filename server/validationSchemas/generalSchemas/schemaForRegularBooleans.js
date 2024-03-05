const { isTruthyBooleanParam } = require("../../utilities/general");

const returnSchemaForRegularBooleans = (fieldName) =>
({
    in              :   ["body"],
    optional        :   true,
    isBoolean       :   {
                            errorMessage    :   `The field '${fieldName}' must be boolean: values accepted: [0, 1, false, true]`,
                            bail            :   true
                        },
    customSanitizer :   {   options         :   (value) =>  
                                                (value !== undefined)
                                                ? isTruthyBooleanParam(value)
                                                : undefined
                        }
});

module.exports = { returnSchemaForRegularBooleans }