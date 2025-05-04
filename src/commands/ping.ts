import { Message } from 'whatsapp-web.js';
import { measureResponseTime, formatResponseTime } from '../utils/timeUtils';

const command: WhatsAppBot.Command = {
    name: 'estado',
    description: 'Muestra el estado del bot y su tiempo de respuesta',
    adminOnly: false,
    execute: async (msg: Message, args: string[]) => {
        const [, responseTime] = await measureResponseTime(async () => {
            await msg.reply('✅ Bot activo y funcionando');
        });

        await msg.reply(`⚡ Tiempo de respuesta: ${formatResponseTime(responseTime)}`);
    }
};

export default command;