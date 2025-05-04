import { Message } from 'whatsapp-web.js';
import { getCoursePromoService } from '../services/coursePromoService';

const command: WhatsAppBot.Command = {
    name: 'cursos',
    description: 'Muestra información sobre los cursos disponibles en la comunidad',
    adminOnly: false,
    execute: async (msg: Message, args: string[]) => {
        try {
            const courseService = getCoursePromoService();
            if (!courseService) {
                await msg.reply('❌ El servicio de cursos no está disponible en este momento.');
                return;
            }

            const chat = await msg.getChat();
            const courses = courseService.getCourseList();

            // Si se menciona un curso específico
            if (args.length > 0) {
                const searchTerm = args.join(' ').toLowerCase();
                const course = courses.find(c => c.name.toLowerCase().includes(searchTerm));

                if (course) {
                    // Promocionar el curso específico en este chat
                    const success = await courseService.promoteSpecificCourse(course.name, chat.id._serialized);
                    if (!success) {
                        await msg.reply(`❌ No se pudo obtener información sobre el curso de ${args.join(' ')}.`);
                    }
                    return;
                } else {
                    await msg.reply(`❌ No se encontró un curso con el nombre "${args.join(' ')}".`);
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

            await msg.reply(courseListMessage);

        } catch (error) {
            console.error('Error al mostrar los cursos:', error);
            await msg.reply('❌ Ocurrió un error al obtener la información de los cursos.');
        }
    }
};

export default command;