import { Message, MessageMedia } from 'whatsapp-web.js';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

// Configurar ffmpeg con el path correcto
try {
    console.log('Configurando ffmpeg path:', ffmpegPath);
    ffmpeg.setFfmpegPath(ffmpegPath);
} catch (error) {
    console.error('Error al configurar ffmpeg:', error);
    // Intentar con path alternativo
    const altPath = path.join(__dirname, '..', '..', 'node_modules', '@ffmpeg-installer', 'ffmpeg', 'ffmpeg.exe');
    if (fs.existsSync(altPath)) {
        console.log('Usando path alternativo para ffmpeg:', altPath);
        ffmpeg.setFfmpegPath(altPath);
    } else {
        console.error('No se pudo encontrar el ejecutable de ffmpeg');
    }
}

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

// Función para procesar video a sticker
const processVideoToSticker = async (inputPath: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .setFfmpegPath(ffmpegPath)
            .inputOptions(['-t 3']) // Limitar a 3 segundos
            .outputOptions([
                '-vf scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:white',
                '-vcodec libwebp',
                '-loop 0',
                '-preset picture',
                '-an',
                '-vsync 0',
                '-s 512:512'
            ])
            .save(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
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
    description: 'Convierte una imagen o video en sticker. Responde a un mensaje con una imagen/video y usa "@bot sticker"',
    privateOnly: true,
    execute: async (msg: Message) => {
        let tempFilePath: string | null = null;
        let outputPath: string | null = null;
        let statusMsg: Message | null = null;

        try {
            // Obtener el chat y los últimos mensajes
            const chat = await msg.getChat();
            const messages = await chat.fetchMessages({ limit: 5 });
            
            // Buscar el último mensaje con medio
            const lastMediaMessage = messages.find(m => m.hasMedia);
            
            if (!lastMediaMessage) {
                await msg.reply('❌ No se encontró ningún mensaje con imagen o video reciente. Por favor, envía o responde a una imagen/video.');
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
                    media = await downloadMediaWithTimeout(lastMediaMessage);

                    if (!media) {
                        attempts++;
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

                // Guardar el medio temporalmente
                const tempDir = getTempDir();
                const fileExt = media.mimetype.split('/')[1];
                tempFilePath = path.join(tempDir, `sticker_${Date.now()}.${fileExt}`);
                fs.writeFileSync(tempFilePath, Buffer.from(media.data, 'base64'));

                // Procesar el medio según su tipo
                if (lastMediaMessage.type === 'video') {
                    console.log('Procesando video...');
                    outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
                    await processVideoToSticker(tempFilePath, outputPath);
                    
                    // Leer el archivo procesado
                    const processedData = fs.readFileSync(outputPath);
                    media = new MessageMedia(
                        'image/webp',
                        processedData.toString('base64'),
                        'sticker.webp'
                    );
                }

                // Enviar el sticker
                await msg.reply(media, undefined, {
                    sendMediaAsSticker: true,
                    stickerName: 'Created by Bot',
                    stickerAuthor: 'Programming Group Bot',
                    stickerCategories: ['🤖']
                });

                // Eliminar mensaje de estado
                if (statusMsg) {
                    await statusMsg.delete(true);
                }

            } catch (mediaError: any) {
                console.error('Error procesando medio:', mediaError);
                if (statusMsg) {
                    await statusMsg.edit('❌ Error al procesar el medio. Por favor, intenta de nuevo.');
                }
                throw mediaError;
            }

        } catch (error: any) {
            console.error('Error creating sticker:', error);
            await msg.reply('❌ No se pudo crear el sticker. Por favor, intenta de nuevo con otra imagen o video.');
        } finally {
            // Limpiar archivos temporales
            if (tempFilePath) cleanupTempFiles(tempFilePath);
            if (outputPath) cleanupTempFiles(outputPath);
        }
    }
};

export default command;