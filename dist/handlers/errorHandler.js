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
class ErrorHandler {
    handleError(error, context) {
        return __awaiter(this, void 0, void 0, function* () {
            console.error('Error occurred:', error);
            // Log error details
            this.logError(error);
            // If error occurred in message context, notify user
            if (context === null || context === void 0 ? void 0 : context.message) {
                try {
                    yield context.message.reply('Lo siento, ocurrió un error al procesar tu comando. Por favor, intenta nuevamente.');
                }
                catch (replyError) {
                    console.error('Error al enviar mensaje de error:', replyError);
                }
            }
            // Notify admins if configured
            yield this.notifyAdmins(error);
        });
    }
    logError(error) {
        // Add your logging logic here
        // For example, write to file or send to logging service
        console.error('[ERROR]', {
            timestamp: new Date().toISOString(),
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    }
    notifyAdmins(error) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implement admin notification logic here
            // For example, send message to admin numbers configured in .env
            if (config_1.config.adminNumbers.length > 0) {
                // Add your notification logic here
                console.log('Would notify admins:', config_1.config.adminNumbers);
            }
        });
    }
}
exports.default = new ErrorHandler();
