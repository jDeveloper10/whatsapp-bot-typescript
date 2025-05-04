"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTimeToHuman = exports.parseTimeExpression = exports.formatResponseTime = exports.measureResponseTime = void 0;
const measureResponseTime = (fn) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    const result = yield fn();
    const endTime = Date.now();
    return [result, endTime - startTime];
});
exports.measureResponseTime = measureResponseTime;
const formatResponseTime = (ms) => {
    if (ms < 1000) {
        return `🚀 Tiempo de respuesta: ${ms}ms`;
    }
    return `🚀 Tiempo de respuesta: ${(ms / 1000).toFixed(2)}s`;
};
exports.formatResponseTime = formatResponseTime;
/**
 * Convierte una expresión de tiempo (1m, 2h, 1d1h) a milisegundos
 * @param timeExp La expresión de tiempo (ej: 1m, 2h, 1d1h)
 * @returns Tiempo en milisegundos o null si el formato es inválido
 */
const parseTimeExpression = (timeExp) => {
    // Verificar si el formato es válido usando regex
    const regex = /^(\d+d)?(\d+h)?(\d+m)?$/;
    if (!regex.test(timeExp)) {
        return null;
    }
    let totalMs = 0;
    const minutesMatch = timeExp.match(/(\d+)m/);
    const hoursMatch = timeExp.match(/(\d+)h/);
    const daysMatch = timeExp.match(/(\d+)d/);
    if (minutesMatch) {
        totalMs += parseInt(minutesMatch[1]) * 60 * 1000; // minutos a ms
    }
    if (hoursMatch) {
        totalMs += parseInt(hoursMatch[1]) * 60 * 60 * 1000; // horas a ms
    }
    if (daysMatch) {
        totalMs += parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000; // días a ms
    }
    return totalMs;
};
exports.parseTimeExpression = parseTimeExpression;
/**
 * Formatea una cantidad de milisegundos a un texto legible
 * @param ms Tiempo en milisegundos
 * @returns Texto formateado (ej: "1 minuto", "2 horas y 30 minutos", etc.)
 */
const formatTimeToHuman = (ms) => {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let result = '';
    if (days > 0) {
        result += `${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0 || minutes > 0)
            result += ' y ';
    }
    if (hours > 0) {
        result += `${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0)
            result += ' y ';
    }
    if (minutes > 0 || (days === 0 && hours === 0)) {
        result += `${minutes || 1} minuto${minutes > 1 || minutes === 0 ? 's' : ''}`;
    }
    return result;
};
exports.formatTimeToHuman = formatTimeToHuman;
