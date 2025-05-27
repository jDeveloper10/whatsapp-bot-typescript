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
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const config_1 = require("./config/config");
const commandHandler_1 = __importDefault(require("./handlers/commandHandler"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const coursePromoService_1 = require("./services/coursePromoService");
const promover_1 = require("./commands/promover");
const express_1 = __importDefault(require("express"));
const QRCode = __importStar(require("qrcode"));
// Initialize WhatsApp client with required configurations
const client = new whatsapp_web_js_1.Client({
    authStrategy: new whatsapp_web_js_1.LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});
let lastQr = null;
// Servidor Express para mostrar el QR
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!lastQr) {
        return res.send('<h2>QR no generado aún. Espera unos segundos y recarga.</h2>');
    }
    const qrImage = yield QRCode.toDataURL(lastQr);
    res.send(`
      <h2>Escanea este QR para iniciar sesión en WhatsApp Web:</h2>
      <img src="${qrImage}" />
    `);
}));
app.listen(PORT, () => {
    console.log(`Web de QR disponible en http://localhost:${PORT} o en Railway en el puerto asignado.`);
});
// QR Code generation event
client.on('qr', (qr) => {
    lastQr = qr;
    qrcode_terminal_1.default.generate(qr, { small: true });
    console.log('QR Code generado. Escanéalo en la web pública de Railway o en local.');
});
// Ready event
client.on('ready', () => {
    console.log('Client is ready!');
    console.log('Bot Info:', client.info);
    // Pasar la referencia del cliente al comando promover cuando esté listo
    (0, promover_1.setWhatsappClient)(client);
    console.log('Cliente de WhatsApp configurado para el comando promover');
    // Inicializar servicio de promoción de cursos
    const coursePromoService = (0, coursePromoService_1.initCoursePromoService)(client);
    if (config_1.config.promoGroups.length > 0) {
        coursePromoService.setTargetGroups(config_1.config.promoGroups);
        coursePromoService.setInterval(config_1.config.promoInterval);
        coursePromoService.startPromotions();
        console.log(`Servicio de promoción de cursos iniciado. Intervalo: ${config_1.config.promoInterval / 60000} minutos`);
        console.log(`Grupos objetivo: ${config_1.config.promoGroups.join(', ')}`);
    }
    else {
        console.log('Servicio de promoción de cursos: No se han configurado grupos objetivo.');
    }
});
// Inicializar el manejador de comandos
const commandHandler = (0, commandHandler_1.default)(client);
// Authentication Failed event
client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});
// Disconnected event
client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});
// Cargar roles y reglas
const ROLES_FILE = path.join(__dirname, 'data', 'roles.json');
const roles = JSON.parse(fs.readFileSync(ROLES_FILE, 'utf8'));
// Evento cuando alguien se une al grupo
client.on('group-participant-join', (notification) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Nuevo participante detectado');
        const group = yield notification.getChat();
        const participant = yield notification.getRecipient();
        console.log('Grupo:', group.name);
        console.log('Participante:', participant.id.user);
        const welcomeMsg = `¡Bienvenid@ @${participant.id.user} al grupo! 🎉\n\n` +
            `Como ${roles.roles.miembro.name}, estas son las reglas que debemos seguir:\n` +
            roles.roles.miembro.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n') +
            `\n\n¡Esperamos que disfrutes y contribuyas positivamente al grupo! 🌟`;
        console.log('Intentando enviar mensaje de bienvenida...');
        // Formato de mención actualizado
        const mentions = [participant.id._serialized];
        const sent = yield group.sendMessage(welcomeMsg, {
            mentions: mentions
        });
        console.log('Mensaje de bienvenida enviado:', sent);
    }
    catch (error) {
        console.error('Error detallado en evento group-participant-join:', error);
        if (error && typeof error === 'object' && 'stack' in error) {
            console.error('Stack trace:', error.stack);
        }
    }
}));
// Evento cuando alguien sale del grupo
client.on('group-participant-leave', (notification) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Participante saliente detectado');
        const group = yield notification.getChat();
        const participant = yield notification.getRecipient();
        console.log('Grupo:', group.name);
        console.log('Participante que salió:', participant.id.user);
        const goodbyeMsg = `¡Adiós @${participant.id.user}! 👋\n\n` +
            `Ha decidido dejarnos. ¡Le deseamos lo mejor en su camino! 🌈`;
        console.log('Intentando enviar mensaje de despedida...');
        // Formato de mención actualizado
        const mentions = [participant.id._serialized];
        const sent = yield group.sendMessage(goodbyeMsg, {
            mentions: mentions
        });
        console.log('Mensaje de despedida enviado:', sent);
    }
    catch (error) {
        console.error('Error detallado en evento group-participant-leave:', error);
        if (error && typeof error === 'object' && 'stack' in error) {
            console.error('Stack trace:', error.stack);
        }
    }
}));
// Message event with extended error handling
client.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('New message received:', {
            from: msg.from,
            body: msg.body,
            isGroup: (_a = msg.from) === null || _a === void 0 ? void 0 : _a.endsWith('@g.us'),
            hasMedia: msg.hasMedia,
            type: msg.type
        });
        yield commandHandler.handleMessage(msg);
    }
    catch (error) {
        console.error('Error in message handler:', error);
    }
}));
// Mejorar detección de eventos de grupo
client.on('group_update', (notification) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Actualización de grupo detectada:', notification);
}));
// Inicializar el cliente
console.log('Inicializando cliente de WhatsApp...');
client.initialize().catch(err => {
    console.error('Error al inicializar el cliente:', err);
});
