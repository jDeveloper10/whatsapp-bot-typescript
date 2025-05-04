"use strict";
/**
 * Utilidades para manejo y comparación de texto
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBestMatch = exports.levenshteinDistance = exports.normalizeText = void 0;
// Elimina acentos y normaliza el texto
const normalizeText = (text) => {
    return text.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};
exports.normalizeText = normalizeText;
// Calcula la distancia de Levenshtein entre dos strings
const levenshteinDistance = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
        }
    }
    return track[str2.length][str1.length];
};
exports.levenshteinDistance = levenshteinDistance;
// Encuentra la mejor coincidencia entre un texto y una lista de opciones
const findBestMatch = (text, options) => {
    const normalizedText = (0, exports.normalizeText)(text);
    let bestMatch = '';
    let minDistance = Infinity;
    for (const option of options) {
        const normalizedOption = (0, exports.normalizeText)(option);
        const distance = (0, exports.levenshteinDistance)(normalizedText, normalizedOption);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = option;
        }
    }
    // Calcular similitud (0-1) basada en la distancia
    const maxLength = Math.max(text.length, bestMatch.length);
    const similarity = 1 - (minDistance / maxLength);
    return { bestMatch, similarity };
};
exports.findBestMatch = findBestMatch;
