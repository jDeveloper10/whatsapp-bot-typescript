import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = "AIzaSyCenIV2KMWGXlfvHTpgDbqq_F1Sva_X6RI";
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class GeminiService {
  static async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      console.log('Gemini API response:', JSON.stringify(data, null, 2));
      
      if (data.error && data.error.status === "UNAVAILABLE") {
        // Espera 2 minutos antes de permitir otro intento
        GeminiService.isSleeping = true;
        setTimeout(() => { GeminiService.isSleeping = false; }, 2 * 60 * 1000);
        return "El Gemini está descansando por unos minutos debido a alta demanda, pero los comandos siguen disponibles. Intenta de nuevo más tarde.";
      }
      
      if (GeminiService.isSleeping) {
        return "El Gemini está descansando por unos minutos debido a alta demanda, pero los comandos siguen disponibles. Intenta de nuevo más tarde.";
      }
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
  static isSleeping = false;
} 