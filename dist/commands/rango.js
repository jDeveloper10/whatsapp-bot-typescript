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
const command = {
    name: 'rango',
    description: 'Muestra tu rango actual o el de otro usuario mencionado',
    adminOnly: false,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const sender = yield msg.getContact();
            let targetUserId = sender.id.user;
            let targetName = sender.pushname || sender.id.user;
            let isMentioned = false;
            console.log(`Comando rango ejecutado por: ${sender.id.user}, menciones: ${((_a = msg.mentionedIds) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
            // Si hay al menos 2 menciones (el bot + otro usuario)
            // La primera mención es típicamente el bot, la segunda es el usuario objetivo
            if (msg.mentionedIds && msg.mentionedIds.length > 1) {
                // La segunda mención es el usuario cuyo rango queremos consultar
                const mentionedId = msg.mentionedIds[1];
                targetUserId = mentionedId.toString().split('@')[0];
                targetName = targetUserId; // Nombre predeterminado es el ID
                isMentioned = true;
                console.log(`Usuario mencionado detectado: ${targetUserId}`);
                // Intentar obtener más información sobre el usuario mencionado
                try {
                    const chat = yield msg.getChat();
                    if (chat.isGroup) {
                        const groupChat = chat;
                        const participants = groupChat.participants || [];
                        for (const participant of participants) {
                            if (participant.id._serialized === mentionedId.toString()) {
                                if (participant.id.user) {
                                    targetUserId = participant.id.user;
                                }
                                break;
                            }
                        }
                    }
                }
                catch (error) {
                    console.error('Error obteniendo detalles del usuario mencionado:', error);
                }
            }
            // Si hay respuesta a un mensaje, consultar el rango de ese usuario
            else if (msg.hasQuotedMsg) {
                try {
                    const quotedMsg = yield msg.getQuotedMessage();
                    const quotedContact = yield quotedMsg.getContact();
                    targetUserId = quotedContact.id.user;
                    targetName = quotedContact.pushname || targetUserId;
                    isMentioned = true;
                    console.log(`Mensaje citado, consultando rango de: ${targetUserId}`);
                }
                catch (error) {
                    console.error('Error obteniendo contacto del mensaje citado:', error);
                }
            }
            // Si no hay segunda mención ni mensaje citado, mostramos el rango del emisor
            else {
                console.log(`Sin menciones adicionales, mostrando rango propio: ${targetUserId}`);
                isMentioned = false;
            }
            // Obtener el rango del usuario objetivo
            const userRank = rankService_1.default.getUserRank(targetUserId);
            const messageCount = rankService_1.default.getUserMessageCount(targetUserId);
            if (!userRank) {
                yield msg.reply(`No hay registro de actividad para ${isMentioned ? `el usuario ${targetName}` : 'ti'}.`);
                return;
            }
            // Crear mensaje informativo
            let rankMessage = '';
            if (isMentioned) {
                rankMessage = `*Rango de ${targetName}:* ${userRank.rank.emoji} ${userRank.rank.name}\n`;
            }
            else {
                rankMessage = `*Tu rango actual:* ${userRank.rank.emoji} ${userRank.rank.name}\n`;
            }
            rankMessage += `*Mensajes totales:* ${messageCount}\n`;
            // Información sobre el próximo rango
            const nextRank = rankService_1.default.getNextRank(userRank.rankKey);
            if (nextRank) {
                const messagesLeft = nextRank.minMessages - messageCount;
                rankMessage += `\n*Próximo rango:* ${nextRank.emoji} ${nextRank.name}\n`;
                rankMessage += `*Mensajes necesarios:* ${messagesLeft} más`;
            }
            else {
                rankMessage += "\n*¡Felicidades!* Ha alcanzado el rango máximo. 👑";
            }
            yield msg.reply(rankMessage);
        }
        catch (error) {
            console.error('Error al obtener el rango:', error);
            yield msg.reply('❌ Ocurrió un error al obtener la información de rango.');
        }
    })
};
exports.default = command;
