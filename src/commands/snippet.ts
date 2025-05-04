import { Message } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';

interface CodeSnippet {
    id: string;
    language: string;
    code: string;
    description: string;
    author: string;
    date: string;
}

const SNIPPETS_FILE = path.join(__dirname, '..', 'data', 'snippets.json');

// Asegurar que el archivo de snippets existe
if (!fs.existsSync(SNIPPETS_FILE)) {
    fs.writeFileSync(SNIPPETS_FILE, JSON.stringify([], null, 2));
}

const command: WhatsAppBot.Command = {
    name: 'codigo',
    description: 'Guarda y comparte fragmentos de código. Usa: codigo <agregar/lista/ver/buscar> [params]',
    execute: async (msg: Message, args: string[]) => {
        if (!args.length) {
            await msg.reply(
                '📝 *Uso del comando codigo:*\n\n' +
                '▫️ *agregar <lenguaje> <descripción>*\n' +
                'Responde a un mensaje con código para guardarlo\n\n' +
                '▫️ *lista [lenguaje]*\n' +
                'Muestra todos los códigos o filtra por lenguaje\n\n' +
                '▫️ *ver <id>*\n' +
                'Muestra un código específico\n\n' +
                '▫️ *buscar <término>*\n' +
                'Busca códigos por descripción\n\n' +
                'Ejemplo: codigo agregar javascript "Función para ordenar array"'
            );
            return;
        }

        const action = args[0].toLowerCase();
        const snippets: CodeSnippet[] = JSON.parse(fs.readFileSync(SNIPPETS_FILE, 'utf8'));

        try {
            switch (action) {
                case 'agregar':
                case 'add':
                    if (!msg.hasQuotedMsg) {
                        await msg.reply('❌ Debes responder a un mensaje que contenga el código');
                        return;
                    }

                    const quotedMsg = await msg.getQuotedMessage();
                    const language = args[1]?.toLowerCase();
                    const description = args.slice(2).join(' ');

                    if (!language || !description) {
                        await msg.reply('❌ Especifica el lenguaje y la descripción');
                        return;
                    }

                    const id = Date.now().toString(36);
                    const author = (await msg.getContact()).pushname || 'Anónimo';

                    snippets.push({
                        id,
                        language,
                        code: quotedMsg.body,
                        description,
                        author,
                        date: new Date().toISOString()
                    });

                    fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(snippets, null, 2));
                    await msg.reply(`✅ Código guardado con ID: ${id}`);
                    break;

                case 'lista':
                case 'list':
                    const filterLang = args[1]?.toLowerCase();
                    const filtered = filterLang
                        ? snippets.filter(s => s.language === filterLang)
                        : snippets;

                    if (!filtered.length) {
                        await msg.reply('❌ No hay códigos guardados');
                        return;
                    }

                    const list = filtered.map(s =>
                        `📎 *ID:* ${s.id}\n` +
                        `📝 *${s.description}*\n` +
                        `💻 ${s.language} | 👤 ${s.author}\n`
                    ).join('\n');

                    await msg.reply(`*Códigos Disponibles:*\n\n${list}`);
                    break;

                case 'ver':
                case 'get':
                    const snippetId = args[1];
                    const snippet = snippets.find(s => s.id === snippetId);

                    if (!snippet) {
                        await msg.reply('❌ Código no encontrado');
                        return;
                    }

                    const response =
                        `📝 *${snippet.description}*\n` +
                        `👤 Autor: ${snippet.author}\n` +
                        `💻 Lenguaje: ${snippet.language}\n` +
                        `📅 Fecha: ${new Date(snippet.date).toLocaleDateString()}\n\n` +
                        '\`\`\`' + snippet.language + '\n' +
                        snippet.code + '\n' +
                        '\`\`\`';

                    await msg.reply(response);
                    break;

                case 'buscar':
                case 'search':
                    const searchTerm = args.slice(1).join(' ').toLowerCase();
                    const results = snippets.filter(s =>
                        s.description.toLowerCase().includes(searchTerm) ||
                        s.language.toLowerCase().includes(searchTerm)
                    );

                    if (!results.length) {
                        await msg.reply('❌ No se encontraron códigos');
                        return;
                    }

                    const searchResults = results.map(s =>
                        `📎 *ID:* ${s.id}\n` +
                        `📝 *${s.description}*\n` +
                        `💻 ${s.language} | 👤 ${s.author}\n`
                    ).join('\n');

                    await msg.reply(`*Resultados de búsqueda:*\n\n${searchResults}`);
                    break;

                default:
                    await msg.reply('❌ Comando no válido. Usa "codigo" para ver las opciones disponibles.');
            }
        } catch (error) {
            console.error('Error en comando codigo:', error);
            await msg.reply('❌ Error al procesar el comando');
        }
    }
};

export default command;