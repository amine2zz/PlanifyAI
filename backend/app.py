from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from voice_ai import VoiceAI

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost:3306/planifyai'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
voice_ai = VoiceAI()

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
        date=datetime.fromisoformat(data['date']),
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
    event.date = datetime.fromisoformat(data['date']) if 'date' in data else event.date
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)