import axios from 'axios';

interface WikiSearchResult {
    title: string;
    snippet: string;
    pageid: number;
}

interface UnsplashImage {
    urls: {
        regular: string;
    };
    alt_description: string;
}

export class SearchUtils {
    private static readonly WIKIPEDIA_API = 'https://es.wikipedia.org/w/api.php';
    private static readonly UNSPLASH_API = 'https://api.unsplash.com/photos/random';

    static async searchWikipedia(query: string): Promise<{ title: string, extract: string } | null> {
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

            const response = await axios.get(`${this.WIKIPEDIA_API}?${params}`);
            const result = response.data.query.search[0] as WikiSearchResult;

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

            const pageResponse = await axios.get(`${this.WIKIPEDIA_API}?${pageParams}`);
            const extract = pageResponse.data.query.pages[result.pageid].extract;

            return {
                title: result.title,
                extract: extract || result.snippet
            };
        } catch (error) {
            console.error('Error searching Wikipedia:', error);
            return null;
        }
    }

    static async searchImage(query: string): Promise<string | null> {
        try {
            // Usar directamente la URL de búsqueda de Unsplash
            const encodedQuery = encodeURIComponent(query);
            const imageUrl = `https://source.unsplash.com/1600x900/?${encodedQuery}`;

            // Verificar que la imagen existe
            const response = await axios.head(imageUrl);
            if (response.status === 200) {
                return imageUrl;
            }

            return null;
        } catch (error) {
            console.error('Error searching image:', error);
            return null;
        }
    }
}