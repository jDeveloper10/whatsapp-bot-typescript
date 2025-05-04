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
const timeUtils_1 = require("../utils/timeUtils");
const recordatorio = {
    name: 'recordatorio',
    description: 'Programa un recordatorio con el formato: !recordatorio <tiempo> <mensaje>. ' +
        'Tiempo puede ser en formato: 1m, 2h, 1d, 1h30m, etc.',
    execute(msg, args) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verificar si hay suficientes argumentos
            if (args.length < 2) {
                yield msg.reply('❌ Formato incorrecto. Usa: !recordatorio <tiempo> <mensaje>\n' +
                    'Ejemplo: !recordatorio 30m Reunión de equipo\n' +
                    'Formatos de tiempo: 1m (1 minuto), 2h (2 horas), 1d (1 día), ' +
                    '1h30m (1 hora y 30 minutos)');
                return;
            }
            // Extraer el tiempo y el mensaje
            const timeExpression = args[0];
            const reminderMessage = args.slice(1).join(' ');
            // Convertir la expresión de tiempo a milisegundos
            const timeInMs = (0, timeUtils_1.parseTimeExpression)(timeExpression);
            if (timeInMs === null) {
                yield msg.reply('❌ Formato de tiempo inválido. Usa formatos como 1m, 2h, 1d, 1h30m');
                return;
            }
            // Verificar que el tiempo no sea excesivamente largo (máximo 30 días)
            const MAX_TIME = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
            if (timeInMs > MAX_TIME) {
                yield msg.reply('❌ El tiempo máximo para un recordatorio es de 30 días.');
                return;
            }
            // Verificar que el tiempo no sea muy corto (mínimo 1 minuto)
            const MIN_TIME = 60 * 1000; // 1 minuto en ms
            if (timeInMs < MIN_TIME) {
                yield msg.reply('❌ El tiempo mínimo para un recordatorio es de 1 minuto.');
                return;
            }
            // Obtener información del remitente para el recordatorio
            const chat = yield msg.getChat();
            const humanReadableTime = (0, timeUtils_1.formatTimeToHuman)(timeInMs);
            // Confirmar la creación del recordatorio
            yield msg.reply(`⏰ Recordatorio programado en ${humanReadableTime}:\n"${reminderMessage}"`);
            // Establecer el temporizador para el recordatorio
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Verificar si el chat sigue siendo válido antes de enviar
                    const currentChat = yield msg.getChat();
                    if (currentChat) {
                        yield msg.reply(`⏰ *RECORDATORIO*\n\n${reminderMessage}`);
                    }
                }
                catch (error) {
                    console.error('Error al enviar recordatorio:', error);
                }
            }), timeInMs);
        });
    }
};
exports.default = recordatorio;
