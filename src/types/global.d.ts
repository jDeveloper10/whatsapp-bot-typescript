declare namespace WhatsAppBot {
    interface Command {
        name: string;
        description: string;
        adminOnly?: boolean;
        groupOnly?: boolean;    // El comando solo puede usarse en grupos
        privateOnly?: boolean;  // El comando solo puede usarse en privado
        execute: (msg: import('whatsapp-web.js').Message, args: string[]) => Promise<void>;
    }

    interface Handler {
        event: string;
        execute: (...args: any[]) => Promise<void>;
    }

    interface Service {
        name: string;
        start: () => Promise<void>;
        stop: () => Promise<void>;
    }
}