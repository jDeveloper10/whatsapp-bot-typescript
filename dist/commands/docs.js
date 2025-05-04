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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const DOCS_URLS = {
    'js': 'https://developer.mozilla.org/api/v1/search',
    'python': 'https://docs.python.org/3/search.html',
    'php': 'https://www.php.net/manual-lookup.php',
    // Agregar más lenguajes según sea necesario
};
const command = {
    name: 'documentacion',
    description: 'Busca documentación sobre un tema específico',
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        if (!args.length) {
            yield msg.reply('📚 *Comando Documentación*\n\n' +
                'Uso: documentacion <tema a buscar>\n' +
                'Ejemplo: documentacion javascript array map');
            return;
        }
        const query = args.join(' ');
        try {
            let resultText = '';
            yield msg.reply('🔍 Buscando documentación sobre: ' + query);
            const language = args[0].toLowerCase();
            const searchTerm = args.slice(1).join(' ');
            if (language === 'js') {
                const response = yield axios_1.default.get(DOCS_URLS.js, {
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
            }
            else if (language === 'python') {
                resultText = `📚 *Documentación Python*\n\n` +
                    `Para buscar "${searchTerm}" visita:\n` +
                    `https://docs.python.org/3/search.html?q=${encodeURIComponent(searchTerm)}`;
            }
            else if (language === 'php') {
                resultText = `📚 *Documentación PHP*\n\n` +
                    `Para buscar "${searchTerm}" visita:\n` +
                    `https://www.php.net/manual-lookup.php?pattern=${encodeURIComponent(searchTerm)}`;
            }
            else {
                yield msg.reply('❌ Lenguaje no soportado. Usa: js, python o php');
                return;
            }
            yield msg.reply(resultText || '❌ No se encontraron resultados');
        }
        catch (error) {
            console.error('Error en comando documentacion:', error);
            yield msg.reply('❌ Error al buscar la documentación');
        }
    })
};
exports.default = command;
