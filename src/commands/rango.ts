import { Message, GroupChat } from 'whatsapp-web.js';
import rankService from '../services/rankService';

const command: WhatsAppBot.Command = {
    name: 'rango',
    description: 'Muestra tu rango actual o el de otro usuario mencionado',
    adminOnly: false,
    execute: async (msg: Message, args: string[]) => {
        try {
            const sender = await msg.getContact();
            let targetUserId = sender.id.user;
            let targetName = sender.pushname || sender.id.user;
            let isMentioned = false;

            console.log(`Comando rango ejecutado por: ${sender.id.user}, menciones: ${msg.mentionedIds?.length || 0}`);

            // Si hay al menos 2 menciones (el bot + otro usuario)
            // La primera mención es típicamente el bot, la segunda es el usuario objetivo
            if (msg.mentionedIds && msg.mentionedIds.length > 1) {
                // La segunda mención es el usuario cuyo rango queremos consultar
                const mentionedId = msg.mentionedIds[1];
                targetUserId = mentionedId.toString().split('@')[0];
                targetName = targetUserId; // Nombre predeterminado es el ID
                isMentioned = true;

                console.log(`Usuario mencionado detectado: ${targetUserId}`);

                // Intentar obtener más información sobre el usuario mencionado
                try {
                    const chat = await msg.getChat();
                    if (chat.isGroup) {
                        const groupChat = chat as GroupChat;
                        const participants = groupChat.participants || [];

                        for (const participant of participants) {
                            if (participant.id._serialized === mentionedId.toString()) {
                                if (participant.id.user) {
                                    targetUserId = participant.id.user;
                                }
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error obteniendo detalles del usuario mencionado:', error);
                }
            }
            // Si hay respuesta a un mensaje, consultar el rango de ese usuario
            else if (msg.hasQuotedMsg) {
                try {
                    const quotedMsg = await msg.getQuotedMessage();
                    const quotedContact = await quotedMsg.getContact();
                    targetUserId = quotedContact.id.user;
                    targetName = quotedContact.pushname || targetUserId;
                    isMentioned = true;
                    console.log(`Mensaje citado, consultando rango de: ${targetUserId}`);
                } catch (error) {
                    console.error('Error obteniendo contacto del mensaje citado:', error);
                }
            }
            // Si no hay segunda mención ni mensaje citado, mostramos el rango del emisor
            else {
                console.log(`Sin menciones adicionales, mostrando rango propio: ${targetUserId}`);
                isMentioned = false;
            }

            // Obtener el rango del usuario objetivo
            const userRank = rankService.getUserRank(targetUserId);
            const messageCount = rankService.getUserMessageCount(targetUserId);

            if (!userRank) {
                await msg.reply(`No hay registro de actividad para ${isMentioned ? `el usuario ${targetName}` : 'ti'}.`);
                return;
            }

            // Crear mensaje informativo
            let rankMessage = '';
            if (isMentioned) {
                rankMessage = `*Rango de ${targetName}:* ${userRank.rank.emoji} ${userRank.rank.name}\n`;
            } else {
                rankMessage = `*Tu rango actual:* ${userRank.rank.emoji} ${userRank.rank.name}\n`;
            }

            rankMessage += `*Mensajes totales:* ${messageCount}\n`;

            // Información sobre el próximo rango
            const nextRank = rankService.getNextRank(userRank.rankKey);
            if (nextRank) {
                const messagesLeft = nextRank.minMessages - messageCount;
                rankMessage += `\n*Próximo rango:* ${nextRank.emoji} ${nextRank.name}\n`;
                rankMessage += `*Mensajes necesarios:* ${messagesLeft} más`;
            } else {
                rankMessage += "\n*¡Felicidades!* Ha alcanzado el rango máximo. 👑";
            }

            await msg.reply(rankMessage);
        } catch (error) {
            console.error('Error al obtener el rango:', error);
            await msg.reply('❌ Ocurrió un error al obtener la información de rango.');
        }
    }
};

export default command;

