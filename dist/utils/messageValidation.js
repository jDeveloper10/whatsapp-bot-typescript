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
exports.MessageValidation = void 0;
class MessageValidation {
    constructor(client) {
        this.botJid = null;
        this.client = client;
    }
    setBotJid(jid) {
        this.botJid = jid.split('@')[0] + '@c.us';
        console.log('Bot JID set to:', this.botJid);
    }
    isValidMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const isGroup = ((_a = msg.from) === null || _a === void 0 ? void 0 : _a.endsWith('@g.us')) || false;
            const type = isGroup ? 'group' : 'private';
            console.log('Message validation:', {
                from: msg.from,
                body: msg.body,
                type: type,
                isGroup: isGroup
            });
            // Si es un mensaje privado, simplemente validar que no sea del bot
            if (!isGroup) {
                const sender = yield msg.getContact();
                const isFromBot = sender.id._serialized === this.botJid;
                return {
                    isValid: !isFromBot,
                    type: 'private',
                    cleanMessage: msg.body
                };
            }
            // Si es un grupo, verificar mención
            const mentionedIds = yield this.getMentionedIds(msg);
            const isBotMentioned = (mentionedIds === null || mentionedIds === void 0 ? void 0 : mentionedIds.some(id => {
                const normalizedId = id.endsWith('@c.us') ? id : id + '@c.us';
                return normalizedId === this.botJid;
            })) || false;
            return {
                isValid: isBotMentioned,
                type: 'group',
                cleanMessage: this.removeMentions(msg.body)
            };
        });
    }
    getMentionedIds(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Intentar obtener menciones del mensaje
                if (msg.mentionedIds && msg.mentionedIds.length > 0) {
                    // Asegurarse de que los IDs estén en formato @c.us
                    return msg.mentionedIds.map(id => {
                        const cleanId = id.toString().split('@')[0];
                        return cleanId + '@c.us';
                    });
                }
                // Extraer menciones del texto usando regex
                const mentions = msg.body.match(/@(\d+)/g);
                if (mentions) {
                    return mentions.map(mention => {
                        const cleanId = mention.substring(1); // Remover el @
                        return cleanId + '@c.us';
                    });
                }
                return [];
            }
            catch (error) {
                console.error('Error getting mentioned IDs:', error);
                return null;
            }
        });
    }
    removeMentions(text) {
        // Eliminar solo la primera mención (que normalmente es el bot)
        // pero mantener las demás menciones, especialmente para comandos como "rango"
        const firstMentionRemoved = text.replace(/@[\d\w]+/, '').trim();
        // Si el texto comienza con "rango", evitar eliminar las menciones restantes
        if (firstMentionRemoved.startsWith('rango')) {
            return firstMentionRemoved;
        }
        // Para otros comandos, eliminar todas las menciones como antes
        return text.replace(/@[\d\w]+/g, '').trim();
    }
    getCleanMessage(msg) {
        const text = msg.body || '';
        return this.removeMentions(text);
    }
}
exports.MessageValidation = MessageValidation;
