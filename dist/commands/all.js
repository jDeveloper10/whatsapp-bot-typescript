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
const config_1 = require("../config/config");
const command = {
    name: 'all',
    description: 'Menciona a todos los participantes del grupo',
    groupOnly: true,
    adminOnly: true,
    execute: (msg) => __awaiter(void 0, void 0, void 0, function* () {
        const chat = yield msg.getChat();
        if (!chat.isGroup) {
            yield msg.reply('❌ Este comando solo puede usarse en grupos.');
            return;
        }
        const groupChat = chat;
        const sender = yield msg.getContact();
        // Verificar si es admin
        if (!config_1.config.adminNumbers.includes(sender.number)) {
            yield msg.reply('❌ Solo los administradores pueden usar este comando');
            return;
        }
        // Obtener todos los participantes del grupo
        const participants = yield groupChat.participants;
        // Crear el mensaje con las menciones invisibles
        let message = '';
        const mentions = [];
        for (const participant of participants) {
            message += '‎'; // Usar un carácter invisible
            mentions.push(participant.id._serialized);
        }
        // Enviar el mensaje con las menciones
        yield chat.sendMessage(message, { mentions });
    })
};
exports.default = command;
