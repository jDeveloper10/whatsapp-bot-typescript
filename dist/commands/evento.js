"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const EVENTS_FILE = path.join(__dirname, '..', 'data', 'events.json');
// Asegurar que el archivo de eventos existe
if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2));
}
const command = {
    name: 'evento',
    description: 'Gestiona eventos del grupo (reuniones, sesiones de código, etc)',
    groupOnly: true,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        if (!args.length) {
            yield msg.reply('📅 *Gestor de Eventos*\n\n' +
                '▫️ *crear <fecha> <hora> <título>*\n' +
                'Crea un nuevo evento\n' +
                'Ejemplo: crear 2024-05-20 18:00 "Sesión de JavaScript"\n\n' +
                '▫️ *lista*\n' +
                'Muestra los próximos eventos\n\n' +
                '▫️ *info <id>*\n' +
                'Muestra detalles de un evento\n\n' +
                '▫️ *borrar <id>*\n' +
                'Elimina un evento (solo creador o admin)');
            return;
        }
        const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
        const action = args[0].toLowerCase();
        const chat = yield msg.getChat();
        if (!chat.isGroup) {
            yield msg.reply('❌ Este comando solo puede usarse en grupos');
            return;
        }
        try {
            switch (action) {
                case 'crear':
                    if (args.length < 4) {
                        yield msg.reply('❌ Uso: crear <fecha> <hora> <título>');
                        return;
                    }
                    const date = args[1];
                    const time = args[2];
                    const title = args.slice(3).join(' ');
                    // Validar formato de fecha y hora
                    const eventDate = new Date(`${date} ${time}`);
                    if (isNaN(eventDate.getTime())) {
                        yield msg.reply('❌ Formato de fecha u hora inválido');
                        return;
                    }
                    const contact = yield msg.getContact();
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
                    yield msg.reply(`✅ *Evento creado*\n\n` +
                        `📅 Fecha: ${date}\n` +
                        `⏰ Hora: ${time}\n` +
                        `📝 ${title}\n` +
                        `🆔 ID: ${id}`);
                    break;
                case 'lista':
                    const groupEvents = events
                        .filter(e => e.groupId === chat.id._serialized)
                        .filter(e => new Date(`${e.date} ${e.time}`) >= new Date());
                    if (!groupEvents.length) {
                        yield msg.reply('❌ No hay eventos programados');
                        return;
                    }
                    const eventList = groupEvents
                        .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
                        .map(e => `📅 *${e.title}*\n` +
                        `📆 ${e.date} ⏰ ${e.time}\n` +
                        `👤 Por: ${e.creatorName}\n` +
                        `🆔 ${e.id}\n`).join('\n');
                    yield msg.reply(`*Próximos Eventos:*\n\n${eventList}`);
                    break;
                case 'info':
                    const eventId = args[1];
                    const event = events.find(e => e.id === eventId && e.groupId === chat.id._serialized);
                    if (!event) {
                        yield msg.reply('❌ Evento no encontrado');
                        return;
                    }
                    yield msg.reply(`*🎯 ${event.title}*\n\n` +
                        `📅 Fecha: ${event.date}\n` +
                        `⏰ Hora: ${event.time}\n` +
                        `👤 Creador: ${event.creatorName}\n` +
                        `🆔 ID: ${event.id}`);
                    break;
                case 'borrar':
                    const deleteId = args[1];
                    const eventToDelete = events.find(e => e.id === deleteId && e.groupId === chat.id._serialized);
                    if (!eventToDelete) {
                        yield msg.reply('❌ Evento no encontrado');
                        return;
                    }
                    const sender = yield msg.getContact();
                    // Verificar si el usuario es participante del grupo
                    const groupChat = yield msg.getChat();
                    const participants = groupChat.participants;
                    const senderParticipant = participants.find((p) => p.id._serialized === sender.id._serialized);
                    const isAdmin = (senderParticipant === null || senderParticipant === void 0 ? void 0 : senderParticipant.isAdmin) || (senderParticipant === null || senderParticipant === void 0 ? void 0 : senderParticipant.isSuperAdmin);
                    if (eventToDelete.creator !== sender.id._serialized && !isAdmin) {
                        yield msg.reply('❌ Solo el creador del evento o un admin puede borrarlo');
                        return;
                    }
                    const eventIndex = events.findIndex(e => e.id === deleteId);
                    events.splice(eventIndex, 1);
                    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
                    yield msg.reply('✅ Evento eliminado correctamente');
                    break;
                default:
                    yield msg.reply('❌ Acción no válida');
            }
        }
        catch (error) {
            console.error('Error in event command:', error);
            yield msg.reply('❌ Error al procesar el comando');
        }
    })
};
exports.default = command;
