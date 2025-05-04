import { Message } from 'whatsapp-web.js';
import { config } from '../config/config';

const command: WhatsAppBot.Command = {
    name: 'group',
    description: 'Administra los grupos donde el bot puede ser usado',
    adminOnly: true,
    execute: async (msg: Message, args: string[]) => {
        const sender = await msg.getContact();
        const chat = await msg.getChat();

        // Verificar si es admin antes de todo
        if (!config.adminNumbers.includes(sender.number)) {
            await msg.reply('❌ Solo los administradores pueden usar este comando');
            return;
        }

        // Si es un chat privado, mostrar ayuda especial para admins
        if (!chat.isGroup) {
            await msg.reply(
                '📱 *Gestión de Grupos - Ayuda para Admins*\n\n' +
                'Para usar este comando, debes estar en el grupo que deseas gestionar.\n\n' +
                '*Comandos disponibles en grupos:*\n' +
                '▫️ group allow - Permite el uso del bot en el grupo\n' +
                '▫️ group deny - Deshabilita el bot en el grupo\n\n' +
                'ℹ️ Recuerda que debes mencionar al bot (@bot) cuando uses estos comandos en los grupos.'
            );
            return;
        }

        if (!args[0]) {
            await msg.reply(
                '📱 *Gestión del Grupo Actual*\n\n' +
                'Comandos disponibles:\n' +
                '▫️ group allow - Permite el uso del bot\n' +
                '▫️ group deny - Deshabilita el bot\n\n' +
                `Estado actual: ${config.allowedGroups.includes(chat.id._serialized) ? '✅ Permitido' : '❌ No permitido'}`
            );
            return;
        }

        const action = args[0].toLowerCase();
        const groupId = chat.id._serialized;

        if (action === 'allow') {
            if (config.allowedGroups.includes(groupId)) {
                await msg.reply('❌ Este grupo ya está permitido');
                return;
            }
            // Aquí implementarías la persistencia
            await msg.reply('✅ Grupo permitido correctamente');
        } else if (action === 'deny') {
            if (!config.allowedGroups.includes(groupId)) {
                await msg.reply('❌ Este grupo no estaba permitido');
                return;
            }
            // Aquí implementarías la persistencia
            await msg.reply('✅ Grupo removido de la lista de permitidos');
        } else {
            await msg.reply('❌ Acción inválida. Usa "allow" o "deny"');
        }
    }
};

export default command;