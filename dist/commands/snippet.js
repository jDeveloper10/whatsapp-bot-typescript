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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SNIPPETS_FILE = path.join(__dirname, '..', 'data', 'snippets.json');
// Asegurar que el archivo de snippets existe
if (!fs.existsSync(SNIPPETS_FILE)) {
    fs.writeFileSync(SNIPPETS_FILE, JSON.stringify([], null, 2));
}
const command = {
    name: 'codigo',
    description: 'Guarda y comparte fragmentos de código. Usa: codigo <agregar/lista/ver/buscar> [params]',
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (!args.length) {
            yield msg.reply('📝 *Uso del comando codigo:*\n\n' +
                '▫️ *agregar <lenguaje> <descripción>*\n' +
                'Responde a un mensaje con código para guardarlo\n\n' +
                '▫️ *lista [lenguaje]*\n' +
                'Muestra todos los códigos o filtra por lenguaje\n\n' +
                '▫️ *ver <id>*\n' +
                'Muestra un código específico\n\n' +
                '▫️ *buscar <término>*\n' +
                'Busca códigos por descripción\n\n' +
                'Ejemplo: codigo agregar javascript "Función para ordenar array"');
            return;
        }
        const action = args[0].toLowerCase();
        const snippets = JSON.parse(fs.readFileSync(SNIPPETS_FILE, 'utf8'));
        try {
            switch (action) {
                case 'agregar':
                case 'add':
                    if (!msg.hasQuotedMsg) {
                        yield msg.reply('❌ Debes responder a un mensaje que contenga el código');
                        return;
                    }
                    const quotedMsg = yield msg.getQuotedMessage();
                    const language = (_a = args[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                    const description = args.slice(2).join(' ');
                    if (!language || !description) {
                        yield msg.reply('❌ Especifica el lenguaje y la descripción');
                        return;
                    }
                    const id = Date.now().toString(36);
                    const author = (yield msg.getContact()).pushname || 'Anónimo';
                    snippets.push({
                        id,
                        language,
                        code: quotedMsg.body,
                        description,
                        author,
                        date: new Date().toISOString()
                    });
                    fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(snippets, null, 2));
                    yield msg.reply(`✅ Código guardado con ID: ${id}`);
                    break;
                case 'lista':
                case 'list':
                    const filterLang = (_b = args[1]) === null || _b === void 0 ? void 0 : _b.toLowerCase();
                    const filtered = filterLang
                        ? snippets.filter(s => s.language === filterLang)
                        : snippets;
                    if (!filtered.length) {
                        yield msg.reply('❌ No hay códigos guardados');
                        return;
                    }
                    const list = filtered.map(s => `📎 *ID:* ${s.id}\n` +
                        `📝 *${s.description}*\n` +
                        `💻 ${s.language} | 👤 ${s.author}\n`).join('\n');
                    yield msg.reply(`*Códigos Disponibles:*\n\n${list}`);
                    break;
                case 'ver':
                case 'get':
                    const snippetId = args[1];
                    const snippet = snippets.find(s => s.id === snippetId);
                    if (!snippet) {
                        yield msg.reply('❌ Código no encontrado');
                        return;
                    }
                    const response = `📝 *${snippet.description}*\n` +
                        `👤 Autor: ${snippet.author}\n` +
                        `💻 Lenguaje: ${snippet.language}\n` +
                        `📅 Fecha: ${new Date(snippet.date).toLocaleDateString()}\n\n` +
                        '\`\`\`' + snippet.language + '\n' +
                        snippet.code + '\n' +
                        '\`\`\`';
                    yield msg.reply(response);
                    break;
                case 'buscar':
                case 'search':
                    const searchTerm = args.slice(1).join(' ').toLowerCase();
                    const results = snippets.filter(s => s.description.toLowerCase().includes(searchTerm) ||
                        s.language.toLowerCase().includes(searchTerm));
                    if (!results.length) {
                        yield msg.reply('❌ No se encontraron códigos');
                        return;
                    }
                    const searchResults = results.map(s => `📎 *ID:* ${s.id}\n` +
                        `📝 *${s.description}*\n` +
                        `💻 ${s.language} | 👤 ${s.author}\n`).join('\n');
                    yield msg.reply(`*Resultados de búsqueda:*\n\n${searchResults}`);
                    break;
                default:
                    yield msg.reply('❌ Comando no válido. Usa "codigo" para ver las opciones disponibles.');
            }
        }
        catch (error) {
            console.error('Error en comando codigo:', error);
            yield msg.reply('❌ Error al procesar el comando');
        }
    })
};
exports.default = command;
