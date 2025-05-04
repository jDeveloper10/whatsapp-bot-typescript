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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const axios_1 = __importDefault(require("axios"));
// Configurar ffmpeg con el path correcto
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.path);
// Función para crear directorio temporal si no existe
const getTempDir = () => {
    const tempDir = path.join(os.tmpdir(), 'whatsapp-stickers');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
};
// Función para limpiar archivos temporales
const cleanupTempFiles = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Archivo temporal eliminado:', filePath);
        }
    }
    catch (error) {
        console.error('Error al eliminar archivo temporal:', error);
    }
};
// Función para descargar medio con timeout y reintentos
const downloadMediaWithTimeout = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const maxAttempts = 3;
    const baseDelay = 2000; // 2 seconds base delay
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Si el mensaje tiene una URL, intentar descargar directamente
            if (msg.body.startsWith('http')) {
                const response = yield axios_1.default.get(msg.body, {
                    responseType: 'arraybuffer',
                    timeout: 30000, // 30 segundos timeout
                    maxContentLength: 20 * 1024 * 1024, // 20MB max
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const buffer = Buffer.from(response.data);
                const mimeType = response.headers['content-type'];
                return new whatsapp_web_js_1.MessageMedia(mimeType, buffer.toString('base64'), `sticker.${mimeType.split('/')[1]}`);
            }
            // Si no es URL, intentar descargar como medio de WhatsApp con timeout
            return yield Promise.race([
                msg.downloadMedia(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout downloading media')), 30000))
            ]);
        }
        catch (error) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.error(`Error downloading media (attempt ${attempt + 1}/${maxAttempts}):`, error);
            if (attempt < maxAttempts - 1) {
                console.log(`Retrying in ${delay}ms...`);
                yield new Promise(resolve => setTimeout(resolve, delay));
            }
            else {
                console.error('Max attempts reached, giving up');
                return null;
            }
        }
    }
    return null;
});
const command = {
    name: 'sticker',
    description: 'Convierte una imagen en sticker. Responde a un mensaje con una imagen y usa "@bot sticker"',
    execute: (msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        let tempFilePath = null;
        let statusMsg = null;
        try {
            if (!msg.hasQuotedMsg) {
                yield msg.reply('❌ Debes responder a una imagen con este comando');
                return;
            }
            const quotedMsg = yield msg.getQuotedMessage();
            if (!quotedMsg.hasMedia) {
                yield msg.reply('❌ El mensaje al que respondes debe contener una imagen');
                return;
            }
            // Verificación temprana del tipo de medio
            if (quotedMsg.type === 'video') {
                yield msg.reply('❌ Los videos no están soportados. Por favor, envía una imagen para convertirla en sticker.');
                return;
            }
            // Enviar mensaje de estado
            statusMsg = yield msg.reply('⏳ Descargando medio...');
            try {
                // Intentar descargar con varios reintentos
                let media = null;
                let attempts = 0;
                const maxAttempts = 3;
                while (attempts < maxAttempts && !media) {
                    console.log(`Intento ${attempts + 1} de descargar medio...`);
                    media = yield downloadMediaWithTimeout(quotedMsg);
                    if (!media) {
                        attempts++;
                        // Si llevamos más de un intento, probablemente sea un video
                        if (attempts > 1) {
                            throw new Error('Parece ser un video. Los stickers solo pueden crearse a partir de imágenes.');
                        }
                        if (attempts === maxAttempts) {
                            throw new Error('No se pudo descargar el medio después de varios intentos');
                        }
                        yield new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                    }
                }
                if (!media) {
                    throw new Error('No se pudo descargar el medio');
                }
                // Actualizar mensaje de estado
                yield statusMsg.edit('⚙️ Procesando...');
                // Verificar que sea una imagen
                const mediaType = media.mimetype.split('/')[0];
                if (mediaType !== 'image') {
                    throw new Error('Solo se pueden crear stickers a partir de imágenes. Los videos no están soportados.');
                }
                // Guardar el medio temporalmente
                const tempDir = getTempDir();
                const fileExt = media.mimetype.split('/')[1];
                tempFilePath = path.join(tempDir, `sticker_${Date.now()}.${fileExt}`);
                fs.writeFileSync(tempFilePath, Buffer.from(media.data, 'base64'));
                // Enviar el sticker
                yield msg.reply(media, undefined, {
                    sendMediaAsSticker: true,
                    stickerName: 'Created by Bot',
                    stickerAuthor: 'Programming Group Bot',
                    stickerCategories: ['🤖']
                });
                // Intentar eliminar el mensaje original si tenemos permiso
                try {
                    yield quotedMsg.delete(true);
                }
                catch (deleteError) {
                    console.log('No se pudo eliminar el mensaje original:', deleteError);
                }
                // Eliminar mensaje de estado
                if (statusMsg) {
                    yield statusMsg.delete(true);
                }
            }
            catch (mediaError) {
                console.error('Error procesando medio:', mediaError);
                if (statusMsg) {
                    if ((_a = mediaError === null || mediaError === void 0 ? void 0 : mediaError.message) === null || _a === void 0 ? void 0 : _a.includes('Parece ser un video')) {
                        yield statusMsg.edit('❌ Los videos no están soportados. Por favor, envía una imagen para convertirla en sticker.');
                    }
                    else if ((_b = mediaError === null || mediaError === void 0 ? void 0 : mediaError.message) === null || _b === void 0 ? void 0 : _b.includes('videos no están soportados')) {
                        yield statusMsg.edit('❌ Solo se pueden crear stickers a partir de imágenes. Los videos no están soportados.');
                    }
                    else {
                        yield statusMsg.edit('❌ Error al procesar el medio. Por favor, intenta de nuevo.');
                    }
                }
                throw mediaError;
            }
        }
        catch (error) {
            console.error('Error creating sticker:', error);
            if (!statusMsg ||
                ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('videos no están soportados')) ||
                ((_d = error === null || error === void 0 ? void 0 : error.message) === null || _d === void 0 ? void 0 : _d.includes('Parece ser un video'))) {
                yield msg.reply('❌ Los videos no están soportados. Por favor, envía una imagen para convertirla en sticker.');
            }
            else {
                yield msg.reply('❌ No se pudo crear el sticker. Por favor, intenta de nuevo con otra imagen.');
            }
        }
        finally {
            // Limpiar archivos temporales
            if (tempFilePath) {
                cleanupTempFiles(tempFilePath);
            }
        }
    })
};
exports.default = command;
