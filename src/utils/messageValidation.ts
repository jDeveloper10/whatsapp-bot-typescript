import { Message, Client } from 'whatsapp-web.js';

export class MessageValidation {
    private readonly client: Client;
    private botJid: string | null = null;

    constructor(client: Client) {
        this.client = client;
    }

    public setBotJid(jid: string) {
        this.botJid = jid.split('@')[0] + '@c.us';
        console.log('Bot JID set to:', this.botJid);
    }

    public async isValidMessage(msg: Message): Promise<{
        isValid: boolean;
        type: 'private' | 'group';
        cleanMessage: string;
    }> {
        const isGroup = msg.from?.endsWith('@g.us') || false;
        const type = isGroup ? 'group' : 'private';

        console.log('Message validation:', {
            from: msg.from,
            body: msg.body,
            type: type,
            isGroup: isGroup
        });

        // Si es un mensaje privado, simplemente validar que no sea del bot
        if (!isGroup) {
            const sender = await msg.getContact();
            const isFromBot = sender.id._serialized === this.botJid;

            return {
                isValid: !isFromBot,
                type: 'private',
                cleanMessage: msg.body
            };
        }

        // Si es un grupo, verificar mención
        const mentionedIds = await this.getMentionedIds(msg);
        const isBotMentioned = mentionedIds?.some(id => {
            const normalizedId = id.endsWith('@c.us') ? id : id + '@c.us';
            return normalizedId === this.botJid;
        }) || false;

        return {
            isValid: isBotMentioned,
            type: 'group',
            cleanMessage: this.removeMentions(msg.body)
        };
    }

    public async getMentionedIds(msg: Message): Promise<string[] | null> {
        try {
            // Intentar obtener menciones del mensaje
            if (msg.mentionedIds && msg.mentionedIds.length > 0) {
                // Asegurarse de que los IDs estén en formato @c.us
                return msg.mentionedIds.map(id => {
                    const cleanId = id.toString().split('@')[0];
                    return cleanId + '@c.us';
                });
            }

            // Extraer menciones del texto usando regex
            const mentions = msg.body.match(/@(\d+)/g);
            if (mentions) {
                return mentions.map(mention => {
                    const cleanId = mention.substring(1); // Remover el @
                    return cleanId + '@c.us';
                });
            }

            return [];
        } catch (error) {
            console.error('Error getting mentioned IDs:', error);
            return null;
        }
    }

    public removeMentions(text: string): string {
        // Eliminar solo la primera mención (que normalmente es el bot)
        // pero mantener las demás menciones, especialmente para comandos como "rango"
        const firstMentionRemoved = text.replace(/@[\d\w]+/, '').trim();

        // Si el texto comienza con "rango", evitar eliminar las menciones restantes
        if (firstMentionRemoved.startsWith('rango')) {
            return firstMentionRemoved;
        }

        // Para otros comandos, eliminar todas las menciones como antes
        return text.replace(/@[\d\w]+/g, '').trim();
    }

    public getCleanMessage(msg: Message): string {
        const text = msg.body || '';
        return this.removeMentions(text);
    }
}