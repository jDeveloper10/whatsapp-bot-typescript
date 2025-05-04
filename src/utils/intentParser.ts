import { normalizeText, findBestMatch } from './stringUtils';

// Palabras clave que indican intención de comando
const COMMAND_INDICATORS = [
    'usa', 'usar', 'utiliza', 'utilizar', 'ejecuta', 'ejecutar',
    'haz', 'hacer', 'quiero', 'necesito', 'puedes', 'comando',
    'bot', 'por favor', 'me puedes', 'podrias', 'ayudame', 'ayúdame'
];

// Mapeo de alias de comandos
const COMMAND_ALIASES: Record<string, string[]> = {
    'help': ['ayuda', 'ayudame', 'ayúdame', 'ayudar', 'menu', 'menú', 'comandos', 'opciones'],
    'recordatorio': ['recuerdame', 'recuérdame', 'alarma', 'avisame', 'avísame']
};

export interface IntentAnalysisResult {
    command: string | null;
    confidence: number;
    suggestion?: string;
}

export class IntentParser {
    private registeredCommands: Set<string>;
    private aliasToCommand: Map<string, string>;

    constructor(commands: string[]) {
        this.registeredCommands = new Set(commands);
        this.aliasToCommand = new Map();
        this.initializeAliases();
    }

    private initializeAliases() {
        for (const [command, aliases] of Object.entries(COMMAND_ALIASES)) {
            for (const alias of aliases) {
                this.aliasToCommand.set(normalizeText(alias), command);
            }
        }
    }

    public analyzeIntent(message: string): IntentAnalysisResult {
        const normalizedMsg = normalizeText(message);
        const words = normalizedMsg.split(/\s+/);

        // Buscar coincidencia directa con comandos o alias
        for (const word of words) {
            // Verificar comandos directos
            if (this.registeredCommands.has(word)) {
                return { command: word, confidence: 1 };
            }

            // Verificar alias
            const aliasCommand = this.aliasToCommand.get(word);
            if (aliasCommand) {
                return { command: aliasCommand, confidence: 1 };
            }
        }

        // Eliminar palabras indicadoras para buscar el comando
        const cleanedMessage = this.removeIndicators(normalizedMsg);
        const possibleCommand = cleanedMessage.trim();

        if (!possibleCommand) {
            return { command: null, confidence: 0 };
        }

        // Buscar la mejor coincidencia entre comandos y alias
        const allOptions = [
            ...Array.from(this.registeredCommands),
            ...Array.from(this.aliasToCommand.keys())
        ];

        const { bestMatch, similarity } = findBestMatch(
            possibleCommand,
            allOptions
        );

        // Convertir alias a comando si es necesario
        const finalCommand = this.aliasToCommand.get(bestMatch) || bestMatch;

        // Umbral de confianza para sugerencias (70%)
        const CONFIDENCE_THRESHOLD = 0.7;

        if (similarity >= CONFIDENCE_THRESHOLD) {
            return { command: finalCommand, confidence: similarity };
        }

        // Si hay una coincidencia parcial, sugerir el comando
        if (similarity >= 0.4) {
            return {
                command: null,
                confidence: similarity,
                suggestion: finalCommand
            };
        }

        return { command: null, confidence: 0 };
    }

    private removeIndicators(text: string): string {
        let result = text;
        for (const indicator of COMMAND_INDICATORS) {
            result = result.replace(new RegExp(`\\b${indicator}\\b`, 'g'), '');
        }
        return result;
    }

    public addCommand(command: string): void {
        this.registeredCommands.add(normalizeText(command));
    }

    public removeCommand(command: string): void {
        this.registeredCommands.delete(normalizeText(command));
    }
}