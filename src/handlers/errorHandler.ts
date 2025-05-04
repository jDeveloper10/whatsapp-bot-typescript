import { Message } from 'whatsapp-web.js';
import { config } from '../config/config';

class ErrorHandler {
    async handleError(error: Error, context?: { message?: Message }) {
        console.error('Error occurred:', error);

        // Log error details
        this.logError(error);

        // If error occurred in message context, notify user
        if (context?.message) {
            try {
                await context.message.reply('Lo siento, ocurrió un error al procesar tu comando. Por favor, intenta nuevamente.');
            } catch (replyError) {
                console.error('Error al enviar mensaje de error:', replyError);
            }
        }

        // Notify admins if configured
        await this.notifyAdmins(error);
    }

    private logError(error: Error) {
        // Add your logging logic here
        // For example, write to file or send to logging service
        console.error('[ERROR]', {
            timestamp: new Date().toISOString(),
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    }

    private async notifyAdmins(error: Error) {
        // Implement admin notification logic here
        // For example, send message to admin numbers configured in .env
        if (config.adminNumbers.length > 0) {
            // Add your notification logic here
            console.log('Would notify admins:', config.adminNumbers);
        }
    }
}

export default new ErrorHandler();