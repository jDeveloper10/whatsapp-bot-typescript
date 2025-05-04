import * as fs from 'fs';
import * as path from 'path';

interface Activity {
    [userId: string]: {
        messageCount: number;
        groupsActivity: {
            [groupId: string]: number;
        }
    };
}

interface Rank {
    name: string;
    emoji: string;
    minMessages: number;
    maxMessages: number;
}

export class RankService {
    private activityPath: string;
    private rolesPath: string;
    private activity: Activity;
    private ranks: { [key: string]: Rank };

    constructor() {
        this.activityPath = path.join(__dirname, '..', 'data', 'activity.json');
        this.rolesPath = path.join(__dirname, '..', 'data', 'roles.json');
        this.activity = {};
        this.ranks = {};
        this.loadActivity();
        this.loadRanks();
    }

    private loadActivity(): void {
        try {
            if (!fs.existsSync(this.activityPath)) {
                this.activity = {};
                this.saveActivity();
            } else {
                const data = fs.readFileSync(this.activityPath, 'utf8').trim();
                this.activity = data === '' || data === '{}' ? {} : JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading activity data:', error);
            this.activity = {};
            this.saveActivity(); // Attempt to fix corrupted file
        }
    }

    private loadRanks(): void {
        try {
            const data = fs.readFileSync(this.rolesPath, 'utf8');
            const rolesData = JSON.parse(data);
            this.ranks = rolesData.ranks || {};
        } catch (error) {
            console.error('Error loading ranks data:', error);
            this.ranks = {};
        }
    }

    private saveActivity(): void {
        try {
            fs.writeFileSync(this.activityPath, JSON.stringify(this.activity, null, 4));
        } catch (error) {
            console.error('Error saving activity data:', error);
        }
    }

    public incrementUserMessageCount(userId: string, groupId?: string): void {
        if (!userId) return;

        if (!this.activity[userId]) {
            this.activity[userId] = {
                messageCount: 0,
                groupsActivity: {}
            };
        }

        this.activity[userId].messageCount++;

        if (groupId) {
            if (!this.activity[userId].groupsActivity[groupId]) {
                this.activity[userId].groupsActivity[groupId] = 0;
            }
            this.activity[userId].groupsActivity[groupId]++;
        }

        this.saveActivity();
    }

    public getUserRank(userId: string): { rankKey: string, rank: Rank } | null {
        if (!userId) return null;

        // Si el usuario no tiene un registro de actividad pero está solicitando su rango,
        // le asignamos el rango de Cabo automáticamente (asumimos que ha enviado al menos este mensaje)
        if (!this.activity[userId]) {
            const caboRank = Object.entries(this.ranks)
                .find(([key]) => key === 'cabo');

            if (caboRank) {
                return { rankKey: caboRank[0], rank: caboRank[1] };
            }
            return null;
        }

        const messageCount = this.activity[userId].messageCount;
        const sortedRanks = Object.entries(this.ranks)
            .sort(([, a], [, b]) => a.minMessages - b.minMessages);

        for (const [key, rank] of sortedRanks) {
            if (messageCount >= rank.minMessages && messageCount <= rank.maxMessages) {
                return { rankKey: key, rank };
            }
        }

        if (sortedRanks.length > 0) {
            const [key, rank] = sortedRanks[0];
            return { rankKey: key, rank };
        }

        return null;
    }

    public getNextRank(currentRankKey: string): { name: string; emoji: string; minMessages: number } | null {
        const sortedRanks = Object.entries(this.ranks)
            .sort(([, a], [, b]) => a.minMessages - b.minMessages);

        const currentRankIndex = sortedRanks.findIndex(([key]) => key === currentRankKey);

        if (currentRankIndex >= 0 && currentRankIndex < sortedRanks.length - 1) {
            const [, nextRank] = sortedRanks[currentRankIndex + 1];
            return {
                name: nextRank.name,
                emoji: nextRank.emoji,
                minMessages: nextRank.minMessages
            };
        }

        return null;
    }

    public getUserMessageCount(userId: string): number {
        if (!userId || !this.activity[userId]) return 0;
        return this.activity[userId].messageCount;
    }

    public getUserGroupMessageCount(userId: string, groupId: string): number {
        if (!userId || !this.activity[userId] || !this.activity[userId].groupsActivity[groupId]) return 0;
        return this.activity[userId].groupsActivity[groupId];
    }

    public getTopUsers(limit: number = 10): { userId: string, messageCount: number, rank: Rank | null }[] {
        return Object.entries(this.activity)
            .map(([userId, data]) => {
                const userRank = this.getUserRank(userId);
                return {
                    userId,
                    messageCount: data.messageCount,
                    rank: userRank ? userRank.rank : null
                };
            })
            .filter(user => user.rank !== null)
            .sort((a, b) => b.messageCount - a.messageCount)
            .slice(0, limit);
    }
}

export default new RankService();
