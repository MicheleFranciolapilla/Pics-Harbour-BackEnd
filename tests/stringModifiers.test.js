const { normalizeSpaces, upperStartingChar } = require("../server/utilities/general");

describe("function normalizeSpaces: sostituisce tutti i raggruppamenti di spazi con un singolo spazio", () =>
    {
        test("Stringa con spazi singoli separati da caratteri speciali e caratteri regolari: nessuna modifica apportata", () =>
            {
                const inputStr = "Hello my dear world & | my dear friends!";
                const result = normalizeSpaces(inputStr);
                expect(result).toEqual(inputStr);
            });
        test("Stringa con raggruppamenti di spazi variabili (anche più di 2)", () =>
            {
                const inputStr = "Hello   my  dear world  &     |  my    dear  friends!";
                const result = normalizeSpaces(inputStr);
                expect(result).toEqual("Hello my dear world & | my dear friends!");
            });
        test("Stringa vuota: risultato stringa vuota", () =>
            {
                expect(normalizeSpaces("")).toEqual("");
            });
        test("Stringa costituita da due soli spazi", () =>
            {
                expect(normalizeSpaces("  ")).toEqual(" ");
            });
        test("Stringa costituita da un solo spazio", () =>
            {
                expect(normalizeSpaces(" ")).toEqual(" ");
            });    
    });

describe("function upperStartingChar: riceve una stringa NORMALIZZATA di parole (parola singola o più parole divise da un unico spazio) e restituisce sempre l'intera stringa in lowercase con la prima lettera della prima parola in uppercase e, se il parametro booleano 'allFirstChars' vale 'true', anche il primo carattere di ciascuna parola della stringa sarà in uppercase", () =>
    {
        test("Stringa con caratteri maiuscoli e minuscoli a caso e monoparola. Test doppio con booleano true e false", () =>
            {
                const inputStr = "pRECipiTevOLissiMeVOLMenTe";
                const resultWithTrue = upperStartingChar(inputStr, true);
                expect(resultWithTrue).toEqual("Precipitevolissimevolmente");
                const resultWithFalse = upperStartingChar(inputStr, false);
                expect(resultWithFalse).toEqual("Precipitevolissimevolmente");
            });
        test("Stringa normalizzata composta da più parole (divise da un solo spazio) con maiuscole e minuscole a caso. Test doppio con booleano true e false", () =>
            {
                const inputStr = "caN cHE AbbAIa NON moRDe";
                const resultWithTrue = upperStartingChar(inputStr, true);
                expect(resultWithTrue).toEqual("Can Che Abbaia Non Morde");
                const resultWithFalse = upperStartingChar(inputStr, false);
                expect(resultWithFalse).toEqual("Can che abbaia non morde");            
            });
        test("Stringa vuota: risultato stringa vuota", () =>
            {
                expect(upperStartingChar("", true)).toEqual("");
            });
        test("Stringa costituita da un solo spazio", () =>
            {
                expect(upperStartingChar(" ", true)).toEqual(" ");
            });    
    });


