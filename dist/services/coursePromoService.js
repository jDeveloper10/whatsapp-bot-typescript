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
exports.CoursePromoService = void 0;
exports.initCoursePromoService = initCoursePromoService;
exports.getCoursePromoService = getCoursePromoService;
const config_1 = require("../config/config");
/**
 * Clase que maneja la promoción periódica de los cursos de la comunidad
 */
class CoursePromoService {
    constructor(client) {
        this.courseList = [];
        this.timer = null;
        this.interval = 3600000; // 1 hora por defecto
        this.targetGroups = [];
        this.client = client;
        this.initializeCourses();
        // Por defecto, promocionar en grupos configurados en config
        if (config_1.config.promoGroups && Array.isArray(config_1.config.promoGroups)) {
            this.targetGroups = config_1.config.promoGroups;
        }
    }
    /**
     * Inicializa la lista de cursos disponibles
     */
    initializeCourses() {
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
    setTargetGroups(groupIds) {
        this.targetGroups = groupIds;
    }
    /**
     * Establece el intervalo de tiempo entre promociones
     */
    setInterval(milliseconds) {
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
    startPromotions() {
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
    stopPromotions() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('Promoción de cursos detenida');
        }
    }
    /**
     * Promociona un curso aleatorio en los grupos objetivo
     */
    promoteCourse() {
        return __awaiter(this, void 0, void 0, function* () {
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
                        yield this.client.sendMessage(groupId, message);
                        console.log(`Promoción de "${randomCourse.name}" enviada al grupo ${groupId}`);
                    }
                    catch (err) {
                        console.error(`Error enviando promoción al grupo ${groupId}:`, err);
                    }
                }
            }
            catch (error) {
                console.error('Error en la promoción de cursos:', error);
            }
        });
    }
    /**
     * Crea un mensaje de promoción atractivo para un curso
     */
    createPromoMessage(course) {
        const message = `${course.emoji} *CURSO DESTACADO* ${course.emoji}\n\n` +
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
    promoteSpecificCourse(courseName, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = this.courseList.find(c => c.name.toLowerCase().includes(courseName.toLowerCase()));
            if (!course) {
                return false;
            }
            try {
                const message = this.createPromoMessage(course);
                yield this.client.sendMessage(groupId, message);
                return true;
            }
            catch (error) {
                console.error('Error promocionando curso específico:', error);
                return false;
            }
        });
    }
    /**
     * Obtiene la lista de cursos disponibles
     */
    getCourseList() {
        return [...this.courseList];
    }
}
exports.CoursePromoService = CoursePromoService;
// Exportar una instancia singleton
let instance = null;
function initCoursePromoService(client) {
    if (!instance) {
        instance = new CoursePromoService(client);
    }
    return instance;
}
function getCoursePromoService() {
    return instance;
}
exports.default = { initCoursePromoService, getCoursePromoService };
