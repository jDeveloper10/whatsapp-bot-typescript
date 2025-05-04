"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    environment: process.env.NODE_ENV || 'development',
    admin: '50768246752', // Número del administrador principal
    allowedGroups: ((_a = process.env.ALLOWED_GROUPS) === null || _a === void 0 ? void 0 : _a.split(',')) || [],
    adminNumbers: ((_b = process.env.ADMIN_NUMBERS) === null || _b === void 0 ? void 0 : _b.split(',')) || ['50768246752'], // Lista de administradores
    promoGroups: ((_c = process.env.PROMO_GROUPS) === null || _c === void 0 ? void 0 : _c.split(',')) || [
        '120363159757555887@g.us' // Grupo adicional para promociones
    ], // Grupos donde promocionar cursos
    promoInterval: parseInt(process.env.PROMO_INTERVAL || '7200000'), // Intervalo en ms (2 horas por defecto)
};
