from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
import json
import re
import random
import os
import requests
import time # Added for backoff mechanism

app = Flask(__name__, template_folder='templates', static_folder='static')


class SmartPlanifyGenerator:
    def __init__(self):
        self.days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
        self.task_patterns = {
            'étude': {'duration': 120, 'priority': 'high', 'type': 'focus'},
            'révision': {'duration': 90, 'priority': 'high', 'type': 'focus'},
            'cours': {'duration': 60, 'priority': 'high', 'type': 'fixed'},
            'réunion': {'duration': 60, 'priority': 'medium', 'type': 'meeting'},
            'sport': {'duration': 90, 'priority': 'medium', 'type': 'activity'},
            'pause': {'duration': 30, 'priority': 'low', 'type': 'break'},
            'projet': {'duration': 180, 'priority': 'high', 'type': 'work'}
        }

    def parse_time_slot(self, day, start_time, end_time):
        try:
            start = datetime.strptime(start_time, '%H:%M')
            end = datetime.strptime(end_time, '%H:%M')
            if end <= start:
                raise ValueError("L'heure de fin doit être après l'heure de début")
            return {
                'day': day.lower(),
                'start': start_time,
                'end': end_time,
                'duration': str(end - start)
            }
        except ValueError as e:
            raise ValueError(f"Format d'heure invalide: {e}")

    def parse_voice_text(self, text):
        text = (text or '').lower()
        tasks = []
        day_names = '|'.join(self.days)
        patterns = [
            rf'(?P<day>{day_names})[ ,\-]*?(?P<start>\d{{1,2}}(?:[:h]\d{{1,2}})?)(?:\s*(?:-|à|au)\s*(?P<end>\d{{1,2}}(?:[:h]\d{{1,2}})?))?.*?(?P<task>étude|révision|cours|réunion|sport|projet)',
            rf'(?P<task>étude|révision|cours|réunion|sport|projet)\s*(?:à|a)?\s*(?P<start>\d{{1,2}}(?:[:h]\d{{1,2}})?)(?:\s*(?:-|au|à)\s*(?P<end>\d{{1,2}}(?:[:h]\d{{1,2}})?))?',
            rf'(?P<start>\d{{1,2}}(?:[:h]\d{{1,2}})?)\s*(?:-|à|au)?\s*(?P<task>étude|révision|cours|réunion|sport|projet)'
        ]

        def normalize_time(t):
            if not t:
                return None
            t = t.replace('h', ':')
            if ':' not in t:
                t = t + ':00'
            parts = t.split(':')
            hh = parts[0].zfill(2)
            mm = parts[1].zfill(2) if len(parts) > 1 else '00'
            return f'{hh}:{mm}'

        for pat in patterns:
            for m in re.finditer(pat, text):
                gd = m.groupdict()
                task_type = gd.get('task') or 'étude'
                start = normalize_time(gd.get('start'))
                end = normalize_time(gd.get('end'))
                day = gd.get('day')
                task_obj = {
                    'type': task_type,
                    'text': task_type + (f" {start}" if start else ""),
                    'priority': self.task_patterns.get(task_type, {}).get('priority', 'medium'),
                    'duration': self.task_patterns.get(task_type, {}).get('duration', 60)
                }
                if day:
                    task_obj['day'] = day.lower()
                if start:
                    task_obj['start'] = start
                if end:
                    task_obj['end'] = end
                tasks.append(task_obj)

        if not tasks:
            for t in self.task_patterns.keys():
                if t in text:
                    tasks.append({
                        'type': t,
                        'text': t,
                        'priority': self.task_patterns[t]['priority'],
                        'duration': self.task_patterns[t]['duration']
                    })

        return tasks

    def suggest_optimal_timing(self, free_slots, tasks):
        suggestions = []
        sorted_tasks = sorted(tasks, key=lambda x: {'high': 3, 'medium': 2, 'low': 1}[x.get('priority', 'medium')], reverse=True)
        for task in sorted_tasks:
            best_slot = self.find_best_slot(free_slots, task)
            if best_slot:
                suggestions.append({
                    'task': task['type'],
                    'suggested_time': best_slot,
                    'reason': self.get_suggestion_reason(task, best_slot)
                })
        return suggestions

    def find_best_slot(self, free_slots, task):
        task_duration = task.get('duration', 60)
        task_type = task.get('type', 'work')
        optimal_times = {
            'focus': [(9, 11), (14, 16)],
            'meeting': [(10, 12), (14, 17)],
            'activity': [(7, 9), (18, 20)],
            'break': [(12, 13), (16, 17)]
        }
        best_slots = []
        for slot in free_slots:
            try:
                slot_start = datetime.strptime(slot['start'], '%H:%M').hour
                slot_duration = (datetime.strptime(slot['end'], '%H:%M') - datetime.strptime(slot['start'], '%H:%M')).seconds // 60
            except Exception:
                continue
            if slot_duration >= task_duration:
                score = self.calculate_slot_score(slot_start, task_type, optimal_times)
                best_slots.append({'slot': slot, 'score': score})
        return max(best_slots, key=lambda x: x['score'])['slot'] if best_slots else None

    def calculate_slot_score(self, start_hour, task_type, optimal_times):
        base_score = 50
        if task_type in optimal_times:
            for optimal_start, optimal_end in optimal_times[task_type]:
                if optimal_start <= start_hour <= optimal_end:
                    base_score += 30
        if 8 <= start_hour <= 10:
            base_score += 20
        return base_score + random.randint(-5, 5)

    def get_suggestion_reason(self, task, slot):
        reasons = {
            'focus': 'Période optimale pour la concentration',
            'meeting': 'Horaire professionnel idéal',
            'activity': 'Moment parfait pour l\'activité physique',
            'work': 'Créneau productif recommandé'
        }
        return reasons.get(task.get('type', 'work'), 'Créneau disponible adapté')

    def generate_smart_calendar(self, free_slots, tasks, suggestions):
        calendar = {day: [] for day in self.days}
        for slot in free_slots:
            day = slot['day'].lower()
            if day in calendar:
                calendar[day].append({
                    'type': 'free',
                    'start': slot['start'],
                    'end': slot['end'],
                    'title': 'Temps libre'
                })
        for suggestion in suggestions:
            slot = suggestion['suggested_time']
            day = slot['day'].lower()
            if day in calendar:
                calendar[day].append({
                    'type': 'task',
                    'start': slot['start'],
                    'end': slot['end'],
                    'title': suggestion['task'].title(),
                    'reason': suggestion['reason']
                })
        for t in tasks:
            d = t.get('day')
            if d and d.lower() in calendar:
                entry = {
                    'type': 'task',
                    'start': t.get('start', ''),
                    'end': t.get('end', ''),
                    'title': t.get('type', '').title(),
                    'text': t.get('text', '')
                }
                calendar[d.lower()].append(entry)
        for day in calendar:
            calendar[day].sort(key=lambda x: x.get('start') or '')
        return calendar

    def generate_schedule(self, time_slots, tasks=None, voice_input=None):
        parsed_tasks = []
        if voice_input:
            parsed_tasks = self.parse_voice_text(voice_input)
        if tasks:
            parsed_tasks.extend(tasks)
        suggestions = self.suggest_optimal_timing(time_slots, parsed_tasks) if parsed_tasks else []
        calendar = self.generate_smart_calendar(time_slots, parsed_tasks, suggestions)
        return {
            'calendar': calendar,
            'suggestions': suggestions,
            'tasks': parsed_tasks,
            'total_slots': len(time_slots),
            'generated_at': datetime.now().isoformat(),
            'ai_powered': True
        }


planify = SmartPlanifyGenerator()

@app.route('/')
def index():
    # Assuming 'index.html' exists in a 'templates' folder.
    return render_template('index.html')


@app.route('/api/generate', methods=['POST'])
def generate_schedule_api():
    try:
        data = request.json
        slots = data.get('slots', [])
        tasks = data.get('tasks', [])
        voice_input = data.get('voice_input', '')
        if not slots:
            return jsonify({'error': 'Aucun créneau fourni'}), 400
        parsed_slots = [planify.parse_time_slot(slot['day'], slot['start'], slot['end']) for slot in slots]
        schedule = planify.generate_schedule(parsed_slots, tasks, voice_input)
        return jsonify(schedule)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/voice-parse', methods=['POST'])
def voice_parse_api():
    # Helper endpoint for script.js to call parse_voice_text
    try:
        data = request.json
        text = data.get('text', '')
        parsed_tasks = planify.parse_voice_text(text)
        return jsonify({'tasks': parsed_tasks})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/ai-assist', methods=['POST'])
def ai_assist():
    try:
        data = request.json or {}
        question = data.get('question', '').strip()
        slots = data.get('slots', [])
        tasks = data.get('tasks', [])

        if not question:
            return jsonify({'error': 'Aucune question fournie'}), 400

        # Retrieve the API key from the environment variable
        api_key = os.environ.get('GEMINI_API_KEY')
        
        if not api_key:
            return jsonify({'error': 'GEMINI_API_KEY non configurée sur le serveur. Veuillez configurer la variable d\'environnement.'}), 400

        system_prompt = (
            "Tu es un assistant francophone intégré à Planify. "
            "Ton rôle est d'analyser les créneaux et tâches de l'utilisateur pour répondre à sa question. "
            "Si la question concerne le planning, utilise les données. "
            "Réponds UNIQUEMENT en JSON au format : "
            "{\"summary\": \"texte\", \"items\": [{\"type\":\"slot|task\",\"day\":\"lundi\",\"start\":\"HH:MM\",\"end\":\"HH:MM\",\"text\":\"...\"}, ...]} "
            "Le 'summary' doit contenir la réponse textuelle. Les 'items' sont optionnels si tu peux les extraire directement. "
            "Exemple: Si l'utilisateur demande 'Quelles tâches pour lundi?', tu listes les tâches de lundi dans 'items' et tu résumes dans 'summary'."
        )

        user_content = {"question": question, "slots": slots, "tasks": tasks}
        prompt = (
            f"Question de l'utilisateur: {question}\n\n"
            f"Contexte du calendrier (Créneaux disponibles et Tâches planifiées):\n"
            f"Créneaux: {json.dumps(slots, ensure_ascii=False)}\n"
            f"Tâches: {json.dumps(tasks, ensure_ascii=False)}"
        )
        
        model = "gemini-2.5-flash"
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            # --- FIX: Changed 'config' to 'generationConfig' ---
            "generationConfig": {
                "responseMimeType": "application/json",
                # The schema ensures the model returns the expected JSON structure
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "summary": {"type": "STRING", "description": "The textual answer to the user's question."},
                        "items": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "type": {"type": "STRING", "enum": ["slot", "task"]},
                                    "day": {"type": "STRING"},
                                    "start": {"type": "STRING", "description": "HH:MM format"},
                                    "end": {"type": "STRING", "description": "HH:MM format"},
                                    "text": {"type": "STRING", "description": "Short description or title of the item"}
                                }
                            }
                        }
                    }
                }
            }
        }

        # Implementing a simple retry mechanism with exponential backoff
        max_retries = 3
        backoff_factor = 2
        resp = None

        for attempt in range(max_retries):
            try:
                # Add the system prompt to the payload structure correctly
                payload_with_system = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "systemInstruction": {"parts": [{"text": system_prompt}]},
                    # --- FIX: Changed 'config' to 'generationConfig' here too ---
                    "generationConfig": payload["generationConfig"] 
                }
                
                resp = requests.post(url, headers=headers, json=payload_with_system, timeout=20)
                if resp.status_code == 200:
                    break  # Success
                elif resp.status_code == 429 and attempt < max_retries - 1: # Rate Limit Error
                    time.sleep(backoff_factor ** attempt)
                else:
                    return jsonify({'error': f'Gemini API error {resp.status_code}: {resp.text}'}), 502
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    time.sleep(backoff_factor ** attempt)
                else:
                    return jsonify({'error': f'Erreur de connexion à l\'API Gemini: {str(e)}'}), 503

        if resp is None or resp.status_code != 200:
             return jsonify({'error': 'Échec de la communication avec l\'API Gemini après plusieurs tentatives.'}), 504

        res_json = resp.json()
        
        try:
            ai_text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            # The model is forced to return JSON, so we expect the text part to be a valid JSON string
            parsed = json.loads(ai_text)
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            # Fallback if the response format is unexpected
            parsed = {"summary": "Je n'ai pas pu traiter la réponse de l'assistant IA. Le format JSON était incorrect.", "items": []}
            
        return jsonify({'reply': parsed})

    except Exception as e:
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500


if __name__ == '__main__':
    # Make sure to run the following command in PowerShell before starting the server:
    # $env:GEMINI_API_KEY="YOUR_API_KEY_HERE"
    app.run(host='127.0.0.1', port=5000, debug=True)
