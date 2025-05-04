/**
 * Utilidades para manejo y comparación de texto
 */

// Elimina acentos y normaliza el texto
export const normalizeText = (text: string): string => {
    return text.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

// Calcula la distancia de Levenshtein entre dos strings
export const levenshteinDistance = (str1: string, str2: string): number => {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }

    return track[str2.length][str1.length];
};

// Encuentra la mejor coincidencia entre un texto y una lista de opciones
export const findBestMatch = (text: string, options: string[]): {
    bestMatch: string;
    similarity: number;
} => {
    const normalizedText = normalizeText(text);
    let bestMatch = '';
    let minDistance = Infinity;

    for (const option of options) {
        const normalizedOption = normalizeText(option);
        const distance = levenshteinDistance(normalizedText, normalizedOption);

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