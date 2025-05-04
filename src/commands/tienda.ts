import { Message } from 'whatsapp-web.js';
import rankService from '../services/rankService';

interface Reward {
    name: string;
    description: string;
    requiredRank: string;
    emoji: string;
    price?: number;  // Si tiene costo adicional
}

const rewards: Reward[] = [
    {
        name: "Suscripción a Netflix",
        description: "1 mes de Netflix Standard (2 pantallas HD)",
        requiredRank: "capitan",
        emoji: "🎬"
    },
    {
        name: "ChatGPT Plus",
        description: "1 mes de ChatGPT Plus con acceso a GPT-4",
        requiredRank: "coronel",
        emoji: "🤖"
    },
    {
        name: "GitHub Copilot Pro",
        description: "1 mes de GitHub Copilot Pro",
        requiredRank: "mayor",
        emoji: "👨‍💻"
    },
    {
        name: "$10 PayPal",
        description: "Transferencia de $10 USD a tu cuenta PayPal",
        requiredRank: "general",
        emoji: "💰"
    }
];

const command: WhatsAppBot.Command = {
    name: 'tienda',
    description: 'Muestra la tienda de rangos para canjear recompensas',
    adminOnly: false,
    execute: async (msg: Message, args: string[]) => {
        try {
            const sender = await msg.getContact();
            const userId = sender.id.user;

            // Obtener el rango actual del usuario
            const userRank = rankService.getUserRank(userId);
            if (!userRank) {
                await msg.reply("❌ No tienes un rango asignado aún. Interactúa más en el grupo para obtener un rango.");
                return;
            }

            // Ordenar rangos para saber cuál es mayor que otro
            const rankOrder = ["cabo", "teniente", "capitan", "mayor", "coronel", "general"];
            const userRankIndex = rankOrder.indexOf(userRank.rankKey);

            if (userRankIndex === -1) {
                await msg.reply("❌ Ha ocurrido un error al verificar tu rango. Inténtalo más tarde.");
                return;
            }

            // Encabezado del mensaje
            let storeMessage = `*🏪 TIENDA DE RANGOS*\n\n`;
            storeMessage += `Tu rango actual: ${userRank.rank.emoji} *${userRank.rank.name}*\n`;
            storeMessage += `Mensajes: ${rankService.getUserMessageCount(userId)}\n\n`;
            storeMessage += `*RECOMPENSAS DISPONIBLES:*\n\n`;

            // Mostrar las recompensas, indicando cuáles están disponibles para el usuario
            let availableCount = 0;
            let unavailableCount = 0;

            rewards.forEach(reward => {
                const rewardRankIndex = rankOrder.indexOf(reward.requiredRank);
                const isAvailable = userRankIndex >= rewardRankIndex;

                if (isAvailable) {
                    storeMessage += `${reward.emoji} *${reward.name}* ✅\n`;
                    storeMessage += `   _${reward.description}_\n`;
                    storeMessage += `   Rango requerido: ${rankOrder[rewardRankIndex].charAt(0).toUpperCase() + rankOrder[rewardRankIndex].slice(1)}\n\n`;
                    availableCount++;
                } else {
                    storeMessage += `${reward.emoji} *${reward.name}* 🔒\n`;
                    storeMessage += `   _${reward.description}_\n`;
                    storeMessage += `   Rango requerido: ${rankOrder[rewardRankIndex].charAt(0).toUpperCase() + rankOrder[rewardRankIndex].slice(1)}\n\n`;
                    unavailableCount++;
                }
            });

            // Mensaje de resumen
            storeMessage += `*RESUMEN:*\n`;
            storeMessage += `✅ Recompensas disponibles: ${availableCount}\n`;
            storeMessage += `🔒 Recompensas bloqueadas: ${unavailableCount}\n\n`;
            storeMessage += `Para canjear una recompensa disponible, escribe:\n`;
            storeMessage += `"@bot canjear [nombre de la recompensa]"`;

            await msg.reply(storeMessage);

            // Enviar mensaje adicional sobre requisitos para reclamar recompensas
            setTimeout(async () => {
                const requirementsMessage = `⚠️ *IMPORTANTE* ⚠️\n\n` +
                    `Para reclamar estas recompensas debes tener una actividad constante en el grupo y ` +
                    `en las clases de la comunidad.\n\n` +
                    `*Requisitos adicionales:*\n` +
                    `▫️ Participación regular en chats grupales\n` +
                    `▫️ Asistencia a clases y talleres\n` +
                    `▫️ Contribución positiva a la comunidad\n\n` +
                    `Las recompensas son un reconocimiento a los miembros más activos y comprometidos. ¡Sigue participando!`;

                await msg.reply(requirementsMessage);
            }, 500); // Esperar medio segundo antes de enviar el segundo mensaje

        } catch (error) {
            console.error('Error al mostrar la tienda de rangos:', error);
            await msg.reply('❌ Ocurrió un error al mostrar la tienda de rangos.');
        }
    }
};

export default command;