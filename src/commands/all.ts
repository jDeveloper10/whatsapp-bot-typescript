import { Message, GroupChat } from 'whatsapp-web.js';
import { config } from '../config/config';

const command: WhatsAppBot.Command = {
    name: 'all',
    description: 'Menciona a todos los participantes del grupo',
    groupOnly: true,
    adminOnly: true,
    execute: async (msg: Message) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) {
            await msg.reply('❌ Este comando solo puede usarse en grupos.');
            return;
        }

        const groupChat = chat as GroupChat;
        const sender = await msg.getContact();

        // Verificar si es admin
        if (!config.adminNumbers.includes(sender.number)) {
            await msg.reply('❌ Solo los administradores pueden usar este comando');
            return;
        }

        // Obtener todos los participantes del grupo
        const participants = await groupChat.participants;

        // Crear el mensaje con las menciones invisibles
        let message = '';
        const mentions = [];

        for (const participant of participants) {
            message += '‎'; // Usar un carácter invisible
            mentions.push(participant.id._serialized);
        }

        // Enviar el mensaje con las menciones
        await chat.sendMessage(message, { mentions });
    }
};

export default command;