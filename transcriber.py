from flask import Flask, request, jsonify
import whisper
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
logger.info("Cargando modelo Whisper...")
model = whisper.load_model("base")
logger.info("Modelo Whisper cargado correctamente")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        logger.info("Recibida solicitud de transcripción")
        if 'audio' not in request.files:
            logger.error("No se encontró archivo de audio en la solicitud")
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio = request.files['audio']
        audio_path = 'temp_audio.ogg'
        logger.info(f"Guardando audio temporal en: {audio_path}")
        audio.save(audio_path)
        
        logger.info("Iniciando transcripción con Whisper...")
        result = model.transcribe(audio_path)
        logger.info(f"Transcripción completada: {result['text']}")
        
        logger.info("Eliminando archivo temporal")
        os.remove(audio_path)
        
        return jsonify({'text': result['text']})
    except Exception as e:
        logger.error(f"Error en transcripción: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Iniciando servidor de transcripción en puerto 5005...")
    app.run(port=5005) 