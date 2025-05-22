"use strict";
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
exports.setWhatsappClient = setWhatsappClient;
const config_1 = require("../config/config");
const coursePromoService_1 = require("../services/coursePromoService");
// Variable para almacenar la referencia al cliente
let whatsappClient = null;
// Función para establecer la referencia al cliente
function setWhatsappClient(client) {
    whatsappClient = client;
}
const command = {
    name: 'promover',
    description: 'Envía promociones de cursos a los grupos seleccionados [Solo Admin]',
    adminOnly: false,
    privateOnly: true,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Verificar que sea un administrador
            const sender = yield msg.getContact();
            const isAdmin = config_1.config.adminNumbers.includes(sender.number) ||
                sender.number === config_1.config.admin ||
                `${sender.id.user}` === config_1.config.admin;
            console.log(`Comando promover ejecutado por: ${sender.number || sender.id.user}, es admin: ${isAdmin}`);
            if (!isAdmin) {
                yield msg.reply('❌ Solo los administradores pueden usar este comando.');
                return;
            }
            // Obtener el servicio de promoción de cursos
            const courseService = (0, coursePromoService_1.getCoursePromoService)();
            if (!courseService) {
                yield msg.reply('❌ El servicio de promoción de cursos no está disponible.');
                return;
            }
            // Verificar que tenemos acceso al cliente de WhatsApp
            if (!whatsappClient) {
                yield msg.reply('❌ No se puede acceder al cliente de WhatsApp. Reporta este error al desarrollador.');
                return;
            }
            // Obtener todos los grupos donde está el bot
            const chats = yield whatsappClient.getChats();
            const groups = chats.filter(chat => chat.isGroup);
            // Si no hay grupos, informar
            if (groups.length === 0) {
                yield msg.reply('❌ El bot no está en ningún grupo actualmente.');
                return;
            }
            // Asignar un ID temporal a cada grupo para selección fácil
            const groupMap = new Map();
            groups.forEach((group, index) => {
                groupMap.set((index + 1).toString(), group);
            });
            // Mostrar opciones si no hay argumentos
            if (!args.length) {
                // Listar todos los grupos
                let groupListMessage = '*📋 GRUPOS DISPONIBLES*\n\n';
                groups.forEach((group, index) => {
                    groupListMessage += `${index + 1}. ${group.name} (${group.id._serialized})\n`;
                });
                groupListMessage += '\n*🔄 OPCIONES DE PROMOCIÓN*\n\n';
                groupListMessage += '• *promover todos random* - Envía promoción aleatoria a todos los grupos\n';
                groupListMessage += '• *promover [número-grupo] random* - Envía promoción aleatoria al grupo seleccionado\n';
                // Listar cursos disponibles
                const courses = courseService.getCourseList();
                groupListMessage += '\n*📚 CURSOS DISPONIBLES*\n';
                courses.forEach((course, index) => {
                    groupListMessage += `• *${course.name.split(' ')[0].toLowerCase()}* - ${course.name}\n`;
                });
                groupListMessage += '\n*EJEMPLOS:*\n';
                groupListMessage += '• *promover 1 javascript* - Promocionar JavaScript en el grupo 1\n';
                groupListMessage += '• *promover 2,3,4 godot* - Promocionar Godot en los grupos 2, 3 y 4\n';
                groupListMessage += '• *promover todos firebase* - Promocionar Firebase en todos los grupos';
                yield msg.reply(groupListMessage);
                return;
            }
            // Analizar argumentos
            let targetGroups = [];
            let courseToPromote = null;
            // Si el primer argumento es "todos", seleccionar todos los grupos
            if (args[0].toLowerCase() === 'todos') {
                targetGroups = groups;
                if (args.length > 1) {
                    courseToPromote = args[1].toLowerCase();
                }
                else {
                    courseToPromote = 'random';
                }
            }
            else {
                // Verificar si el primer argumento es una lista de números de grupo
                const groupNumbers = args[0].split(',');
                const selectedGroups = [];
                // Validar cada número de grupo
                for (const num of groupNumbers) {
                    if (groupMap.has(num)) {
                        selectedGroups.push(groupMap.get(num));
                    }
                    else {
                        yield msg.reply(`❌ El grupo número ${num} no es válido. Usa "promover" sin argumentos para ver la lista de grupos.`);
                        return;
                    }
                }
                targetGroups = selectedGroups;
                if (args.length > 1) {
                    courseToPromote = args[1].toLowerCase();
                }
                else {
                    courseToPromote = 'random';
                }
            }
            // Si no hay grupos seleccionados, mostrar error
            if (targetGroups.length === 0) {
                yield msg.reply('❌ No se seleccionó ningún grupo válido. Usa "promover" sin argumentos para ver la lista de grupos.');
                return;
            }
            // Si la opción es aleatoria
            if (courseToPromote === 'random' || courseToPromote === 'aleatorio') {
                yield msg.reply(`⏳ Enviando promoción aleatoria a ${targetGroups.length} grupo(s)...`);
                let successCount = 0;
                for (const group of targetGroups) {
                    try {
                        // Seleccionar un curso aleatorio
                        const courses = courseService.getCourseList();
                        const randomCourse = courses[Math.floor(Math.random() * courses.length)];
                        // Enviar la promoción
                        yield courseService.promoteSpecificCourse(randomCourse.name, group.id._serialized);
                        successCount++;
                    }
                    catch (err) {
                        console.error(`Error enviando promoción al grupo ${group.name}:`, err);
                    }
                }
                yield msg.reply(`✅ Promoción aleatoria enviada exitosamente a ${successCount} de ${targetGroups.length} grupos.`);
                return;
            }
            // Buscar curso específico para promocionar
            const courses = courseService.getCourseList();
            const matchingCourse = courses.find(course => course.name.toLowerCase().includes(courseToPromote || ''));
            if (matchingCourse) {
                yield msg.reply(`⏳ Enviando promoción de "${matchingCourse.name}" a ${targetGroups.length} grupo(s)...`);
                let successCount = 0;
                for (const group of targetGroups) {
                    try {
                        yield courseService.promoteSpecificCourse(matchingCourse.name, group.id._serialized);
                        successCount++;
                    }
                    catch (err) {
                        console.error(`Error enviando promoción al grupo ${group.name}:`, err);
                    }
                }
                yield msg.reply(`✅ Promoción de "${matchingCourse.name}" enviada exitosamente a ${successCount} de ${targetGroups.length} grupos.`);
            }
            else {
                yield msg.reply(`❌ No se encontró un curso con el nombre "${courseToPromote}". Usa "promover" sin argumentos para ver las opciones disponibles.`);
            }
        }
        catch (error) {
            console.error('Error al ejecutar comando promover:', error);
            yield msg.reply('❌ Ocurrió un error al ejecutar el comando de promoción.');
        }
    })
};
exports.default = command;
