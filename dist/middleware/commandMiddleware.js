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
exports.validateCommand = validateCommand;
exports.requireAdmin = requireAdmin;
const config_1 = require("../config/config");
function validateCommand(msg, next) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if message is from allowed group (if configured)
        if (config_1.config.allowedGroups.length > 0) {
            const chat = yield msg.getChat();
            if (chat.isGroup && !config_1.config.allowedGroups.includes(chat.id._serialized)) {
                return; // Silently ignore commands from unauthorized groups
            }
        }
        yield next();
    });
}
function requireAdmin(msg, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const contact = yield msg.getContact();
        const number = contact.number;
        if (!config_1.config.adminNumbers.includes(number)) {
            yield msg.reply('❌ This command requires admin privileges.');
            return;
        }
        yield next();
    });
}
