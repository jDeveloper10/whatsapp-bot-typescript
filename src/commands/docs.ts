import { Message } from 'whatsapp-web.js';
import axios from 'axios';

const DOCS_URLS = {
    'js': 'https://developer.mozilla.org/api/v1/search',
    'python': 'https://docs.python.org/3/search.html',
    'php': 'https://www.php.net/manual-lookup.php',
    // Agregar más lenguajes según sea necesario
};

const command: WhatsAppBot.Command = {
    name: 'documentacion',
    description: 'Busca documentación sobre un tema específico',
    execute: async (msg: Message, args: string[]) => {
        if (!args.length) {
            await msg.reply(
                '📚 *Comando Documentación*\n\n' +
                'Uso: documentacion <tema a buscar>\n' +
                'Ejemplo: documentacion javascript array map'
            );
            return;
        }

        const query = args.join(' ');
        try {
            let resultText = '';

            await msg.reply('🔍 Buscando documentación sobre: ' + query);

            const language = args[0].toLowerCase();
            const searchTerm = args.slice(1).join(' ');

            if (language === 'js') {
                const response = await axios.get(DOCS_URLS.js, {
                    params: {
                        q: searchTerm,
                        locale: 'es'
                    }
                });

                if (response.data.documents && response.data.documents.length > 0) {
                    const doc = response.data.documents[0];
                    resultText = `📚 *Documentación JavaScript*\n\n` +
                        `*${doc.title}*\n` +
                        `${doc.excerpt}\n\n` +
                        `🔗 ${doc.mdn_url}`;
                }
            } else if (language === 'python') {
                resultText = `📚 *Documentación Python*\n\n` +
                    `Para buscar "${searchTerm}" visita:\n` +
                    `https://docs.python.org/3/search.html?q=${encodeURIComponent(searchTerm)}`;
            } else if (language === 'php') {
                resultText = `📚 *Documentación PHP*\n\n` +
                    `Para buscar "${searchTerm}" visita:\n` +
                    `https://www.php.net/manual-lookup.php?pattern=${encodeURIComponent(searchTerm)}`;
            } else {
                await msg.reply('❌ Lenguaje no soportado. Usa: js, python o php');
                return;
            }

            await msg.reply(resultText || '❌ No se encontraron resultados');
        } catch (error) {
            console.error('Error en comando documentacion:', error);
            await msg.reply('❌ Error al buscar la documentación');
        }
    }
};

export default command;