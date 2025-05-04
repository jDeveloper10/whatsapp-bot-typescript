import { Client, GroupChat } from 'whatsapp-web.js';

const programmingMotivationalMessages = [
    "💻 El código limpio siempre parece que fue escrito por alguien que se preocupa. - Robert C. Martin",
    "🚀 La mejor manera de predecir el futuro es implementarlo. - Alan Kay",
    "⚡ La simplicidad es la sofisticación definitiva. - Leonardo da Vinci",
    "🌟 Todo gran desarrollador que conozcas llegó ahí resolviendo problemas que no estaba calificado para resolver hasta que realmente lo logró.",
    "🎯 El debugging es como ser un detective en una película de crimen donde también eres el asesino.",
    "💡 Los mejores programadores no son marginalmente mejores, son exponencialmente mejores.",
    "🔄 La programación no se trata de lo que sabes, se trata de lo que puedes averiguar.",
    "⌨️ Mide dos veces, codifica una vez.",
    "🎨 La programación es el arte de decirle a otra persona lo que quieres que la computadora haga.",
    "🌈 El código es como el humor. Cuando tienes que explicarlo, es malo."
];

export class MotivationalService {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    private getRandomMessage(): string {
        const randomIndex = Math.floor(Math.random() * programmingMotivationalMessages.length);
        return programmingMotivationalMessages[randomIndex];
    }

    private async getAllGroups(): Promise<GroupChat[]> {
        const chats = await this.client.getChats();
        return chats.filter((chat): chat is GroupChat => chat.isGroup);
    }

    public async sendMotivationalMessage(): Promise<void> {
        try {
            const groups = await this.getAllGroups();
            const message = this.getRandomMessage();

            for (const group of groups) {
                await group.sendMessage(message);
                // Pequeña pausa entre mensajes para evitar spam
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('Error sending motivational message:', error);
        }
    }
}