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
exports.MotivationalService = void 0;
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
class MotivationalService {
    constructor(client) {
        this.client = client;
    }
    getRandomMessage() {
        const randomIndex = Math.floor(Math.random() * programmingMotivationalMessages.length);
        return programmingMotivationalMessages[randomIndex];
    }
    getAllGroups() {
        return __awaiter(this, void 0, void 0, function* () {
            const chats = yield this.client.getChats();
            return chats.filter((chat) => chat.isGroup);
        });
    }
    sendMotivationalMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const groups = yield this.getAllGroups();
                const message = this.getRandomMessage();
                for (const group of groups) {
                    yield group.sendMessage(message);
                    // Pequeña pausa entre mensajes para evitar spam
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                console.error('Error sending motivational message:', error);
            }
        });
    }
}
exports.MotivationalService = MotivationalService;
