export class MessageUtils {
    static formatCommand(command: string, description: string, usage?: string): string {
        let formatted = `*${command}*: ${description}`;
        if (usage) {
            formatted += `\nUsage: ${usage}`;
        }
        return formatted;
    }

    static formatList(items: string[]): string {
        return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    }

    static formatError(message: string): string {
        return `❌ Error: ${message}`;
    }

    static formatSuccess(message: string): string {
        return `✅ ${message}`;
    }

    static isValidNumber(number: string): boolean {
        // Basic validation for international phone numbers
        return /^\d{10,15}$/.test(number.replace(/\D/g, ''));
    }
}