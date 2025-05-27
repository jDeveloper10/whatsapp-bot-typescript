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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const errorHandler_1 = __importDefault(require("./errorHandler"));
const intentParser_1 = require("../utils/intentParser");
const messageValidation_1 = require("../utils/messageValidation");
const rankService_1 = __importDefault(require("../services/rankService"));
const config_1 = require("../config/config");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const reminderService_1 = __importDefault(require("../services/reminderService"));
const geminiService_1 = require("../services/geminiService");
class CommandHandler {
    constructor(client) {
        this.saludos = ['hola', 'hi', 'hello', 'ola', 'hey', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches'];
        this.agradecimientos = ['gracias', 'thanks', 'thank you', 'ty', 'thx', 'muchas gracias', 'te agradezco'];
        this.client = client;
        this.commands = new Map();
        this.commandsPath = path.join(__dirname, '..', 'commands');
        this.loadCommands();
        this.intentParser = new intentParser_1.IntentParser(Array.from(this.commands.keys()));
        this.messageValidation = new messageValidation_1.MessageValidation(client);
        this.reminderService = new reminderService_1.default(client);
        client.on('ready', () => {
            if (client.info.wid) {
                console.log('Setting bot JID from:', client.info.wid._serialized);
                this.messageValidation.setBotJid(client.info.wid._serialized);
            }
            else {
                console.error('Could not get bot WID from client info');
            }
        });
    }
    loadCommands() {
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
            }
            catch (error) {
                console.error(`Error al cargar el comando desde ${file}:`, error);
            }
        }
    }
    isAdmin(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chat = yield msg.getChat();
                if (!chat.isGroup)
                    return false;
                const contact = yield msg.getContact();
                const participantId = contact.id._serialized;
                // Verificar si es el admin principal
                if (contact.number === config_1.config.admin)
                    return true;
                // Verificar si está en la lista de admins
                const adminList = config_1.config.adminNumbers || [];
                if (adminList.includes(contact.number))
                    return true;
                // Verificar si es admin del grupo
                const groupChat = chat;
                const participant = groupChat.participants.find(p => p.id._serialized === participantId);
                return (participant === null || participant === void 0 ? void 0 : participant.isAdmin) || (participant === null || participant === void 0 ? void 0 : participant.isSuperAdmin) || false;
            }
            catch (error) {
                console.error('Error al verificar admin:', error);
                return false;
            }
        });
    }
    validateCommand(command) {
        return (command &&
            typeof command.name === 'string' &&
            typeof command.description === 'string' &&
            typeof command.execute === 'function' &&
            (command.adminOnly === undefined || typeof command.adminOnly === 'boolean'));
    }
    handleGreetingAndThanks(msg, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            const lowerMessage = validation.cleanMessage.toLowerCase().trim();
            // Manejar saludos en chat privado
            if (validation.type === 'private' &&
                (this.saludos.includes(lowerMessage) ||
                    this.saludos.some(saludo => lowerMessage.startsWith(saludo + ' ')))) {
                yield msg.reply("¿Qué necesitas?");
                yield this.sendCommandList(msg);
                return true;
            }
            // Manejar agradecimientos (tanto en privado como en grupos)
            if (this.agradecimientos.some(thanks => lowerMessage === thanks ||
                lowerMessage.includes(` ${thanks} `) ||
                lowerMessage.startsWith(`${thanks} `) ||
                lowerMessage.endsWith(` ${thanks}`))) {
                yield msg.reply("¡De nada! Estoy aquí para ayudarte. 😊");
                return true;
            }
            return false;
        });
    }
    sendCommandList(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let userCommands = [];
            let adminCommands = [];
            for (const [name, command] of this.commands) {
                if (command.adminOnly) {
                    adminCommands.push(name);
                }
                else {
                    userCommands.push(name);
                }
            }
            let menuText = '*Generales:*\n';
            userCommands.forEach(cmdName => menuText += `▫️ *${cmdName}*\n`);
            menuText += '\n*Admin:*\n';
            adminCommands.forEach(cmdName => menuText += `👑 *${cmdName}*\n`);
            menuText += '\nPara detalles: "@bot como uso [comando]"';
            yield msg.reply(menuText);
        });
    }
    handleMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = yield this.messageValidation.isValidMessage(msg);
                if (!validation.isValid)
                    return;
                console.log('Processing message:', {
                    type: validation.type,
                    cleanMessage: validation.cleanMessage,
                    messageType: msg.type
                });
                // Registrar actividad del usuario
                try {
                    const sender = yield msg.getContact();
                    const userId = sender.id.user;
                    const chat = yield msg.getChat();
                    const groupId = chat.isGroup ? chat.id._serialized : null;
                    rankService_1.default.incrementUserMessageCount(userId, groupId || undefined);
                }
                catch (error) {
                    console.error('Error al registrar actividad del usuario:', error);
                }
                // Manejar saludos y agradecimientos
                if (yield this.handleGreetingAndThanks(msg, validation))
                    return;
                // Si el mensaje está vacío
                if (!validation.cleanMessage.trim()) {
                    const helpMessage = validation.type === 'group'
                        ? "¿En qué puedo ayudarte? Mencióname y escribe 'ayuda' para ver los comandos disponibles."
                        : "¡Hola! Escribe 'ayuda' para ver los comandos disponibles.";
                    yield msg.reply(helpMessage);
                    return;
                }
                // Procesar comando
                const intentResult = this.intentParser.analyzeIntent(validation.cleanMessage);
                if (intentResult.command) {
                    const command = this.commands.get(intentResult.command);
                    if (command) {
                        yield command.execute(msg, [validation.cleanMessage]);
                        return;
                    }
                }
                // Si no es comando, usa Gemini para responder
                try {
                    const geminiResponse = yield geminiService_1.GeminiService.generateResponse(validation.cleanMessage);
                    if (geminiResponse) {
                        yield msg.reply(geminiResponse);
                    }
                    else {
                        yield msg.reply("No entendí qué comando deseas ejecutar. Escribe \"ayuda\" para ver la lista de comandos disponibles.");
                    }
                }
                catch (error) {
                    console.error('Error al obtener respuesta de Gemini:', error);
                    yield msg.reply("Ocurrió un error al procesar tu mensaje con la IA.");
                }
            }
            catch (error) {
                console.error('Error en handleMessage:', error);
                yield errorHandler_1.default.handleError(error, { message: msg });
            }
        });
    }
    executeCommand(commandName, msg, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this.commands.get(commandName);
            if (!command)
                return;
            try {
                yield command.execute(msg, args);
            }
            catch (error) {
                const finalError = error instanceof Error ? error : new Error(String(error));
                yield errorHandler_1.default.handleError(finalError, { message: msg });
            }
        });
    }
    transcribeAudio(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Iniciando transcripción de audio:', filePath);
                const formData = new form_data_1.default();
                formData.append('audio', fs.createReadStream(filePath));
                console.log('Enviando audio al servidor de transcripción...');
                const response = yield axios_1.default.post('http://localhost:5005/transcribe', formData, {
                    headers: formData.getHeaders(),
                    maxBodyLength: Infinity
                });
                console.log('Transcripción recibida:', response.data);
                return response.data.text;
            }
            catch (error) {
                console.error('Error en transcripción:', error);
                throw error;
            }
        });
    }
    reloadCommands() {
        this.commands.clear();
        this.loadCommands();
        this.intentParser = new intentParser_1.IntentParser(Array.from(this.commands.keys()));
    }
}
exports.default = (client) => new CommandHandler(client);
