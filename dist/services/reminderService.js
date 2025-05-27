"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chrono = __importStar(require("chrono-node"));
class ReminderService {
    constructor(client) {
        this.reminders = [];
        this.checkInterval = null;
        this.client = client;
        this.remindersPath = path.join(__dirname, '..', '..', 'data', 'reminders.json');
        this.loadReminders();
        this.startReminderCheck();
    }
    loadReminders() {
        try {
            if (fs.existsSync(this.remindersPath)) {
                const data = fs.readFileSync(this.remindersPath, 'utf-8');
                this.reminders = JSON.parse(data);
            }
            else {
                this.reminders = [];
                this.saveReminders();
            }
        }
        catch (error) {
            console.error('Error loading reminders:', error);
            this.reminders = [];
        }
    }
    saveReminders() {
        try {
            const dir = path.dirname(this.remindersPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.remindersPath, JSON.stringify(this.reminders, null, 2));
        }
        catch (error) {
            console.error('Error saving reminders:', error);
        }
    }
    startReminderCheck() {
        // Revisar recordatorios cada minuto
        this.checkInterval = setInterval(() => this.checkReminders(), 60000);
    }
    checkReminders() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const pendingReminders = this.reminders.filter(r => !r.sent && new Date(r.datetime) <= now);
            for (const reminder of pendingReminders) {
                try {
                    yield this.client.sendMessage(reminder.user, `⏰ *Recordatorio:* ${reminder.text}`);
                    reminder.sent = true;
                }
                catch (error) {
                    console.error('Error sending reminder:', error);
                }
            }
            if (pendingReminders.length > 0) {
                this.saveReminders();
            }
        });
    }
    addReminder(user, text, datetime) {
        const reminder = {
            user,
            text,
            datetime: datetime.toISOString(),
            sent: false
        };
        this.reminders.push(reminder);
        this.saveReminders();
    }
    parseReminderText(text) {
        // Usar chrono para extraer la fecha/hora
        const results = chrono.parse(text);
        if (results.length === 0) {
            return { datetime: null, reminderText: text };
        }
        const parsedDate = results[0].start.date();
        const reminderText = text.replace(results[0].text, '').trim();
        return {
            datetime: parsedDate,
            reminderText: reminderText || 'Recordatorio'
        };
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}
exports.default = ReminderService;
