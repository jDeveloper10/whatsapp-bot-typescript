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
    name: 'addadmin',
    description: 'Añade o remueve administradores del bot',
    adminOnly: true,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        const sender = yield msg.getContact();
        // Verificar si es el admin principal
        if (sender.number !== config_1.config.admin) {
            yield msg.reply('❌ Solo el administrador principal puede usar este comando.');
            return;
        }
        if (!args[0] || !args[1]) {
            yield msg.reply('❌ Uso: addadmin <add/remove> <número>');
            return;
        }
        const action = args[0].toLowerCase();
        const number = args[1].replace(/[^0-9]/g, '');
        if (!number) {
            yield msg.reply('❌ Número inválido');
            return;
        }
        let adminList = [...config_1.config.adminNumbers];
        if (action === 'add') {
            if (adminList.includes(number)) {
                yield msg.reply('❌ Este número ya es administrador');
                return;
            }
            adminList.push(number);
            yield msg.reply(`✅ ${number} ha sido añadido como administrador`);
        }
        else if (action === 'remove') {
            if (number === config_1.config.admin) {
                yield msg.reply('❌ No puedes remover al administrador principal');
                return;
            }
            if (!adminList.includes(number)) {
                yield msg.reply('❌ Este número no es administrador');
                return;
            }
            adminList = adminList.filter(n => n !== number);
            yield msg.reply(`✅ ${number} ha sido removido de administradores`);
        }
        else {
            yield msg.reply('❌ Acción inválida. Usa "add" o "remove"');
            return;
        }
        // Aquí podrías implementar la persistencia de la lista de admins
    })
};
exports.default = command;
