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
const coursePromoService_1 = require("../services/coursePromoService");
const command = {
    name: 'cursos',
    description: 'Muestra información sobre los cursos disponibles en la comunidad',
    adminOnly: false,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const courseService = (0, coursePromoService_1.getCoursePromoService)();
            if (!courseService) {
                yield msg.reply('❌ El servicio de cursos no está disponible en este momento.');
                return;
            }
            const chat = yield msg.getChat();
            const courses = courseService.getCourseList();
            // Si se menciona un curso específico
            if (args.length > 0) {
                const searchTerm = args.join(' ').toLowerCase();
                const course = courses.find(c => c.name.toLowerCase().includes(searchTerm));
                if (course) {
                    // Promocionar el curso específico en este chat
                    const success = yield courseService.promoteSpecificCourse(course.name, chat.id._serialized);
                    if (!success) {
                        yield msg.reply(`❌ No se pudo obtener información sobre el curso de ${args.join(' ')}.`);
                    }
                    return;
                }
                else {
                    yield msg.reply(`❌ No se encontró un curso con el nombre "${args.join(' ')}".`);
                    // Continuar y mostrar la lista completa como fallback
                }
            }
            // Mostrar la lista completa de cursos disponibles
            let courseListMessage = `*📚 CURSOS DISPONIBLES EN LA COMUNIDAD*\n\n`;
            courses.forEach((course, index) => {
                courseListMessage += `${index + 1}. ${course.emoji} *${course.name}*\n`;
            });
            courseListMessage += `\nPara ver detalles de un curso específico, escribe:\n`;
            courseListMessage += `"@bot cursos [nombre del curso]"\n\n`;
            courseListMessage += `Ejemplo: @bot cursos JavaScript`;
            yield msg.reply(courseListMessage);
        }
        catch (error) {
            console.error('Error al mostrar los cursos:', error);
            yield msg.reply('❌ Ocurrió un error al obtener la información de los cursos.');
        }
    })
};
exports.default = command;
