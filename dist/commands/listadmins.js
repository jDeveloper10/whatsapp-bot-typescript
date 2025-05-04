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
    name: 'listadmins',
    description: 'Muestra la lista de administradores del bot',
    adminOnly: true,
    execute: (msg) => __awaiter(void 0, void 0, void 0, function* () {
        const sender = yield msg.getContact();
        if (!config_1.config.adminNumbers.includes(sender.number)) {
            yield msg.reply('❌ Solo los administradores pueden usar este comando');
            return;
        }
        let response = '*👑 Lista de Administradores*\n\n';
        // Primero mostrar el admin principal
        response += `*Admin Principal:*\n▫️ ${config_1.config.admin}\n\n`;
        // Luego mostrar otros admins
        const otherAdmins = config_1.config.adminNumbers.filter(num => num !== config_1.config.admin);
        if (otherAdmins.length > 0) {
            response += '*Otros Administradores:*\n';
            otherAdmins.forEach(admin => {
                response += `▫️ ${admin}\n`;
            });
        }
        yield msg.reply(response);
    })
};
exports.default = command;
