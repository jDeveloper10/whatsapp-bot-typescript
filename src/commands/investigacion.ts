import { Message, MessageMedia } from 'whatsapp-web.js';
import { SearchUtils } from '../utils/searchUtils';

const command: WhatsAppBot.Command = {
    name: 'investigacion',
    description: 'Busca información e imágenes sobre un tema',
    execute: async (msg: Message, args: string[]) => {
        if (!args.length) {
            await msg.reply('❌ Por favor, especifica qué quieres investigar.\nEjemplo: investigacion ballenas azules');
            return;
        }

        const searchQuery = args.join(' ');
        await msg.reply('🔍 Buscando información sobre: ' + searchQuery);

        try {
            // Buscar información en Wikipedia
            const wikiResult = await SearchUtils.searchWikipedia(searchQuery);

            // Buscar imagen relacionada
            const imageUrl = await SearchUtils.searchImage(searchQuery);
            console.log('Image URL found:', imageUrl);

            if (!wikiResult && !imageUrl) {
                await msg.reply('❌ No se encontró información sobre ese tema.');
                return;
            }

            // Si encontramos una imagen, enviarla primero
            if (imageUrl) {
                try {
                    console.log('Downloading image from:', imageUrl);
                    const media = await MessageMedia.fromUrl(imageUrl, {
                        unsafeMime: true,
                        filename: `${searchQuery.replace(/[^a-z0-9]/gi, '_')}.jpg`
                    });
                    console.log('Image downloaded, mime type:', media.mimetype);

                    // Enviar la imagen con un mensaje descriptivo
                    await msg.reply(media, undefined, {
                        caption: `🖼️ Imagen relacionada a: ${searchQuery}`
                    });
                } catch (error) {
                    console.error('Error sending image:', error);
                    await msg.reply('⚠️ No se pudo cargar la imagen, pero continuaré con la información...');
                }
            }

            // Enviar la información encontrada
            if (wikiResult) {
                let response = `📚 *${wikiResult.title}*\n\n`;
                response += wikiResult.extract;

                // Acortar el texto si es muy largo
                if (response.length > 1000) {
                    response = response.substring(0, 997) + '...';
                }

                response += '\n\n_Fuente: Wikipedia_';
                await msg.reply(response);
            }
        } catch (error) {
            console.error('Error en el comando de investigación:', error);
            await msg.reply('❌ Ocurrió un error al buscar la información.');
        }
    }
};

export default command;