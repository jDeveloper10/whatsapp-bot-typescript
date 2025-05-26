import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'whatsapp-web.js';
import * as chrono from 'chrono-node';

interface Reminder {
    user: string;
    text: string;
    datetime: string;
    sent: boolean;
}

class ReminderService {
    private reminders: Reminder[] = [];
    private readonly remindersPath: string;
    private client: Client;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(client: Client) {
        this.client = client;
        this.remindersPath = path.join(__dirname, '..', '..', 'data', 'reminders.json');
        this.loadReminders();
        this.startReminderCheck();
    }

    private loadReminders() {
        try {
            if (fs.existsSync(this.remindersPath)) {
                const data = fs.readFileSync(this.remindersPath, 'utf-8');
                this.reminders = JSON.parse(data);
            } else {
                this.reminders = [];
                this.saveReminders();
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
            this.reminders = [];
        }
    }

    private saveReminders() {
        try {
            const dir = path.dirname(this.remindersPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.remindersPath, JSON.stringify(this.reminders, null, 2));
        } catch (error) {
            console.error('Error saving reminders:', error);
        }
    }

    private startReminderCheck() {
        // Revisar recordatorios cada minuto
        this.checkInterval = setInterval(() => this.checkReminders(), 60000);
    }

    private async checkReminders() {
        const now = new Date();
        const pendingReminders = this.reminders.filter(r => !r.sent && new Date(r.datetime) <= now);

        for (const reminder of pendingReminders) {
            try {
                await this.client.sendMessage(reminder.user, `⏰ *Recordatorio:* ${reminder.text}`);
                reminder.sent = true;
            } catch (error) {
                console.error('Error sending reminder:', error);
            }
        }

        if (pendingReminders.length > 0) {
            this.saveReminders();
        }
    }

    public addReminder(user: string, text: string, datetime: Date) {
        const reminder: Reminder = {
            user,
            text,
            datetime: datetime.toISOString(),
            sent: false
        };

        this.reminders.push(reminder);
        this.saveReminders();
    }

    public parseReminderText(text: string): { datetime: Date | null; reminderText: string } {
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

    public stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}

export default ReminderService; 