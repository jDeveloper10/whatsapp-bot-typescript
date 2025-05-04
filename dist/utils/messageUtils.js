"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageUtils = void 0;
class MessageUtils {
    static formatCommand(command, description, usage) {
        let formatted = `*${command}*: ${description}`;
        if (usage) {
            formatted += `\nUsage: ${usage}`;
        }
        return formatted;
    }
    static formatList(items) {
        return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    }
    static formatError(message) {
        return `❌ Error: ${message}`;
    }
    static formatSuccess(message) {
        return `✅ ${message}`;
    }
    static isValidNumber(number) {
        // Basic validation for international phone numbers
        return /^\d{10,15}$/.test(number.replace(/\D/g, ''));
    }
}
exports.MessageUtils = MessageUtils;
