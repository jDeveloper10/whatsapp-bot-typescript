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
const whatsapp_web_js_1 = require("whatsapp-web.js");
const searchUtils_1 = require("../utils/searchUtils");
const command = {
    name: 'investigacion',
    description: 'Busca información e imágenes sobre un tema',
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        if (!args.length) {
            yield msg.reply('❌ Por favor, especifica qué quieres investigar.\nEjemplo: investigacion ballenas azules');
            return;
        }
        const searchQuery = args.join(' ');
        yield msg.reply('🔍 Buscando información sobre: ' + searchQuery);
        try {
            // Buscar información en Wikipedia
            const wikiResult = yield searchUtils_1.SearchUtils.searchWikipedia(searchQuery);
            // Buscar imagen relacionada
            const imageUrl = yield searchUtils_1.SearchUtils.searchImage(searchQuery);
            console.log('Image URL found:', imageUrl);
            if (!wikiResult && !imageUrl) {
                yield msg.reply('❌ No se encontró información sobre ese tema.');
                return;
            }
            // Si encontramos una imagen, enviarla primero
            if (imageUrl) {
                try {
                    console.log('Downloading image from:', imageUrl);
                    const media = yield whatsapp_web_js_1.MessageMedia.fromUrl(imageUrl, {
                        unsafeMime: true,
                        filename: `${searchQuery.replace(/[^a-z0-9]/gi, '_')}.jpg`
                    });
                    console.log('Image downloaded, mime type:', media.mimetype);
                    // Enviar la imagen con un mensaje descriptivo
                    yield msg.reply(media, undefined, {
                        caption: `🖼️ Imagen relacionada a: ${searchQuery}`
                    });
                }
                catch (error) {
                    console.error('Error sending image:', error);
                    yield msg.reply('⚠️ No se pudo cargar la imagen, pero continuaré con la información...');
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
                yield msg.reply(response);
            }
        }
        catch (error) {
            console.error('Error en el comando de investigación:', error);
            yield msg.reply('❌ Ocurrió un error al buscar la información.');
        }
    })
};
exports.default = command;
