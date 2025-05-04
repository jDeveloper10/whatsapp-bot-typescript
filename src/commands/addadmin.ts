import { Message } from 'whatsapp-web.js';
import { config } from '../config/config';

const command: WhatsAppBot.Command = {
    name: 'addadmin',
    description: 'Añade o remueve administradores del bot',
    adminOnly: true,
    execute: async (msg: Message, args: string[]) => {
        const sender = await msg.getContact();

        // Verificar si es el admin principal
        if (sender.number !== config.admin) {
            await msg.reply('❌ Solo el administrador principal puede usar este comando.');
            return;
        }

        if (!args[0] || !args[1]) {
            await msg.reply('❌ Uso: addadmin <add/remove> <número>');
            return;
        }

        const action = args[0].toLowerCase();
        const number = args[1].replace(/[^0-9]/g, '');

        if (!number) {
            await msg.reply('❌ Número inválido');
            return;
        }

        let adminList = [...config.adminNumbers];

        if (action === 'add') {
            if (adminList.includes(number)) {
                await msg.reply('❌ Este número ya es administrador');
                return;
            }
            adminList.push(number);
            await msg.reply(`✅ ${number} ha sido añadido como administrador`);
        } else if (action === 'remove') {
            if (number === config.admin) {
                await msg.reply('❌ No puedes remover al administrador principal');
                return;
            }
            if (!adminList.includes(number)) {
                await msg.reply('❌ Este número no es administrador');
                return;
            }
            adminList = adminList.filter(n => n !== number);
            await msg.reply(`✅ ${number} ha sido removido de administradores`);
        } else {
            await msg.reply('❌ Acción inválida. Usa "add" o "remove"');
            return;
        }

        // Aquí podrías implementar la persistencia de la lista de admins
    }
};

export default command;