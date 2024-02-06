const { normalizeSpaces, basicSlug } = require("./general");

// Oggetto contenente dati relativi a ciascun ruolo (role)
const rolesData =   
{
    "admin"         :   { "rank" : 10 },
    "super-admin"   :   { "rank" : 15 }
};

/**
 * Arrow function che restituisce i dati relativi al ruolo richiesto
 * @param {string} role - Ruolo per cui sono richiesti i dati specifici
 * @returns {Object} - Dati richiesti
 */
const returnRoleData = (role) => rolesData[basicSlug(normalizeSpaces(role.trim()))];

module.exports = { returnRoleData }