import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { config } from './config/config';
import createCommandHandler from './handlers/commandHandler';
import * as fs from 'fs';
import * as path from 'path';
import { initCoursePromoService } from './services/coursePromoService';
import { setWhatsappClient } from './commands/promover';
import express from 'express';
import * as QRCode from 'qrcode';

// Initialize WhatsApp client with required configurations
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let lastQr: string | null = null;

// Servidor Express para mostrar el QR
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    if (!lastQr) {
        return res.send('<h2>QR no generado aún. Espera unos segundos y recarga.</h2>');
    }
    const qrImage = await QRCode.toDataURL(lastQr);
    res.send(`
      <h2>Escanea este QR para iniciar sesión en WhatsApp Web:</h2>
      <img src="${qrImage}" />
    `);
});

app.listen(PORT, () => {
    console.log(`Web de QR disponible en http://localhost:${PORT} o en Railway en el puerto asignado.`);
});

// QR Code generation event
client.on('qr', (qr) => {
    lastQr = qr;
    qrcode.generate(qr, { small: true });
    console.log('QR Code generado. Escanéalo en la web pública de Railway o en local.');
});

// Ready event
client.on('ready', () => {
    console.log('Client is ready!');
    console.log('Bot Info:', client.info);

    // Pasar la referencia del cliente al comando promover cuando esté listo
    setWhatsappClient(client);
    console.log('Cliente de WhatsApp configurado para el comando promover');

    // Inicializar servicio de promoción de cursos
    const coursePromoService = initCoursePromoService(client);
    if (config.promoGroups.length > 0) {
        coursePromoService.setTargetGroups(config.promoGroups);
        coursePromoService.setInterval(config.promoInterval);
        coursePromoService.startPromotions();
        console.log(`Servicio de promoción de cursos iniciado. Intervalo: ${config.promoInterval / 60000} minutos`);
        console.log(`Grupos objetivo: ${config.promoGroups.join(', ')}`);
    } else {
        console.log('Servicio de promoción de cursos: No se han configurado grupos objetivo.');
    }
});

// Inicializar el manejador de comandos
const commandHandler = createCommandHandler(client);

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
client.on('group-participant-join', async (notification) => {
    try {
        console.log('Nuevo participante detectado');
        const group = await notification.getChat();
        const participant = await notification.getRecipient();
        console.log('Grupo:', group.name);
        console.log('Participante:', participant.id.user);

        const welcomeMsg = `¡Bienvenid@ @${participant.id.user} al grupo! 🎉\n\n` +
            `Como ${roles.roles.miembro.name}, estas son las reglas que debemos seguir:\n` +
            roles.roles.miembro.rules.map((rule: string, index: number) => `${index + 1}. ${rule}`).join('\n') +
            `\n\n¡Esperamos que disfrutes y contribuyas positivamente al grupo! 🌟`;

        console.log('Intentando enviar mensaje de bienvenida...');
        // Formato de mención actualizado
        const mentions = [participant.id._serialized];
        const sent = await group.sendMessage(welcomeMsg, {
            mentions: mentions
        });
        console.log('Mensaje de bienvenida enviado:', sent);
    } catch (error: any) {
        console.error('Error detallado en evento group-participant-join:', error);
        if (error && typeof error === 'object' && 'stack' in error) {
            console.error('Stack trace:', error.stack);
        }
    }
});

// Evento cuando alguien sale del grupo
client.on('group-participant-leave', async (notification) => {
    try {
        console.log('Participante saliente detectado');
        const group = await notification.getChat();
        const participant = await notification.getRecipient();
        console.log('Grupo:', group.name);
        console.log('Participante que salió:', participant.id.user);

        const goodbyeMsg = `¡Adiós @${participant.id.user}! 👋\n\n` +
            `Ha decidido dejarnos. ¡Le deseamos lo mejor en su camino! 🌈`;

        console.log('Intentando enviar mensaje de despedida...');
        // Formato de mención actualizado
        const mentions = [participant.id._serialized];
        const sent = await group.sendMessage(goodbyeMsg, {
            mentions: mentions
        });
        console.log('Mensaje de despedida enviado:', sent);
    } catch (error: any) {
        console.error('Error detallado en evento group-participant-leave:', error);
        if (error && typeof error === 'object' && 'stack' in error) {
            console.error('Stack trace:', error.stack);
        }
    }
});

// Message event with extended error handling
client.on('message', async (msg) => {
    try {
        console.log('New message received:', {
            from: msg.from,
            body: msg.body,
            isGroup: msg.from?.endsWith('@g.us'),
            hasMedia: msg.hasMedia,
            type: msg.type
        });

        await commandHandler.handleMessage(msg);
    } catch (error) {
        console.error('Error in message handler:', error);
    }
});

// Mejorar detección de eventos de grupo
client.on('group_update', async (notification) => {
    console.log('Actualización de grupo detectada:', notification);
});

// Inicializar el cliente
console.log('Inicializando cliente de WhatsApp...');
client.initialize().catch(err => {
    console.error('Error al inicializar el cliente:', err);
});