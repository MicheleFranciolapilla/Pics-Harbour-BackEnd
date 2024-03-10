const { deepFindAndReplace } = require("../server/utilities/general");

describe("function deepFindAndReplace: parametri... objectToScan, keyToFind, valueToFind, newValue. Scandaglia in profondità l'oggetto fornito, cercando tutte le chiavi coincidenti con 'keyToFind' e, se riscontra, per esse, un valore coincidente con 'valueToFind' lo sostituisce con 'newValue'. La funzione modifica l'oggetto di partenza", () =>
    {
        test("Oggetto con più chiavi coincidenti, a vari livelli, non tutte con valori coincidenti con il valore da sostituire.", () =>
            {
                const objectToScan =
                {
                    "key1"          :   {
                                            "searchedKey"   :   "placeholder",
                                            "anotherKey"    :   3,
                                            "oneMoreKey"    :   "placeholder"
                                        },
                    "key2"          :   {
                                            "searchedKey"   :   5,
                                            "otherKey"      :   ""
                                        },
                    "key3"          :   {
                                            "deepObj"       :   {
                                                                    "someKey"       :   "some value",
                                                                    "searchedKey"   :   "placeholder"
                                                                },
                                            "searchedKey"   :   {
                                                                    "otherKey"      :   "placeholder",
                                                                    "SEARCHEDkey"   :   "placeholder"
                                                                }
                                        },
                    "searchedKey"   :   "placeholder"
                };
                const keyToFind = "searchedKey";
                const valueToFind = "placeholder";
                const newValue = "REPLACED";
                const expectedObj =
                {
                    "key1"          :   {
                                            "searchedKey"   :   "REPLACED",
                                            "anotherKey"    :   3,
                                            "oneMoreKey"    :   "placeholder"
                                        },
                    "key2"          :   {
                                            "searchedKey"   :   5,
                                            "otherKey"      :   ""
                                        },
                    "key3"          :   {
                                            "deepObj"       :   {
                                                                    "someKey"       :   "some value",
                                                                    "searchedKey"   :   "REPLACED"
                                                                },
                                            "searchedKey"   :   {
                                                                    "otherKey"      :   "placeholder",
                                                                    "SEARCHEDkey"   :   "placeholder"
                                                                }
                                        },
                    "searchedKey"   :   "REPLACED"
                };
                deepFindAndReplace(objectToScan, keyToFind, valueToFind, newValue);
                expect(objectToScan).toEqual(expectedObj);
            });
    });