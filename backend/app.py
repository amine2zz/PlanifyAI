from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import json
import os
from ai_engine import AIEngine
from voice_ai import VoiceAI
from database import db, Event, TimeBlock, UserPreference

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/planifyai'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

db.init_app(app)
ai_engine = AIEngine()
voice_ai = VoiceAI()

# Create tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return jsonify({
        'message': 'PlanifyAI Backend API',
        'version': '1.0.0',
        'status': 'running'
    })

# Event Management Routes
@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        events = Event.query.all()
        return jsonify([{
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'date': event.date.isoformat(),
            'startTime': event.start_time,
            'endTime': event.end_time,
            'category': event.category,
            'priority': event.priority,
            'isRecurring': event.is_recurring,
            'recurringPattern': event.recurring_pattern
        } for event in events])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events', methods=['POST'])
def create_event():
    try:
        data = request.get_json()
        
        event = Event(
            title=data['title'],
            description=data.get('description', ''),
            date=datetime.fromisoformat(data['date'].replace('Z', '+00:00')),
            start_time=data['startTime'],
            end_time=data['endTime'],
            category=data.get('category', 'general'),
            priority=data.get('priority', 'medium'),
            is_recurring=data.get('isRecurring', False),
            recurring_pattern=data.get('recurringPattern', '')
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'id': event.id,
            'message': 'Event created successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        event = Event.query.get_or_404(event_id)
        data = request.get_json()
        
        event.title = data.get('title', event.title)
        event.description = data.get('description', event.description)
        event.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00')) if 'date' in data else event.date
        event.start_time = data.get('startTime', event.start_time)
        event.end_time = data.get('endTime', event.end_time)
        event.category = data.get('category', event.category)
        event.priority = data.get('priority', event.priority)
        
        db.session.commit()
        
        return jsonify({'message': 'Event updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        event = Event.query.get_or_404(event_id)
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({'message': 'Event deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/date/<date>', methods=['GET'])
def get_events_by_date(date):
    try:
        target_date = datetime.fromisoformat(date)
        events = Event.query.filter(Event.date == target_date.date()).all()
        
        return jsonify([{
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'date': event.date.isoformat(),
            'startTime': event.start_time,
            'endTime': event.end_time,
            'category': event.category,
            'priority': event.priority
        } for event in events])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# AI Features Routes
@app.route('/api/ai/suggestions', methods=['GET'])
def get_ai_suggestions():
    try:
        suggestions = ai_engine.generate_suggestions()
        return jsonify(suggestions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/optimize-schedule', methods=['POST'])
def optimize_schedule():
    try:
        preferences = request.get_json()
        optimized_schedule = ai_engine.optimize_schedule(preferences)
        return jsonify(optimized_schedule)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/productivity-analysis', methods=['GET'])
def analyze_productivity():
    try:
        analysis = ai_engine.analyze_productivity_patterns()
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/smart-reminders', methods=['GET'])
def get_smart_reminders():
    try:
        reminders = ai_engine.generate_smart_reminders()
        return jsonify(reminders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/find-meeting-time', methods=['POST'])
def find_optimal_meeting_time():
    try:
        data = request.get_json()
        participants = data.get('participants', [])
        duration = data.get('duration', 60)
        preferences = data.get('preferences', {})
        
        optimal_time = ai_engine.find_optimal_meeting_time(participants, duration, preferences)
        return jsonify(optimal_time)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/predict-duration', methods=['POST'])
def predict_event_duration():
    try:
        data = request.get_json()
        event_type = data.get('eventType', '')
        description = data.get('description', '')
        
        predicted_duration = ai_engine.predict_duration(event_type, description)
        return jsonify({'duration': predicted_duration})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Voice AI Routes
@app.route('/api/ai/process-voice', methods=['POST'])
def process_voice_command():
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')
        
        if not transcript:
            return jsonify({'error': 'No transcript provided'}), 400
        
        result = voice_ai.process_voice_command(transcript)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        # Process chat message with AI
        response = ai_engine.process_chat_message(message)
        return jsonify({
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/personalized-insights', methods=['GET'])
def get_personalized_insights():
    try:
        insights = ai_engine.generate_personalized_insights()
        return jsonify(insights)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/optimal-schedule', methods=['POST'])
def get_optimal_schedule():
    try:
        preferences = request.get_json()
        optimal_schedule = ai_engine.create_optimal_schedule(preferences)
        return jsonify(optimal_schedule)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Time Block Management
@app.route('/api/time-blocks/<date>', methods=['GET'])
def get_time_blocks(date):
    try:
        target_date = datetime.fromisoformat(date)
        time_blocks = TimeBlock.query.filter(TimeBlock.date == target_date.date()).all()
        
        return jsonify([{
            'id': block.id,
            'title': block.title,
            'date': block.date.isoformat(),
            'startTime': block.start_time,
            'endTime': block.end_time,
            'type': block.block_type,
            'description': block.description
        } for block in time_blocks])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/time-blocks', methods=['POST'])
def create_time_block():
    try:
        data = request.get_json()
        
        time_block = TimeBlock(
            title=data['title'],
            date=datetime.fromisoformat(data['date'].replace('Z', '+00:00')),
            start_time=data['startTime'],
            end_time=data['endTime'],
            block_type=data.get('type', 'focus'),
            description=data.get('description', '')
        )
        
        db.session.add(time_block)
        db.session.commit()
        
        return jsonify({
            'id': time_block.id,
            'message': 'Time block created successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics Routes
@app.route('/api/analytics/productivity', methods=['GET'])
def get_productivity_metrics():
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        metrics = ai_engine.calculate_productivity_metrics(start_date, end_date)
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/insights', methods=['GET'])
def get_calendar_insights():
    try:
        insights = ai_engine.generate_calendar_insights()
        return jsonify(insights)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health Check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'database': 'connected'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)