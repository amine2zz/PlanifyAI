from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from voice_ai import VoiceAI
from ai_suggestions_enhanced import AICalendarSuggestions
import json
import os
import requests
import time

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost:3306/planifyai'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
voice_ai = VoiceAI()
ai_suggestions = AICalendarSuggestions()

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

@app.route('/api/events', methods=['GET'])
def get_events():
    events = Event.query.all()
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

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    from sqlalchemy import func
    
    # Category breakdown
    category_stats = db.session.query(
        Event.category,
        func.count(Event.id).label('count')
    ).group_by(Event.category).all()
    
    # Weekly stats
    week_ago = datetime.now().date() - timedelta(days=7)
    weekly_events = Event.query.filter(Event.date >= week_ago).count()
    
    return jsonify({
        'categories': [{'name': stat.category, 'count': stat.count} for stat in category_stats],
        'weeklyEvents': weekly_events,
        'totalEvents': Event.query.count()
    })

@app.route('/api/ai/process-voice', methods=['POST'])
def process_voice():
    data = request.get_json()
    result = voice_ai.process_voice_command(data.get('transcript', ''))
    return jsonify(result)

@app.route('/api/ai/suggestions', methods=['GET'])
def get_ai_suggestions():
    # Get all events for analysis
    events = Event.query.all()
    events_data = [{
        'id': e.id,
        'title': e.title,
        'description': e.description,
        'date': e.date.isoformat(),
        'startTime': e.start_time,
        'endTime': e.end_time,
        'category': e.category,
        'priority': e.priority
    } for e in events]
    
    # Generate AI suggestions
    suggestions = ai_suggestions.analyze_calendar_patterns(events_data)
    
    return jsonify({
        'suggestions': suggestions,
        'totalEvents': len(events_data),
        'analysisDate': datetime.now().isoformat()
    })

@app.route('/api/ai/apply-suggestion', methods=['POST'])
def apply_suggestion():
    data = request.get_json()
    suggestion = data.get('suggestion')
    
    if not suggestion:
        return jsonify({'error': 'No suggestion provided'}), 400
    
    try:
        result = apply_suggestion_to_database(suggestion)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def apply_suggestion_to_database(suggestion):
    """Apply a suggestion by modifying the database"""
    suggestion_type = suggestion.get('type')
    
    if suggestion_type == 'shorten_meeting':
        event_id = suggestion.get('event_id')
        event = Event.query.get_or_404(event_id)
        changes = suggestion.get('suggested_changes', {})
        
        if 'end_time' in changes:
            event.end_time = changes['end_time']
            db.session.commit()
            return {'message': f'Shortened "{event.title}" successfully', 'modified_event': event.id}
    
    elif suggestion_type == 'add_buffer':
        event_id = suggestion.get('event_id')
        event = Event.query.get_or_404(event_id)
        changes = suggestion.get('suggested_changes', {})
        
        if 'start_time' in changes and 'end_time' in changes:
            event.start_time = changes['start_time']
            event.end_time = changes['end_time']
            db.session.commit()
            return {'message': f'Added buffer time for "{event.title}"', 'modified_event': event.id}
    
    elif suggestion_type == 'reschedule_optimal':
        event_id = suggestion.get('event_id')
        event = Event.query.get_or_404(event_id)
        changes = suggestion.get('suggested_changes', {})
        
        if 'start_time' in changes and 'end_time' in changes:
            event.start_time = changes['start_time']
            event.end_time = changes['end_time']
            db.session.commit()
            return {'message': f'Rescheduled "{event.title}" to optimal time', 'modified_event': event.id}
    
    elif suggestion_type == 'combine_meetings':
        event_ids = suggestion.get('event_ids', [])
        if len(event_ids) >= 2:
            # Get the events
            events = [Event.query.get_or_404(eid) for eid in event_ids]
            changes = suggestion.get('suggested_changes', {})
            
            # Update the first event
            first_event = events[0]
            first_event.title = changes.get('new_title', first_event.title)
            first_event.start_time = changes.get('start_time', first_event.start_time)
            first_event.end_time = changes.get('end_time', first_event.end_time)
            
            # Delete the second event
            if changes.get('delete_second'):
                db.session.delete(events[1])
            
            db.session.commit()
            return {'message': f'Combined meetings successfully', 'modified_event': first_event.id, 'deleted_event': events[1].id}
    
    elif suggestion_type == 'add_lunch_break':
        changes = suggestion.get('suggested_changes', {})
        new_event_data = changes.get('new_event', {})
        
        if new_event_data:
            event = Event(
                title=new_event_data['title'],
                description=new_event_data.get('description', ''),
                date=datetime.fromisoformat(new_event_data['date']).date(),
                start_time=new_event_data['start_time'],
                end_time=new_event_data['end_time'],
                category=new_event_data.get('category', 'personal'),
                priority=new_event_data.get('priority', 'medium')
            )
            db.session.add(event)
            db.session.commit()
            return {'message': 'Added lunch break successfully', 'created_event': event.id}
    
    elif suggestion_type == 'consolidate_work':
        event_ids = suggestion.get('event_ids', [])
        changes = suggestion.get('suggested_changes', {})
        new_event_data = changes.get('new_event', {})
        
        if event_ids and new_event_data:
            # Delete original events
            if changes.get('delete_originals'):
                for event_id in event_ids:
                    event = Event.query.get(event_id)
                    if event:
                        db.session.delete(event)
            
            # Create consolidated event
            event = Event(
                title=new_event_data['title'],
                description=new_event_data.get('description', ''),
                date=datetime.fromisoformat(new_event_data['date']).date(),
                start_time=new_event_data['start_time'],
                end_time=new_event_data['end_time'],
                category=new_event_data.get('category', 'work'),
                priority=new_event_data.get('priority', 'high')
            )
            db.session.add(event)
            db.session.commit()
            return {'message': 'Consolidated work tasks successfully', 'created_event': event.id, 'deleted_events': event_ids}
    
    elif suggestion_type == 'adjust_priority':
        event_id = suggestion.get('event_id')
        event = Event.query.get_or_404(event_id)
        changes = suggestion.get('suggested_changes', {})
        
        if 'priority' in changes:
            event.priority = changes['priority']
            db.session.commit()
            return {'message': f'Updated priority for "{event.title}"', 'modified_event': event.id}
    
    elif suggestion_type == 'add_description':
        event_id = suggestion.get('event_id')
        event = Event.query.get_or_404(event_id)
        changes = suggestion.get('suggested_changes', {})
        
        if 'description' in changes:
            event.description = changes['description']
            db.session.commit()
            return {'message': f'Added description to "{event.title}"', 'modified_event': event.id}
    
    elif suggestion_type == 'fix_time':
        event_id = suggestion.get('event_id')
        event = Event.query.get_or_404(event_id)
        changes = suggestion.get('suggested_changes', {})
        
        if 'start_time' in changes and 'end_time' in changes:
            event.start_time = changes['start_time']
            event.end_time = changes['end_time']
            db.session.commit()
            return {'message': f'Fixed time for "{event.title}"', 'modified_event': event.id}
    
    elif suggestion_type in ['add_weekly_lunch', 'add_weekly_planning', 'add_exercise_routine', 'add_learning_time', 'optimize_focus_time']:
        changes = suggestion.get('suggested_changes', {})
        recurring_events = changes.get('recurring_events', [])
        
        created_events = []
        for recurring_event in recurring_events:
            days = recurring_event.get('days', [])
            
            # Create events for the next 4 weeks
            today = datetime.now().date()
            for week in range(4):
                week_start = today + timedelta(days=(7 * week) - today.weekday())
                
                for day_name in days:
                    day_offset = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].index(day_name)
                    event_date = week_start + timedelta(days=day_offset)
                    
                    # Skip past dates
                    if event_date < today:
                        continue
                    
                    event = Event(
                        title=recurring_event['title'],
                        description=recurring_event.get('description', ''),
                        date=event_date,
                        start_time=recurring_event['start_time'],
                        end_time=recurring_event['end_time'],
                        category=recurring_event.get('category', 'general'),
                        priority=recurring_event.get('priority', 'medium')
                    )
                    db.session.add(event)
                    created_events.append(event_date.isoformat())
        
        db.session.commit()
        return {'message': f'Created recurring events for next 4 weeks', 'created_dates': created_events}
    
    return {'error': 'Suggestion type not supported or invalid data'}

# --- AI ASSIST endpoint for chatbot ---
@app.route('/api/ai-assist', methods=['POST'])
def ai_assist():
    try:
        data = request.get_json() or {}
        question = (data.get('question') or '').strip()
        if not question:
            return jsonify({'error': 'Aucune question fournie'}), 400

        # Fetch events from DB
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

        # Prepare prompt for Gemini
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

        model = "gemini-2.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # Simple retry logic
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
    app.run(debug=True, port=5000)