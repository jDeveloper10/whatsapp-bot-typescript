/// <reference path="../types/global.d.ts" />
import { Message, Client, GroupChat } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';
import errorHandler from './errorHandler';
import { IntentParser } from '../utils/intentParser';
import { MessageValidation } from '../utils/messageValidation';
import rankService from '../services/rankService';
import { config } from '../config/config';
import axios from 'axios';
import FormData from 'form-data';
import ReminderService from '../services/reminderService';
import { GeminiService } from '../services/geminiService';

class CommandHandler {
    private commands: Map<string, WhatsAppBot.Command>;
    private readonly commandsPath: string;
    private intentParser: IntentParser;
    private messageValidation: MessageValidation;
    private readonly client: Client;
    private readonly saludos = ['hola', 'hi', 'hello', 'ola', 'hey', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches'];
    private readonly agradecimientos = ['gracias', 'thanks', 'thank you', 'ty', 'thx', 'muchas gracias', 'te agradezco'];
    private reminderService: ReminderService;

    constructor(client: Client) {
        this.client = client;
        this.commands = new Map();
        this.commandsPath = path.join(__dirname, '..', 'commands');
        this.loadCommands();
        this.intentParser = new IntentParser(Array.from(this.commands.keys()));
        this.messageValidation = new MessageValidation(client);
        this.reminderService = new ReminderService(client);

        client.on('ready', () => {
            if (client.info.wid) {
                console.log('Setting bot JID from:', client.info.wid._serialized);
                this.messageValidation.setBotJid(client.info.wid._serialized);
            } else {
                console.error('Could not get bot WID from client info');
            }
        });
    }

    private loadCommands() {
        if (!fs.existsSync(this.commandsPath)) {
            console.error('¡Directorio de comandos no encontrado!');
            return;
        }

        const commandFiles = fs.readdirSync(this.commandsPath)
            .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(this.commandsPath, file);
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath).default;

                if (!this.validateCommand(command)) {
                    console.error(`Estructura de comando inválida en el archivo ${file}`);
                    continue;
                }

                this.commands.set(command.name, command);
                console.log(`Comando cargado: ${command.name}`);
            } catch (error) {
                console.error(`Error al cargar el comando desde ${file}:`, error);
            }
        }
    }

    private async isAdmin(msg: Message): Promise<boolean> {
        try {
            const chat = await msg.getChat();
            if (!chat.isGroup) return false;

            const contact = await msg.getContact();
            const participantId = contact.id._serialized;

            // Verificar si es el admin principal
            if (contact.number === config.admin) return true;

            // Verificar si está en la lista de admins
            const adminList = config.adminNumbers || [];
            if (adminList.includes(contact.number)) return true;

            // Verificar si es admin del grupo
            const groupChat = chat as GroupChat;
            const participant = groupChat.participants.find(p => p.id._serialized === participantId);
            return participant?.isAdmin || participant?.isSuperAdmin || false;

        } catch (error) {
            console.error('Error al verificar admin:', error);
            return false;
        }
    }

    private validateCommand(command: any): command is WhatsAppBot.Command {
        return (
            command &&
            typeof command.name === 'string' &&
            typeof command.description === 'string' &&
            typeof command.execute === 'function' &&
            (command.adminOnly === undefined || typeof command.adminOnly === 'boolean')
        );
    }

    private async handleGreetingAndThanks(msg: Message, validation: any): Promise<boolean> {
        const lowerMessage = validation.cleanMessage.toLowerCase().trim();

        // Manejar saludos en chat privado
        if (validation.type === 'private' &&
            (this.saludos.includes(lowerMessage) ||
                this.saludos.some(saludo => lowerMessage.startsWith(saludo + ' ')))) {
            await msg.reply("¿Qué necesitas?");
            await this.sendCommandList(msg);
            return true;
        }

        // Manejar agradecimientos (tanto en privado como en grupos)
        if (this.agradecimientos.some(thanks =>
            lowerMessage === thanks ||
            lowerMessage.includes(` ${thanks} `) ||
            lowerMessage.startsWith(`${thanks} `) ||
            lowerMessage.endsWith(` ${thanks}`))) {
            await msg.reply("¡De nada! Estoy aquí para ayudarte. 😊");
            return true;
        }

        return false;
    }

    private async sendCommandList(msg: Message) {
        let userCommands = [];
        let adminCommands = [];

        for (const [name, command] of this.commands) {
            if (command.adminOnly) {
                adminCommands.push(name);
            } else {
                userCommands.push(name);
            }
        }

        let menuText = '*Generales:*\n';
        userCommands.forEach(cmdName => menuText += `▫️ *${cmdName}*\n`);

        menuText += '\n*Admin:*\n';
        adminCommands.forEach(cmdName => menuText += `👑 *${cmdName}*\n`);

        menuText += '\nPara detalles: "@bot como uso [comando]"';

        await msg.reply(menuText);
    }

    async handleMessage(msg: Message): Promise<void> {
        try {
            const validation = await this.messageValidation.isValidMessage(msg);
            if (!validation.isValid) return;

            console.log('Processing message:', {
                type: validation.type,
                cleanMessage: validation.cleanMessage,
                messageType: msg.type
            });

            // Registrar actividad del usuario
            try {
                const sender = await msg.getContact();
                const userId = sender.id.user;
                const chat = await msg.getChat();
                const groupId = chat.isGroup ? chat.id._serialized : null;
                rankService.incrementUserMessageCount(userId, groupId || undefined);
            } catch (error) {
                console.error('Error al registrar actividad del usuario:', error);
            }

            // Manejar saludos y agradecimientos
            if (await this.handleGreetingAndThanks(msg, validation)) return;

            // Si el mensaje está vacío
            if (!validation.cleanMessage.trim()) {
                const helpMessage = validation.type === 'group'
                    ? "¿En qué puedo ayudarte? Mencióname y escribe 'ayuda' para ver los comandos disponibles."
                    : "¡Hola! Escribe 'ayuda' para ver los comandos disponibles.";
                await msg.reply(helpMessage);
                return;
            }

            // Procesar comando
            const intentResult = this.intentParser.analyzeIntent(validation.cleanMessage);
            
            if (intentResult.command) {
                const command = this.commands.get(intentResult.command);
                if (command) {
                    await command.execute(msg, [validation.cleanMessage]);
                    return;
                }
            }

            // Si no es comando, usa Gemini para responder
            try {
                const geminiResponse = await GeminiService.generateResponse(validation.cleanMessage);
                if (geminiResponse) {
                    await msg.reply(geminiResponse);
                } else {
                    await msg.reply("No entendí qué comando deseas ejecutar. Escribe \"ayuda\" para ver la lista de comandos disponibles.");
                }
            } catch (error) {
                console.error('Error al obtener respuesta de Gemini:', error);
                await msg.reply("Ocurrió un error al procesar tu mensaje con la IA.");
            }
        } catch (error) {
            console.error('Error en handleMessage:', error);
            await errorHandler.handleError(error as Error, { message: msg });
        }
    }

    private async executeCommand(commandName: string, msg: Message, args: string[]) {
        const command = this.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(msg, args);
        } catch (error) {
            const finalError = error instanceof Error ? error : new Error(String(error));
            await errorHandler.handleError(finalError, { message: msg });
        }
    }

    private async transcribeAudio(filePath: string): Promise<string> {
        try {
            console.log('Iniciando transcripción de audio:', filePath);
            const formData = new FormData();
            formData.append('audio', fs.createReadStream(filePath));
            console.log('Enviando audio al servidor de transcripción...');
            const response = await axios.post('http://localhost:5005/transcribe', formData, {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity
            });
            console.log('Transcripción recibida:', response.data);
            return response.data.text;
        } catch (error) {
            console.error('Error en transcripción:', error);
            throw error;
        }
    }

    reloadCommands() {
        this.commands.clear();
        this.loadCommands();
        this.intentParser = new IntentParser(Array.from(this.commands.keys()));
    }
}

export default (client: Client) => new CommandHandler(client);