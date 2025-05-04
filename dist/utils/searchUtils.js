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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchUtils = void 0;
const axios_1 = __importDefault(require("axios"));
class SearchUtils {
    static searchWikipedia(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams({
                    action: 'query',
                    format: 'json',
                    list: 'search',
                    srsearch: query,
                    utf8: '1',
                    srlimit: '1',
                    origin: '*'
                });
                const response = yield axios_1.default.get(`${this.WIKIPEDIA_API}?${params}`);
                const result = response.data.query.search[0];
                if (!result) {
                    return null;
                }
                // Get full page extract
                const pageParams = new URLSearchParams({
                    action: 'query',
                    format: 'json',
                    prop: 'extracts',
                    exintro: '1',
                    explaintext: '1',
                    pageids: result.pageid.toString(),
                    origin: '*'
                });
                const pageResponse = yield axios_1.default.get(`${this.WIKIPEDIA_API}?${pageParams}`);
                const extract = pageResponse.data.query.pages[result.pageid].extract;
                return {
                    title: result.title,
                    extract: extract || result.snippet
                };
            }
            catch (error) {
                console.error('Error searching Wikipedia:', error);
                return null;
            }
        });
    }
    static searchImage(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Usar directamente la URL de búsqueda de Unsplash
                const encodedQuery = encodeURIComponent(query);
                const imageUrl = `https://source.unsplash.com/1600x900/?${encodedQuery}`;
                // Verificar que la imagen existe
                const response = yield axios_1.default.head(imageUrl);
                if (response.status === 200) {
                    return imageUrl;
                }
                return null;
            }
            catch (error) {
                console.error('Error searching image:', error);
                return null;
            }
        });
    }
}
exports.SearchUtils = SearchUtils;
SearchUtils.WIKIPEDIA_API = 'https://es.wikipedia.org/w/api.php';
SearchUtils.UNSPLASH_API = 'https://api.unsplash.com/photos/random';
