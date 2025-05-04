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
const timeUtils_1 = require("../utils/timeUtils");
const command = {
    name: 'estado',
    description: 'Muestra el estado del bot y su tiempo de respuesta',
    adminOnly: false,
    execute: (msg, args) => __awaiter(void 0, void 0, void 0, function* () {
        const [, responseTime] = yield (0, timeUtils_1.measureResponseTime)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield msg.reply('✅ Bot activo y funcionando');
        }));
        yield msg.reply(`⚡ Tiempo de respuesta: ${(0, timeUtils_1.formatResponseTime)(responseTime)}`);
    })
};
exports.default = command;
