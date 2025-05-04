import { Message } from 'whatsapp-web.js';
import { parseTimeExpression, formatTimeToHuman } from '../utils/timeUtils';

const recordatorio: WhatsAppBot.Command = {
    name: 'recordatorio',
    description: 'Programa un recordatorio con el formato: !recordatorio <tiempo> <mensaje>. ' +
        'Tiempo puede ser en formato: 1m, 2h, 1d, 1h30m, etc.',

    async execute(msg: Message, args: string[]): Promise<void> {
        // Verificar si hay suficientes argumentos
        if (args.length < 2) {
            await msg.reply('❌ Formato incorrecto. Usa: !recordatorio <tiempo> <mensaje>\n' +
                'Ejemplo: !recordatorio 30m Reunión de equipo\n' +
                'Formatos de tiempo: 1m (1 minuto), 2h (2 horas), 1d (1 día), ' +
                '1h30m (1 hora y 30 minutos)');
            return;
        }

        // Extraer el tiempo y el mensaje
        const timeExpression = args[0];
        const reminderMessage = args.slice(1).join(' ');

        // Convertir la expresión de tiempo a milisegundos
        const timeInMs = parseTimeExpression(timeExpression);

        if (timeInMs === null) {
            await msg.reply('❌ Formato de tiempo inválido. Usa formatos como 1m, 2h, 1d, 1h30m');
            return;
        }

        // Verificar que el tiempo no sea excesivamente largo (máximo 30 días)
        const MAX_TIME = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
        if (timeInMs > MAX_TIME) {
            await msg.reply('❌ El tiempo máximo para un recordatorio es de 30 días.');
            return;
        }

        // Verificar que el tiempo no sea muy corto (mínimo 1 minuto)
        const MIN_TIME = 60 * 1000; // 1 minuto en ms
        if (timeInMs < MIN_TIME) {
            await msg.reply('❌ El tiempo mínimo para un recordatorio es de 1 minuto.');
            return;
        }

        // Obtener información del remitente para el recordatorio
        const chat = await msg.getChat();
        const humanReadableTime = formatTimeToHuman(timeInMs);

        // Confirmar la creación del recordatorio
        await msg.reply(`⏰ Recordatorio programado en ${humanReadableTime}:\n"${reminderMessage}"`);

        // Establecer el temporizador para el recordatorio
        setTimeout(async () => {
            try {
                // Verificar si el chat sigue siendo válido antes de enviar
                const currentChat = await msg.getChat();
                if (currentChat) {
                    await msg.reply(`⏰ *RECORDATORIO*\n\n${reminderMessage}`);
                }
            } catch (error) {
                console.error('Error al enviar recordatorio:', error);
            }
        }, timeInMs);
    }
};

export default recordatorio;