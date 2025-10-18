from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import logging
from google import genai
from google.genai import types
from google.genai.errors import APIError

# -----------------------------
# Initialize Flask app
# -----------------------------
app = Flask(__name__)
CORS(app, origins=["http://localhost:4200"])  # ✅ Allow Angular frontend
logging.basicConfig(level=logging.INFO)

# -----------------------------
# Helper function for Gemini API
# -----------------------------
def generate_gemini_response(prompt, response_schema):
    gemini_key = "AIzaSyBpD-lNbfcThIzBjpiw-3Z9pbWw8UcQX_Q"
    if not gemini_key:
        raise ValueError("Clé API Gemini manquante")

    client = genai.Client(api_key=gemini_key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema
        )
    )
    return json.loads(response.text or '{}')


# -----------------------------
# API: Daily Summary
# -----------------------------
@app.route('/api/daily-summary', methods=['POST'])
def daily_summary():
    try:
        data = request.json or {}
        slots = data.get('slots', [])
        tasks = data.get('tasks', [])

        if not slots and not tasks:
            return jsonify({'error': 'Aucun créneau ni tâche fourni'}), 400

        response_schema = types.Schema(
            type=types.Type.OBJECT,
            properties={
                "summary": types.Schema(type=types.Type.STRING, description="Résumé concis et clair de la journée."),
                "items": types.Schema(
                    type=types.Type.ARRAY,
                    description="Liste des créneaux et tâches.",
                    items=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "type": types.Schema(type=types.Type.STRING, description="Type: 'slot' ou 'task'"),
                            "day": types.Schema(type=types.Type.STRING, description="Jour de la semaine"),
                            "start": types.Schema(type=types.Type.STRING, description="Heure de début (HH:MM)"),
                            "end": types.Schema(type=types.Type.STRING, description="Heure de fin (HH:MM)"),
                            "text": types.Schema(type=types.Type.STRING, description="Description de l'événement ou tâche")
                        },
                        required=["type", "day", "text"]
                    )
                )
            },
            required=["summary", "items"]
        )

        prompt = (
            "You are an English-speaking assistant for Planify.\n"
    "Provide a clear and concise summary of the user's day.\n"
    "Analyze the time blocks and tasks, taking into account their duration and priority.\n"
    "Give a brief perspective on time management and daily strategy.\n"
    "Strict JSON format according to the schema.\n"
    f"Tasks: {json.dumps(tasks, ensure_ascii=False)}\n"
    f"Time blocks: {json.dumps(slots, ensure_ascii=False)}"
        )

        parsed = generate_gemini_response(prompt, response_schema)
        return jsonify(parsed)

    except APIError as e:
        logging.error(f"Daily Summary APIError: {str(e)}")
        return jsonify({'error': f'Erreur API Gemini: {str(e)}'}), 500
    except Exception as e:
        logging.error(f"Daily Summary Exception: {str(e)}")
        return jsonify({'error': f'Erreur Daily Summary inattendue: {str(e)}'}), 500


# -----------------------------
# API: Smart Reminders / Motivational Quotes
# -----------------------------
@app.route('/api/smart-reminders', methods=['POST'])
def smart_reminders():
    try:
        data = request.json or {}
        slots = data.get('slots', [])
        tasks = data.get('tasks', [])

        if not slots and not tasks:
            return jsonify({'error': 'Aucun créneau ni tâche fourni pour générer une citation'}), 400

        response_schema = types.Schema(
            type=types.Type.OBJECT,
            properties={
                "quote": types.Schema(type=types.Type.STRING, description="Citation motivante en français"),
                "context_note": types.Schema(type=types.Type.STRING, description="Pourquoi cette citation est pertinente"),
                "day_status": types.Schema(type=types.Type.STRING, description="Évaluation rapide de la journée: 'busy', 'balanced', 'light'")
            },
            required=["quote", "context_note"]
        )

        prompt = (
            "You are an English-speaking assistant for Planify, specialized in motivation.\n"
    "Analyze the user's tasks and time blocks to understand the tone of the day.\n"
    "Generate a relevant motivational quote and a short explanation of why it applies.\n"
    "Also indicate whether the day seems 'busy', 'balanced', or 'light'.\n"
    "Strict JSON format according to the schema.\n"
    f"Tasks: {json.dumps(tasks, ensure_ascii=False)}\n"
    f"Time blocks: {json.dumps(slots, ensure_ascii=False)}"
        )

        parsed = generate_gemini_response(prompt, response_schema)
        return jsonify(parsed)

    except APIError as e:
        logging.error(f"Smart Reminders APIError: {str(e)}")
        return jsonify({'error': f'Erreur API Gemini: {str(e)}'}), 500
    except Exception as e:
        logging.error(f"Smart Reminders Exception: {str(e)}")
        return jsonify({'error': f'Erreur Smart Reminders inattendue: {str(e)}'}), 500


# -----------------------------
# Run Flask server
# -----------------------------
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5002, debug=True)
