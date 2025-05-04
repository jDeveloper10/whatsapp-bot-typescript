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
    name: 'group',
    description: 'Administra los grupos donde el bot puede ser usado',
    adminOnly: true,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        const sender = yield msg.getContact();
        const chat = yield msg.getChat();
        // Verificar si es admin antes de todo
        if (!config_1.config.adminNumbers.includes(sender.number)) {
            yield msg.reply('❌ Solo los administradores pueden usar este comando');
            return;
        }
        // Si es un chat privado, mostrar ayuda especial para admins
        if (!chat.isGroup) {
            yield msg.reply('📱 *Gestión de Grupos - Ayuda para Admins*\n\n' +
                'Para usar este comando, debes estar en el grupo que deseas gestionar.\n\n' +
                '*Comandos disponibles en grupos:*\n' +
                '▫️ group allow - Permite el uso del bot en el grupo\n' +
                '▫️ group deny - Deshabilita el bot en el grupo\n\n' +
                'ℹ️ Recuerda que debes mencionar al bot (@bot) cuando uses estos comandos en los grupos.');
            return;
        }
        if (!args[0]) {
            yield msg.reply('📱 *Gestión del Grupo Actual*\n\n' +
                'Comandos disponibles:\n' +
                '▫️ group allow - Permite el uso del bot\n' +
                '▫️ group deny - Deshabilita el bot\n\n' +
                `Estado actual: ${config_1.config.allowedGroups.includes(chat.id._serialized) ? '✅ Permitido' : '❌ No permitido'}`);
            return;
        }
        const action = args[0].toLowerCase();
        const groupId = chat.id._serialized;
        if (action === 'allow') {
            if (config_1.config.allowedGroups.includes(groupId)) {
                yield msg.reply('❌ Este grupo ya está permitido');
                return;
            }
            // Aquí implementarías la persistencia
            yield msg.reply('✅ Grupo permitido correctamente');
        }
        else if (action === 'deny') {
            if (!config_1.config.allowedGroups.includes(groupId)) {
                yield msg.reply('❌ Este grupo no estaba permitido');
                return;
            }
            // Aquí implementarías la persistencia
            yield msg.reply('✅ Grupo removido de la lista de permitidos');
        }
        else {
            yield msg.reply('❌ Acción inválida. Usa "allow" o "deny"');
        }
    })
};
exports.default = command;
