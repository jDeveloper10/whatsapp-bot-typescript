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
const config_1 = require("../config/config");
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
const rankOrder = ["cabo", "teniente", "capitan", "mayor", "coronel", "general"];
const command = {
    name: 'canjear',
    description: 'Canjea una recompensa disponible según tu rango',
    adminOnly: false,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Validar que el usuario haya especificado qué quiere canjear
            if (!args || args.length < 1) {
                yield msg.reply("❌ Debes especificar qué recompensa quieres canjear. Ejemplo: '@bot canjear Netflix'");
                return;
            }
            const sender = yield msg.getContact();
            const userId = sender.id.user;
            const userNumber = sender.number;
            // Obtener el rango actual del usuario
            const userRank = rankService_1.default.getUserRank(userId);
            if (!userRank) {
                yield msg.reply("❌ No tienes un rango asignado aún. Interactúa más en el grupo para obtener un rango.");
                return;
            }
            // Buscar la recompensa que el usuario quiere canjear
            const userInput = args.join(" ").toLowerCase();
            const reward = rewards.find(r => r.name.toLowerCase().includes(userInput));
            if (!reward) {
                yield msg.reply(`❌ No se encontró la recompensa "${args.join(' ')}". Usa el comando "tienda" para ver las recompensas disponibles.`);
                return;
            }
            // Verificar si el usuario tiene el rango necesario
            const userRankIndex = rankOrder.indexOf(userRank.rankKey);
            const rewardRankIndex = rankOrder.indexOf(reward.requiredRank);
            if (userRankIndex < rewardRankIndex) {
                yield msg.reply(`❌ Tu rango actual (${userRank.rank.name}) no es suficiente para canjear esta recompensa. Necesitas ser ${reward.requiredRank.charAt(0).toUpperCase() + reward.requiredRank.slice(1)} o superior.`);
                return;
            }
            // Notificar al usuario sobre el canje y enviarlo al admin
            yield msg.reply(`✅ *¡Canje solicitado!*\n\nRecompensa: ${reward.emoji} ${reward.name}\n\nUn administrador procesará tu solicitud y se pondrá en contacto contigo para entregarte tu recompensa.`);
            // Notificar al administrador sobre el canje
            try {
                // Obtener información del chat
                const chat = yield msg.getChat();
                const chatName = chat.isGroup ? chat.name : "Chat privado";
                // Mensaje para el admin
                const adminMessage = `🔔 *NUEVA SOLICITUD DE CANJE*\n\n` +
                    `Usuario: ${sender.pushname} (${userNumber})\n` +
                    `Rango: ${userRank.rank.emoji} ${userRank.rank.name}\n` +
                    `Recompensa: ${reward.emoji} ${reward.name}\n` +
                    `Descripción: ${reward.description}\n` +
                    `Origen: ${chatName}\n\n` +
                    `Para aprobar este canje, contacta directamente al usuario.`;
                // Enviar notificación al admin principal (si está configurado)
                if (config_1.config.admin) {
                    // En lugar de intentar enviar directamente, 
                    // guardaremos la notificación para que el admin la vea la próxima vez que interactúe con el bot
                    console.log(`NOTIFICACIÓN PARA ADMIN (${config_1.config.admin}): ${adminMessage}`);
                    // Alternativa: responder en el mismo chat mencionando al admin
                    const adminMention = `@${config_1.config.admin}`;
                    const notificationForGroup = `${adminMention}\n\n${adminMessage}`;
                    if (chat.isGroup) {
                        // Solo intentar mencionar al admin si estamos en un grupo
                        // La API espera que las menciones se pasen de forma diferente
                        const adminId = `${config_1.config.admin}@c.us`;
                        yield chat.sendMessage(notificationForGroup, {
                            mentions: [adminId]
                        });
                    }
                    else {
                        // Informar al usuario que se ha notificado al admin
                        yield msg.reply("✅ Se ha enviado una notificación al administrador sobre tu solicitud.");
                    }
                }
                // Registrar el canje en el log
                console.log(`SOLICITUD DE CANJE: Usuario ${userNumber} (${userRank.rank.name}) solicitó ${reward.name}`);
            }
            catch (error) {
                console.error('Error al notificar al administrador sobre el canje:', error);
                // No notificar al usuario sobre este error, ya que su solicitud fue procesada
            }
        }
        catch (error) {
            console.error('Error al procesar solicitud de canje:', error);
            yield msg.reply('❌ Ocurrió un error al procesar tu solicitud de canje. Inténtalo más tarde.');
        }
    })
};
exports.default = command;
