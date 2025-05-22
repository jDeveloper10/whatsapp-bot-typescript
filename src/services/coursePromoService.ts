import { Client } from 'whatsapp-web.js';
import { config } from '../config/config';

/**
 * Clase que maneja la promoción periódica de los cursos de la comunidad
 */
export class CoursePromoService {
    private client: Client;
    private courseList: Course[] = [];
    private timer: NodeJS.Timeout | null = null;
    private interval: number = 3600000; // 1 hora por defecto
    private targetGroups: string[] = [];

    constructor(client: Client) {
        this.client = client;
        this.initializeCourses();

        // Por defecto, promocionar en grupos configurados en config
        if (config.promoGroups && Array.isArray(config.promoGroups)) {
            this.targetGroups = config.promoGroups;
        }
    }

    /**
     * Inicializa la lista de cursos disponibles
     */
    private initializeCourses(): void {
        this.courseList = [
            {
                name: "Desarrollo de Videojuegos con Godot",
                description: "Aprende a crear tus propios videojuegos 2D y 3D utilizando el motor Godot Engine",
                emoji: "🎮",
                benefits: [
                    "Desarrollo de juegos multiplataforma",
                    "Programación con GDScript",
                    "Física para videojuegos",
                    "Publicación en tiendas digitales"
                ],
                callToAction: "¡Únete y crea el juego que siempre soñaste!"
            },
            {
                name: "JavaScript Avanzado",
                description: "Domina JavaScript moderno y conviértete en un desarrollador frontend de alto nivel",
                emoji: "🌐",
                benefits: [
                    "ES6+ y nuevas características",
                    "Frameworks modernos",
                    "Patrones de diseño",
                    "Optimización de rendimiento"
                ],
                callToAction: "¡Potencia tus habilidades web y destaca en el mercado!"
            },
            {
                name: "Ingeniería de Software",
                description: "Metodologías y prácticas profesionales para desarrollo de software de calidad",
                emoji: "🔧",
                benefits: [
                    "Metodologías ágiles",
                    "Arquitectura de software",
                    "Testing y QA",
                    "Gestión de proyectos"
                ],
                callToAction: "¡Construye software robusto y escalable!"
            },
            {
                name: "Firebase",
                description: "Crea aplicaciones con backend rápido utilizando Firebase de Google",
                emoji: "🔥",
                benefits: [
                    "Firestore y Realtime Database",
                    "Autenticación y seguridad",
                    "Cloud Functions",
                    "Hosting y almacenamiento"
                ],
                callToAction: "¡Desarrolla apps completas sin preocuparte del backend!"
            },
            {
                name: "Matemáticas para Programadores",
                description: "Fundamentos matemáticos esenciales para destacar en desarrollo de software",
                emoji: "🧮",
                benefits: [
                    "Álgebra lineal",
                    "Algoritmos y optimización",
                    "Estadística para datos",
                    "Matemática discreta"
                ],
                callToAction: "¡Potencia tu lógica y resuelve problemas complejos!"
            },
            {
                name: "Bases de Datos",
                description: "Diseño e implementación de bases de datos SQL y NoSQL",
                emoji: "💾",
                benefits: [
                    "Modelado de datos",
                    "Consultas avanzadas SQL",
                    "MongoDB y bases NoSQL",
                    "Optimización y rendimiento"
                ],
                callToAction: "¡Gestiona datos de forma eficiente y escalable!"
            },
            {
                name: "Java Enterprise",
                description: "Desarrollo de aplicaciones empresariales con Java y Spring Boot",
                emoji: "☕",
                benefits: [
                    "Spring Framework",
                    "APIs RESTful",
                    "Microservicios",
                    "Seguridad y autenticación"
                ],
                callToAction: "¡Conviértete en desarrollador Java empresarial!"
            }
        ];
    }

    /**
     * Establece los grupos donde se promocionarán los cursos
     */
    public setTargetGroups(groupIds: string[]): void {
        this.targetGroups = groupIds;
    }

    /**
     * Establece el intervalo de tiempo entre promociones
     */
    public setInterval(milliseconds: number): void {
        if (milliseconds < 1800000) { // Mínimo 30 minutos
            milliseconds = 1800000;
        }
        this.interval = milliseconds;

        // Reiniciar el timer si ya estaba activo
        if (this.timer) {
            this.stopPromotions();
            this.startPromotions();
        }
    }

    /**
     * Inicia las promociones automáticas
     */
    public startPromotions(): void {
        if (this.timer) {
            return; // Ya está iniciado
        }

        // Promocionar inmediatamente al iniciar
        this.promoteCourse();

        // Configurar timer para promociones periódicas
        this.timer = setInterval(() => {
            this.promoteCourse();
        }, this.interval);

        console.log(`Promoción de cursos iniciada. Intervalo: ${this.interval / 60000} minutos`);
    }

    /**
     * Detiene las promociones automáticas
     */
    public stopPromotions(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('Promoción de cursos detenida');
        }
    }

    /**
     * Promociona un curso aleatorio en los grupos objetivo
     */
    public async promoteCourse(): Promise<void> {
        try {
            if (this.targetGroups.length === 0) {
                console.log('No hay grupos configurados para promociones');
                return;
            }

            // Seleccionar un curso aleatorio
            const randomCourse = this.courseList[Math.floor(Math.random() * this.courseList.length)];
            const message = this.createPromoMessage(randomCourse);

            // Enviar a cada grupo objetivo
            for (const groupId of this.targetGroups) {
                try {
                    await this.client.sendMessage(groupId, message);
                    console.log(`Promoción de "${randomCourse.name}" enviada al grupo ${groupId}`);
                } catch (err) {
                    console.error(`Error enviando promoción al grupo ${groupId}:`, err);
                }
            }
        } catch (error) {
            console.error('Error en la promoción de cursos:', error);
        }
    }

    /**
     * Crea un mensaje de promoción atractivo para un curso
     */
    private createPromoMessage(course: Course): string {
        const message =
            `${course.emoji} *CURSO DESTACADO* ${course.emoji}\n\n` +
            `*${course.name}*\n\n` +
            `${course.description}\n\n` +
            `*¿Qué aprenderás?*\n` +
            course.benefits.map(benefit => `• ${benefit}`).join('\n') +
            `\n\n` +
            `*${course.callToAction}*\n\n` +
            `Para más información sobre este y otros cursos, escribe "@bot cursos" o contacta a un administrador.\n` +
            `\n---------------------\n` +
            `_Comunidad de Programación y Tecnología_`;

        return message;
    }

    /**
     * Promociona un curso específico por su nombre
     */
    public async promoteSpecificCourse(courseName: string, groupId: string): Promise<boolean> {
        const course = this.courseList.find(c =>
            c.name.toLowerCase().includes(courseName.toLowerCase()));

        if (!course) {
            return false;
        }

        try {
            const message = this.createPromoMessage(course);
            await this.client.sendMessage(groupId, message);
            return true;
        } catch (error) {
            console.error('Error promocionando curso específico:', error);
            return false;
        }
    }

    /**
     * Obtiene la lista de cursos disponibles
     */
    public getCourseList(): Course[] {
        return [...this.courseList];
    }
}

/**
 * Interfaz para la estructura de un curso
 */
interface Course {
    name: string;
    description: string;
    emoji: string;
    benefits: string[];
    callToAction: string;
}

// Exportar una instancia singleton
let instance: CoursePromoService | null = null;

export function initCoursePromoService(client: Client): CoursePromoService {
    if (!instance) {
        instance = new CoursePromoService(client);
    }
    return instance;
}

export function getCoursePromoService(): CoursePromoService | null {
    return instance;
}

export default { initCoursePromoService, getCoursePromoService };