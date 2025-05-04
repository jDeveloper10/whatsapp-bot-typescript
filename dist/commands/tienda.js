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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rankService_1 = __importDefault(require("../services/rankService"));
const rewards = [
    {
        name: "Suscripción a Netflix",
        description: "1 mes de Netflix Standard (2 pantallas HD)",
        requiredRank: "capitan",
        emoji: "🎬"
    },
    {
        name: "ChatGPT Plus",
        description: "1 mes de ChatGPT Plus con acceso a GPT-4",
        requiredRank: "coronel",
        emoji: "🤖"
    },
    {
        name: "GitHub Copilot Pro",
        description: "1 mes de GitHub Copilot Pro",
        requiredRank: "mayor",
        emoji: "👨‍💻"
    },
    {
        name: "$10 PayPal",
        description: "Transferencia de $10 USD a tu cuenta PayPal",
        requiredRank: "general",
        emoji: "💰"
    }
];
const command = {
    name: 'tienda',
    description: 'Muestra la tienda de rangos para canjear recompensas',
    adminOnly: false,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const sender = yield msg.getContact();
            const userId = sender.id.user;
            // Obtener el rango actual del usuario
            const userRank = rankService_1.default.getUserRank(userId);
            if (!userRank) {
                yield msg.reply("❌ No tienes un rango asignado aún. Interactúa más en el grupo para obtener un rango.");
                return;
            }
            // Ordenar rangos para saber cuál es mayor que otro
            const rankOrder = ["cabo", "teniente", "capitan", "mayor", "coronel", "general"];
            const userRankIndex = rankOrder.indexOf(userRank.rankKey);
            if (userRankIndex === -1) {
                yield msg.reply("❌ Ha ocurrido un error al verificar tu rango. Inténtalo más tarde.");
                return;
            }
            // Encabezado del mensaje
            let storeMessage = `*🏪 TIENDA DE RANGOS*\n\n`;
            storeMessage += `Tu rango actual: ${userRank.rank.emoji} *${userRank.rank.name}*\n`;
            storeMessage += `Mensajes: ${rankService_1.default.getUserMessageCount(userId)}\n\n`;
            storeMessage += `*RECOMPENSAS DISPONIBLES:*\n\n`;
            // Mostrar las recompensas, indicando cuáles están disponibles para el usuario
            let availableCount = 0;
            let unavailableCount = 0;
            rewards.forEach(reward => {
                const rewardRankIndex = rankOrder.indexOf(reward.requiredRank);
                const isAvailable = userRankIndex >= rewardRankIndex;
                if (isAvailable) {
                    storeMessage += `${reward.emoji} *${reward.name}* ✅\n`;
                    storeMessage += `   _${reward.description}_\n`;
                    storeMessage += `   Rango requerido: ${rankOrder[rewardRankIndex].charAt(0).toUpperCase() + rankOrder[rewardRankIndex].slice(1)}\n\n`;
                    availableCount++;
                }
                else {
                    storeMessage += `${reward.emoji} *${reward.name}* 🔒\n`;
                    storeMessage += `   _${reward.description}_\n`;
                    storeMessage += `   Rango requerido: ${rankOrder[rewardRankIndex].charAt(0).toUpperCase() + rankOrder[rewardRankIndex].slice(1)}\n\n`;
                    unavailableCount++;
                }
            });
            // Mensaje de resumen
            storeMessage += `*RESUMEN:*\n`;
            storeMessage += `✅ Recompensas disponibles: ${availableCount}\n`;
            storeMessage += `🔒 Recompensas bloqueadas: ${unavailableCount}\n\n`;
            storeMessage += `Para canjear una recompensa disponible, escribe:\n`;
            storeMessage += `"@bot canjear [nombre de la recompensa]"`;
            yield msg.reply(storeMessage);
            // Enviar mensaje adicional sobre requisitos para reclamar recompensas
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                const requirementsMessage = `⚠️ *IMPORTANTE* ⚠️\n\n` +
                    `Para reclamar estas recompensas debes tener una actividad constante en el grupo y ` +
                    `en las clases de la comunidad.\n\n` +
                    `*Requisitos adicionales:*\n` +
                    `▫️ Participación regular en chats grupales\n` +
                    `▫️ Asistencia a clases y talleres\n` +
                    `▫️ Contribución positiva a la comunidad\n\n` +
                    `Las recompensas son un reconocimiento a los miembros más activos y comprometidos. ¡Sigue participando!`;
                yield msg.reply(requirementsMessage);
            }), 500); // Esperar medio segundo antes de enviar el segundo mensaje
        }
        catch (error) {
            console.error('Error al mostrar la tienda de rangos:', error);
            yield msg.reply('❌ Ocurrió un error al mostrar la tienda de rangos.');
        }
    })
};
exports.default = command;
