import { Message, MessageMedia } from 'whatsapp-web.js';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

// Configurar ffmpeg con el path correcto
ffmpeg.setFfmpegPath(ffmpegPath);

// Función para crear directorio temporal si no existe
const getTempDir = () => {
    const tempDir = path.join(os.tmpdir(), 'whatsapp-stickers');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
};

// Función para limpiar archivos temporales
const cleanupTempFiles = (filePath: string) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Archivo temporal eliminado:', filePath);
        }
    } catch (error) {
        console.error('Error al eliminar archivo temporal:', error);
    }
};

// Función para descargar medio con timeout y reintentos
const downloadMediaWithTimeout = async (msg: Message): Promise<MessageMedia | null> => {
    const maxAttempts = 3;
    const baseDelay = 2000; // 2 seconds base delay

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Si el mensaje tiene una URL, intentar descargar directamente
            if (msg.body.startsWith('http')) {
                const response = await axios.get(msg.body, {
                    responseType: 'arraybuffer',
                    timeout: 30000, // 30 segundos timeout
                    maxContentLength: 20 * 1024 * 1024, // 20MB max
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                const buffer = Buffer.from(response.data);
                const mimeType = response.headers['content-type'];

                return new MessageMedia(
                    mimeType,
                    buffer.toString('base64'),
                    `sticker.${mimeType.split('/')[1]}`
                );
            }

            // Si no es URL, intentar descargar como medio de WhatsApp con timeout
            return await Promise.race([
                msg.downloadMedia(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout downloading media')), 30000)
                )
            ]) as MessageMedia;

        } catch (error) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.error(`Error downloading media (attempt ${attempt + 1}/${maxAttempts}):`, error);

            if (attempt < maxAttempts - 1) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('Max attempts reached, giving up');
                return null;
            }
        }
    }

    return null;
};

const command: WhatsAppBot.Command = {
    name: 'sticker',
    description: 'Convierte una imagen en sticker. Responde a un mensaje con una imagen y usa "@bot sticker"',
    execute: async (msg: Message) => {
        let tempFilePath: string | null = null;
        let statusMsg: Message | null = null;

        try {
            if (!msg.hasQuotedMsg) {
                await msg.reply('❌ Debes responder a una imagen con este comando');
                return;
            }

            const quotedMsg = await msg.getQuotedMessage();

            if (!quotedMsg.hasMedia) {
                await msg.reply('❌ El mensaje al que respondes debe contener una imagen');
                return;
            }

            // Verificación temprana del tipo de medio
            if (quotedMsg.type === 'video') {
                await msg.reply('❌ Los videos no están soportados. Por favor, envía una imagen para convertirla en sticker.');
                return;
            }

            // Enviar mensaje de estado
            statusMsg = await msg.reply('⏳ Descargando medio...');

            try {
                // Intentar descargar con varios reintentos
                let media = null;
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts && !media) {
                    console.log(`Intento ${attempts + 1} de descargar medio...`);
                    media = await downloadMediaWithTimeout(quotedMsg);

                    if (!media) {
                        attempts++;
                        // Si llevamos más de un intento, probablemente sea un video
                        if (attempts > 1) {
                            throw new Error('Parece ser un video. Los stickers solo pueden crearse a partir de imágenes.');
                        }
                        if (attempts === maxAttempts) {
                            throw new Error('No se pudo descargar el medio después de varios intentos');
                        }
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                    }
                }

                if (!media) {
                    throw new Error('No se pudo descargar el medio');
                }

                // Actualizar mensaje de estado
                await statusMsg.edit('⚙️ Procesando...');

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
                await msg.reply(media, undefined, {
                    sendMediaAsSticker: true,
                    stickerName: 'Created by Bot',
                    stickerAuthor: 'Programming Group Bot',
                    stickerCategories: ['🤖']
                });

                // Intentar eliminar el mensaje original si tenemos permiso
                try {
                    await quotedMsg.delete(true);
                } catch (deleteError) {
                    console.log('No se pudo eliminar el mensaje original:', deleteError);
                }

                // Eliminar mensaje de estado
                if (statusMsg) {
                    await statusMsg.delete(true);
                }

            } catch (mediaError: any) {
                console.error('Error procesando medio:', mediaError);
                if (statusMsg) {
                    if (mediaError?.message?.includes('Parece ser un video')) {
                        await statusMsg.edit('❌ Los videos no están soportados. Por favor, envía una imagen para convertirla en sticker.');
                    } else if (mediaError?.message?.includes('videos no están soportados')) {
                        await statusMsg.edit('❌ Solo se pueden crear stickers a partir de imágenes. Los videos no están soportados.');
                    } else {
                        await statusMsg.edit('❌ Error al procesar el medio. Por favor, intenta de nuevo.');
                    }
                }
                throw mediaError;
            }

        } catch (error: any) {
            console.error('Error creating sticker:', error);
            if (!statusMsg ||
                error?.message?.includes('videos no están soportados') ||
                error?.message?.includes('Parece ser un video')) {
                await msg.reply('❌ Los videos no están soportados. Por favor, envía una imagen para convertirla en sticker.');
            } else {
                await msg.reply('❌ No se pudo crear el sticker. Por favor, intenta de nuevo con otra imagen.');
            }
        } finally {
            // Limpiar archivos temporales
            if (tempFilePath) {
                cleanupTempFiles(tempFilePath);
            }
        }
    }
};

export default command;