import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    environment: process.env.NODE_ENV || 'development',
    admin: '50768246752', // Número del administrador principal
    allowedGroups: process.env.ALLOWED_GROUPS?.split(',') || [],
    adminNumbers: process.env.ADMIN_NUMBERS?.split(',') || ['50768246752'], // Lista de administradores
    promoGroups: process.env.PROMO_GROUPS?.split(',') || [
        '120363159757555887@g.us' // Grupo adicional para promociones
    ], // Grupos donde promocionar cursos
    promoInterval: parseInt(process.env.PROMO_INTERVAL || '7200000'), // Intervalo en ms (2 horas por defecto)
} as const;