import { Message } from 'whatsapp-web.js';
import { config } from '../config/config';

const command: WhatsAppBot.Command = {
    name: 'listadmins',
    description: 'Muestra la lista de administradores del bot',
    adminOnly: true,
    execute: async (msg: Message) => {
        const sender = await msg.getContact();
        if (!config.adminNumbers.includes(sender.number)) {
            await msg.reply('❌ Solo los administradores pueden usar este comando');
            return;
        }

        let response = '*👑 Lista de Administradores*\n\n';

        // Primero mostrar el admin principal
        response += `*Admin Principal:*\n▫️ ${config.admin}\n\n`;

        // Luego mostrar otros admins
        const otherAdmins = config.adminNumbers.filter(num => num !== config.admin);
        if (otherAdmins.length > 0) {
            response += '*Otros Administradores:*\n';
            otherAdmins.forEach(admin => {
                response += `▫️ ${admin}\n`;
            });
        }

        await msg.reply(response);
    }
};

export default command;