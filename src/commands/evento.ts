import { Message, GroupParticipant, GroupChat } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    creator: string;
    creatorName: string;  // Store creator name when creating event
    groupId: string;
    reminderSent: boolean;
}

const EVENTS_FILE = path.join(__dirname, '..', 'data', 'events.json');

// Asegurar que el archivo de eventos existe
if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2));
}

const command: WhatsAppBot.Command = {
    name: 'evento',
    description: 'Gestiona eventos del grupo (reuniones, sesiones de código, etc)',
    groupOnly: true,
    execute: async (msg: Message, args: string[]) => {
        if (!args.length) {
            await msg.reply(
                '📅 *Gestor de Eventos*\n\n' +
                '▫️ *crear <fecha> <hora> <título>*\n' +
                'Crea un nuevo evento\n' +
                'Ejemplo: crear 2024-05-20 18:00 "Sesión de JavaScript"\n\n' +
                '▫️ *lista*\n' +
                'Muestra los próximos eventos\n\n' +
                '▫️ *info <id>*\n' +
                'Muestra detalles de un evento\n\n' +
                '▫️ *borrar <id>*\n' +
                'Elimina un evento (solo creador o admin)'
            );
            return;
        }

        const events: Event[] = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
        const action = args[0].toLowerCase();
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            await msg.reply('❌ Este comando solo puede usarse en grupos');
            return;
        }

        try {
            switch (action) {
                case 'crear':
                    if (args.length < 4) {
                        await msg.reply('❌ Uso: crear <fecha> <hora> <título>');
                        return;
                    }

                    const date = args[1];
                    const time = args[2];
                    const title = args.slice(3).join(' ');

                    // Validar formato de fecha y hora
                    const eventDate = new Date(`${date} ${time}`);
                    if (isNaN(eventDate.getTime())) {
                        await msg.reply('❌ Formato de fecha u hora inválido');
                        return;
                    }

                    const contact = await msg.getContact();
                    const id = Date.now().toString(36);

                    events.push({
                        id,
                        title,
                        description: '',
                        date,
                        time,
                        creator: contact.id._serialized,
                        creatorName: contact.pushname || 'Desconocido',
                        groupId: chat.id._serialized,
                        reminderSent: false
                    });

                    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
                    await msg.reply(
                        `✅ *Evento creado*\n\n` +
                        `📅 Fecha: ${date}\n` +
                        `⏰ Hora: ${time}\n` +
                        `📝 ${title}\n` +
                        `🆔 ID: ${id}`
                    );
                    break;

                case 'lista':
                    const groupEvents = events
                        .filter(e => e.groupId === chat.id._serialized)
                        .filter(e => new Date(`${e.date} ${e.time}`) >= new Date());

                    if (!groupEvents.length) {
                        await msg.reply('❌ No hay eventos programados');
                        return;
                    }

                    const eventList = groupEvents
                        .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
                        .map(e =>
                            `📅 *${e.title}*\n` +
                            `📆 ${e.date} ⏰ ${e.time}\n` +
                            `👤 Por: ${e.creatorName}\n` +
                            `🆔 ${e.id}\n`
                        ).join('\n');

                    await msg.reply(`*Próximos Eventos:*\n\n${eventList}`);
                    break;

                case 'info':
                    const eventId = args[1];
                    const event = events.find(e => e.id === eventId && e.groupId === chat.id._serialized);

                    if (!event) {
                        await msg.reply('❌ Evento no encontrado');
                        return;
                    }

                    await msg.reply(
                        `*🎯 ${event.title}*\n\n` +
                        `📅 Fecha: ${event.date}\n` +
                        `⏰ Hora: ${event.time}\n` +
                        `👤 Creador: ${event.creatorName}\n` +
                        `🆔 ID: ${event.id}`
                    );
                    break;

                case 'borrar':
                    const deleteId = args[1];
                    const eventToDelete = events.find(e => e.id === deleteId && e.groupId === chat.id._serialized);

                    if (!eventToDelete) {
                        await msg.reply('❌ Evento no encontrado');
                        return;
                    }

                    const sender = await msg.getContact();
                    // Verificar si el usuario es participante del grupo
                    const groupChat = await msg.getChat() as GroupChat;
                    const participants = groupChat.participants;
                    const senderParticipant = participants.find((p: GroupParticipant) =>
                        p.id._serialized === sender.id._serialized
                    );
                    const isAdmin = senderParticipant?.isAdmin || senderParticipant?.isSuperAdmin;

                    if (eventToDelete.creator !== sender.id._serialized && !isAdmin) {
                        await msg.reply('❌ Solo el creador del evento o un admin puede borrarlo');
                        return;
                    }

                    const eventIndex = events.findIndex(e => e.id === deleteId);
                    events.splice(eventIndex, 1);
                    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
                    await msg.reply('✅ Evento eliminado correctamente');
                    break;

                default:
                    await msg.reply('❌ Acción no válida');
            }
        } catch (error) {
            console.error('Error in event command:', error);
            await msg.reply('❌ Error al procesar el comando');
        }
    }
};

export default command;