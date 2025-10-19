from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
import json
import os
import requests
import time
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func # Import func here for clarity

# Flask app: serves Angular static build (in static/) and provides API endpoints
app = Flask(__name__, template_folder='static', static_folder='static')
CORS(app)

# Configure your database (adjust credentials as needed)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost:3306/planifyai'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database model
class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)
    end_time = db.Column(db.String(10), nullable=False)
    category = db.Column(db.String(50), default='general')
    priority = db.Column(db.Enum('low', 'medium', 'high'), default='medium')

with app.app_context():
    db.create_all()

# Serve Angular app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return render_template("index.html")

# Events CRUD
@app.route('/api/events', methods=['GET'])
def get_events():
    events = Event.query.order_by(Event.date, Event.start_time).all()
    return jsonify([{
        'id': e.id,
        'title': e.title,
        'description': e.description,
        'date': e.date.isoformat(),
        'startTime': e.start_time,
        'endTime': e.end_time,
        'category': e.category,
        'priority': e.priority
    } for e in events])

@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.get_json()
    event = Event(
        title=data['title'],
        description=data.get('description', ''),
        date=datetime.fromisoformat(data['date']).date(),
        start_time=data['startTime'],
        end_time=data['endTime'],
        category=data.get('category', 'general'),
        priority=data.get('priority', 'medium')
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({'id': event.id}), 201

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    event = Event.query.get_or_404(event_id)
    data = request.get_json()
    event.title = data.get('title', event.title)
    event.description = data.get('description', event.description)
    if 'date' in data:
        event.date = datetime.fromisoformat(data['date']).date()
    event.start_time = data.get('startTime', event.start_time)
    event.end_time = data.get('endTime', event.end_time)
    event.category = data.get('category', event.category)
    event.priority = data.get('priority', event.priority)
    db.session.commit()
    return jsonify({'message': 'Event updated'})

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Event deleted'})

# Analytics
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    # func imported above for SQLAlchemy
    category_stats = db.session.query(
        Event.category,
        func.count(Event.id).label('count')
    ).group_by(Event.category).all()

    week_ago = datetime.now().date() - timedelta(days=7)
    weekly_events = Event.query.filter(Event.date >= week_ago).count()

    return jsonify({
        'categories': [{'name': stat.category, 'count': stat.count} for stat in category_stats],
        'weeklyEvents': weekly_events,
        'totalEvents': Event.query.count()
    })

# --- AI ASSIST endpoint (NO voice) ---
@app.route('/api/ai-assist', methods=['POST'])
def ai_assist():
    try:
        data = request.get_json() or {}
        question = (data.get('question') or '').strip()
        if not question:
            return jsonify({'error': 'Aucune question fournie'}), 400

        # Fetch events from DB to include in prompt (grouped by day)
        events = Event.query.order_by(Event.date, Event.start_time).all()
        events_payload = []
        for e in events:
            events_payload.append({
                'id': e.id,
                'title': e.title,
                'description': e.description or '',
                'date': e.date.isoformat(),
                'startTime': e.start_time,
                'endTime': e.end_time,
                'category': e.category,
                'priority': e.priority
            })

        # Build a concise context for the model
        context = {
            'events_count': len(events_payload),
            'events_sample': events_payload[:200]  # won't actually be 200 items, just limit amount
        }

        # Prepare prompt for the Gemini model (or any LLM you use)
        system_prompt = (
            "Tu es un assistant francophone intégré à Planify. "
            "Ton rôle : répondre aux questions sur le calendrier de l'utilisateur en utilisant uniquement les événements fournis. "
            "Réponds UNIQUEMENT en JSON au format : "
            "{\"summary\":\"texte court\", \"items\": [{\"type\":\"task\",\"day\":\"lundi|YYYY-MM-DD\",\"start\":\"HH:MM\",\"end\":\"HH:MM\",\"text\":\"...\"}, ...]}.\n"
            "Si tu ne peux pas répondre à partir des données, indique-le clairement dans le summary.\n"
        )

        prompt = (
            f"Question: {question}\n\n"
            f"Contexte - événements ({len(events_payload)}):\n"
            f"{json.dumps(events_payload, ensure_ascii=False)}\n\n"
            "Réponds au format JSON demandé."
        )

        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return jsonify({'error': 'GEMINI_API_KEY non configurée sur le serveur.'}), 400

        # *** CHANGE MADE HERE: Updated model from gemini-1.5-flash to gemini-2.5-flash ***
        model = "gemini-2.5-flash"
        # ********************************************************************************

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # simple retry/backoff
        max_retries = 3
        backoff = 1
        resp = None
        for attempt in range(max_retries):
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=25)
                if resp.status_code == 200:
                    break
                elif resp.status_code == 429 and attempt < max_retries - 1:
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    return jsonify({'error': f'Gemini API error {resp.status_code}: {resp.text}'}), 502
            except requests.RequestException as ex:
                if attempt < max_retries - 1:
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    return jsonify({'error': f'Erreur de connexion à l\'API Gemini: {str(ex)}'}), 503

        if resp is None or resp.status_code != 200:
            return jsonify({'error': 'Échec de la communication avec l\'API Gemini.'}), 504

        res_json = resp.json()
        try:
            ai_text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            parsed = json.loads(ai_text)
        except Exception:
            parsed = {"summary": "Je n'ai pas pu traiter la réponse de l'assistant IA. Le format JSON était incorrect.", "items": []}

        return jsonify({'reply': parsed})

    except Exception as e:
        return jsonify({'error': f'Erreur interne du serveur: {str(e)}'}), 500


if __name__ == '__main__':
    # export GEMINI_API_KEY before running (PowerShell: $env:GEMINI_API_KEY="..." )
    app.run(host='127.0.0.1', port=5000, debug=True)