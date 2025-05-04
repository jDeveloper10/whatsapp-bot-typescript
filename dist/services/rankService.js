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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class RankService {
    constructor() {
        this.activityPath = path.join(__dirname, '..', 'data', 'activity.json');
        this.rolesPath = path.join(__dirname, '..', 'data', 'roles.json');
        this.activity = {};
        this.ranks = {};
        this.loadActivity();
        this.loadRanks();
    }
    loadActivity() {
        try {
            if (!fs.existsSync(this.activityPath)) {
                this.activity = {};
                this.saveActivity();
            }
            else {
                const data = fs.readFileSync(this.activityPath, 'utf8').trim();
                this.activity = data === '' || data === '{}' ? {} : JSON.parse(data);
            }
        }
        catch (error) {
            console.error('Error loading activity data:', error);
            this.activity = {};
            this.saveActivity(); // Attempt to fix corrupted file
        }
    }
    loadRanks() {
        try {
            const data = fs.readFileSync(this.rolesPath, 'utf8');
            const rolesData = JSON.parse(data);
            this.ranks = rolesData.ranks || {};
        }
        catch (error) {
            console.error('Error loading ranks data:', error);
            this.ranks = {};
        }
    }
    saveActivity() {
        try {
            fs.writeFileSync(this.activityPath, JSON.stringify(this.activity, null, 4));
        }
        catch (error) {
            console.error('Error saving activity data:', error);
        }
    }
    incrementUserMessageCount(userId, groupId) {
        if (!userId)
            return;
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
    getUserRank(userId) {
        if (!userId)
            return null;
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
    getNextRank(currentRankKey) {
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
    getUserMessageCount(userId) {
        if (!userId || !this.activity[userId])
            return 0;
        return this.activity[userId].messageCount;
    }
    getUserGroupMessageCount(userId, groupId) {
        if (!userId || !this.activity[userId] || !this.activity[userId].groupsActivity[groupId])
            return 0;
        return this.activity[userId].groupsActivity[groupId];
    }
    getTopUsers(limit = 10) {
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
exports.RankService = RankService;
exports.default = new RankService();
