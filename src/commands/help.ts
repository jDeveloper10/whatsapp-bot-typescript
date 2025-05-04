import { Message } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';

const command: WhatsAppBot.Command = {
    name: 'ayuda',
    description: 'Muestra comandos disponibles',
    adminOnly: false,
    execute: async (msg: Message, args: string[]) => {
        const commandsPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

        let userCommands = [];
        let adminCommands = [];

        // Clasificar los comandos
        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file)).default;
                if (command.adminOnly) {
                    adminCommands.push(command.name);
                } else {
                    userCommands.push(command.name);
                }
            } catch (error) {
                console.error(`Error loading command from ${file}:`, error);
            }
        }

        let menuText = '*Generales:*\n';

        // Mostrar comandos de usuario
        for (const cmdName of userCommands) {
            menuText += `▫️ *${cmdName}*\n`;
        }

        // Mostrar comandos de administrador
        menuText += '\n*Admin:*\n';
        for (const cmdName of adminCommands) {
            menuText += `👑 *${cmdName}*\n`;
        }

        menuText += '\nPara detalles: "@bot como uso [comando]"';

        await msg.reply(menuText);
    }
};

export default command;