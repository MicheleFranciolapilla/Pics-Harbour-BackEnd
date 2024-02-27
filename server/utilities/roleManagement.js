const { normalizeSpaces, basicSlug, isDivisibleBY } = require("./general");

// Oggetto contenente i dati di accesso e riferimento dei ruoli (roles)
// Il valore di accesso dei ruoli è espresso mediante numeri primi
const roleAccessData =   
{
    "admin"         :   { "prime" : 2 },
    "super-admin"   :   { "prime" : 3 }
};

/**
 * Arrow function che restituisce i dati relativi al ruolo richiesto
 * @param {string} role - Ruolo per cui sono richiesti i dati specifici
 * @returns {Object} - Dati richiesti
 */
const returnRoleData = (role) => roleAccessData[basicSlug(normalizeSpaces(role.trim()))];

/**
 * Funzione che calcola il prodotto tra i coefficenti di accesso (numeri primi) di tutti i ruoli passati come parametro. 
 * Questo metodo serve per valutare l'accessibilità alle rotte da parte di un numero qualsiasi di ruoli (configurazione facilmente scalabile).
 * @param {...string} rolesList - Ruoli ai quali è permesso l'accesso alla rotta corrente
 * @returns {number} - Prodotto tra i numeri primi (coefficenti di accesso) di ciascuno dei ruoli autorizzati
 */
const rolesAccessibilityValue = (...rolesList) =>
{
    let value = 1;
    rolesList.forEach( role =>
        {
            const roleKey = basicSlug(normalizeSpaces(role.trim()));
            if (Object.hasOwn(roleAccessData, roleKey))
                value *= returnRoleData(role).prime;
        });
    return value;
}

/**
 * Funzione che restituisce il valore booleano indicativo dell'accessibilità del ruolo passato come argomento alla rotta corrente.
 * Questa funzione, in collaborazione con la funzione "rolesAccessibilityValue" consente di gestire l'accessibilità alle rotte da parte di un qualsiasi numero di ruoli.
 * Il meccanismo di base poggia sui numeri primi caratteristici di ciascun ruolo e consente una facile scalabilità futura.
 * @param {string} roleToCheck - Ruolo per il quale si valuta l'accessibilità alla rotta corrente
 * @param {object} req - Oggetto express request in cui vi è l'oggetto "rolesAccessibility" contenente le informazioni relative ai ruoli ammessi alla rotta corrente
 * @returns {boolean} - Valore booleano che stabilisce l'accessibilità del ruolo alla rotta corrente
 */
const checkRoleAccessibility = (roleToCheck, req) => isDivisibleBY(req.rolesAccessibility.value, returnRoleData(roleToCheck).prime);

module.exports = { returnRoleData, rolesAccessibilityValue, checkRoleAccessibility }