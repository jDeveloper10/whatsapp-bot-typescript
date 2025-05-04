import { Message } from 'whatsapp-web.js';
import { config } from '../config/config';

export async function validateCommand(msg: Message, next: () => Promise<void>) {
    // Check if message is from allowed group (if configured)
    if (config.allowedGroups.length > 0) {
        const chat = await msg.getChat();
        if (chat.isGroup && !config.allowedGroups.includes(chat.id._serialized)) {
            return; // Silently ignore commands from unauthorized groups
        }
    }

    await next();
}

export async function requireAdmin(msg: Message, next: () => Promise<void>) {
    const contact = await msg.getContact();
    const number = contact.number;

    if (!config.adminNumbers.includes(number)) {
        await msg.reply('❌ This command requires admin privileges.');
        return;
    }

    await next();
}