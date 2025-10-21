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
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

# -----------------------------
# API: Daily Summary (Simple Version)
# -----------------------------
@app.route('/api/daily-summary', methods=['POST'])
def daily_summary():
    try:
        # Get events from database
        events = Event.query.filter(Event.date >= datetime.now().date()).order_by(Event.date, Event.start_time).limit(10).all()
        
        total_events = len(events)
        categories = {}
        
        items = []
        for event in events:
            categories[event.category] = categories.get(event.category, 0) + 1
            items.append({
                "type": "event",
                "day": event.date.strftime("%A"),
                "start": event.start_time,
                "end": event.end_time,
                "text": f"{event.title} ({event.category})"
            })
        
        # Generate simple summary
        if total_events == 0:
            summary = "Aucun événement prévu pour les prochains jours."
        else:
            top_category = max(categories.keys(), key=categories.get) if categories else "général"
            summary = f"Vous avez {total_events} événements prévus, principalement dans la catégorie {top_category}."
        
        return jsonify({
            "summary": summary,
            "items": items
        })
        
    except Exception as e:
        logging.error(f"Daily Summary Error: {str(e)}")
        return jsonify({'error': 'Erreur lors de la génération du résumé'}), 500

# -----------------------------
# API: Smart Reminders (Simple Version)
# -----------------------------
@app.route('/api/smart-reminders', methods=['POST'])
def smart_reminders():
    try:
        # Get upcoming events count
        today_events = Event.query.filter(Event.date == datetime.now().date()).count()
        week_events = Event.query.filter(Event.date >= datetime.now().date(), 
                                       Event.date <= datetime.now().date() + timedelta(days=7)).count()
        
        quotes = [
            "La productivité n'est jamais un accident. C'est toujours le résultat d'un engagement envers l'excellence.",
            "Le temps est votre ressource la plus précieuse. Utilisez-le sagement.",
            "Chaque minute compte. Planifiez votre succès.",
            "L'organisation est la clé de l'efficacité.",
            "Un calendrier bien géré est un esprit tranquille."
        ]
        
        # Determine day status
        if today_events > 5:
            day_status = "busy"
            context = "Journée chargée en perspective"
        elif today_events > 2:
            day_status = "balanced"
            context = "Journée équilibrée"
        else:
            day_status = "light"
            context = "Journée plus calme"
        
        import random
        selected_quote = random.choice(quotes)
        
        return jsonify({
            "quote": selected_quote,
            "context_note": context,
            "day_status": day_status
        })
        
    except Exception as e:
        logging.error(f"Smart Reminders Error: {str(e)}")
        return jsonify({'error': 'Erreur lors de la génération de la citation'}), 500

# -----------------------------
# AI Mood Predictor
# -----------------------------
def predict_week_mood(events):
    stress_words = ['deadline', 'urgent', 'meeting', 'presentation', 'exam', 'test', 'interview', 'crisis', 'emergency']
    happy_words = ['party', 'vacation', 'celebration', 'lunch', 'dinner', 'birthday', 'wedding', 'fun', 'relax']
    
    stress_score = sum(1 for e in events for word in stress_words if word in e.title.lower())
    happy_score = sum(1 for e in events for word in happy_words if word in e.title.lower())
    
    total_events = len(events)
    
    if happy_score > stress_score and happy_score > 0:
        return {
            'mood': 'Semaine joyeuse',
            'icon': '😊',
            'color': '#28a745',
            'description': f'{happy_score} événements positifs détectés'
        }
    elif stress_score > happy_score * 1.5 and stress_score > 0:
        return {
            'mood': 'Semaine stressante',
            'icon': '😰',
            'color': '#dc3545',
            'description': f'{stress_score} événements stressants détectés'
        }
    elif total_events > 8:
        return {
            'mood': 'Semaine chargée',
            'icon': '😅',
            'color': '#ffc107',
            'description': f'{total_events} événements cette semaine'
        }
    else:
        return {
            'mood': 'Semaine équilibrée',
            'icon': '😌',
            'color': '#17a2b8',
            'description': 'Planning bien équilibré'
        }

# -----------------------------
# AI Productivity Score
# -----------------------------
def calculate_productivity_score(events):
    if not events:
        return {'score': 50, 'level': 'Moyen', 'factors': []}
    
    score = 50  # Base score
    factors = []
    
    # Bonus pour équilibre des catégories
    categories = [e.category for e in events]
    unique_cats = len(set(categories))
    if unique_cats >= 3:
        score += 15
        factors.append('Bonne diversité d\'activités (+15)')
    
    # Malus pour surcharge
    total_events = len(events)
    if total_events > 10:
        score -= 20
        factors.append(f'Surcharge: {total_events} événements (-20)')
    elif total_events < 3:
        score -= 10
        factors.append('Peu d\'activités planifiées (-10)')
    
    # Bonus pour événements positifs
    positive_events = [e for e in events if any(word in e.title.lower() 
                      for word in ['party', 'celebration', 'vacation', 'fun', 'lunch', 'dinner'])]
    if positive_events:
        bonus = len(positive_events) * 5
        score += bonus
        factors.append(f'{len(positive_events)} événements positifs (+{bonus})')
    
    # Malus pour événements stressants
    stress_events = [e for e in events if any(word in e.title.lower() 
                    for word in ['urgent', 'deadline', 'crisis', 'emergency', 'exam'])]
    if stress_events:
        malus = len(stress_events) * 8
        score -= malus
        factors.append(f'{len(stress_events)} événements stressants (-{malus})')
    
    # Bonus pour équilibre travail/personnel
    work_events = len([e for e in events if e.category in ['work', 'meeting']])
    personal_events = len([e for e in events if e.category == 'personal'])
    if work_events > 0 and personal_events > 0:
        score += 10
        factors.append('Bon équilibre travail/personnel (+10)')
    
    # Limiter le score entre 0 et 100
    final_score = min(100, max(0, score))
    
    # Déterminer le niveau
    if final_score >= 80:
        level = 'Excellent'
    elif final_score >= 60:
        level = 'Bon'
    elif final_score >= 40:
        level = 'Moyen'
    else:
        level = 'À améliorer'
    
    return {
        'score': final_score,
        'level': level,
        'factors': factors
    }

# -----------------------------
# Week Label Helper
# -----------------------------
def get_week_label(week_offset):
    if week_offset == 0:
        return "Cette semaine"
    elif week_offset == -1:
        return "Semaine dernière"
    elif week_offset == 1:
        return "Semaine prochaine"
    elif week_offset < 0:
        return f"Il y a {abs(week_offset)} semaines"
    else:
        return f"Dans {week_offset} semaines"

# -----------------------------
# Simple Sentiment Analysis (Fallback)
# -----------------------------
def simple_sentiment_analysis(events):
    # Positive keywords - only based on event names
    positive_words = [
        'wedding', 'party', 'celebration', 'birthday', 'anniversary', 'vacation', 'holiday',
        'success', 'win', 'achievement', 'promotion', 'bonus', 'reward', 'gift',
        'happy', 'joy', 'fun', 'exciting', 'amazing', 'wonderful', 'great', 'excellent',
        'lunch', 'dinner', 'coffee', 'date', 'friend', 'family', 'love', 'concert',
        'movie', 'game', 'sport', 'hobby', 'relax', 'rest', 'spa', 'massage'
    ]
    
    # Negative keywords - only based on event names
    negative_words = [
        'emergency', 'urgent', 'crisis', 'problem', 'issue', 'trouble', 'difficulty',
        'test', 'exam', 'interview', 'deadline', 'stress', 'pressure', 'overtime',
        'sick', 'illness', 'doctor', 'hospital', 'surgery', 'pain', 'injury',
        'funeral', 'death', 'accident', 'repair', 'fix', 'broken', 'cancel',
        'court', 'legal', 'tax', 'bill', 'debt', 'complaint', 'conflict'
    ]
    
    sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0}
    
    for event in events:
        # Only analyze event title and description
        text = (event.title + ' ' + (event.description or '')).lower()
        
        # Count keyword matches
        pos_count = sum(1 for word in positive_words if word in text)
        neg_count = sum(1 for word in negative_words if word in text)
        
        # Determine sentiment based only on keywords
        if pos_count > neg_count:
            sentiment_counts['positive'] += 1
        elif neg_count > pos_count:
            sentiment_counts['negative'] += 1
        else:
            sentiment_counts['neutral'] += 1
    
    total = len(events) or 1
    pos_ratio = sentiment_counts['positive'] / total
    neg_ratio = sentiment_counts['negative'] / total
    
    # Determine overall sentiment
    if pos_ratio > 0.4:
        overall = 'positive'
    elif neg_ratio > 0.3:
        overall = 'negative'
    else:
        overall = 'neutral'
    
    return {
        'overall_sentiment': overall,
        'sentiment_distribution': sentiment_counts,
        'sentiment_score': round((sentiment_counts['positive'] - sentiment_counts['negative']) / total, 2),
        'analyzed_events': total
    }

# -----------------------------
# Sentiment Analysis with Hugging Face
# -----------------------------
def analyze_event_sentiment(events):
    try:
        hf_api_key = os.getenv('HUGGINGFACE_API_KEY')
        if not hf_api_key:
            # Fallback to simple keyword-based sentiment
            return simple_sentiment_analysis(events)
        
        # Collect event titles and descriptions
        texts = []
        for event in events:
            text = event.title
            if event.description:
                text += ' ' + event.description
            texts.append(text)
        
        if not texts:
            return {'overall_sentiment': 'neutral', 'sentiment_distribution': {'positive': 0, 'negative': 0, 'neutral': 1}}
        
        # Hugging Face API call
        headers = {'Authorization': f'Bearer {hf_api_key}'}
        api_url = 'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest'
        
        # Analyze first 10 events to avoid API limits
        sample_texts = texts[:10]
        payload = {'inputs': sample_texts}
        
        response = requests.post(api_url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            results = response.json()
            
            # Process results
            sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0}
            total_score = 0
            confidence_sum = 0
            
            for i, result in enumerate(results):
                if isinstance(result, list) and result:
                    # Get highest confidence sentiment
                    best_sentiment = max(result, key=lambda x: x['score'])
                    label = best_sentiment['label'].lower()
                    confidence = best_sentiment['score']
                    confidence_sum += confidence
                    
                    # Map labels with confidence weighting
                    if 'positive' in label or label == 'label_2':
                        sentiment_counts['positive'] += 1
                        total_score += confidence
                    elif 'negative' in label or label == 'label_0':
                        sentiment_counts['negative'] += 1
                        total_score -= confidence
                    else:
                        sentiment_counts['neutral'] += 1
            
            # Calculate overall sentiment with better logic
            total_events = len(sample_texts)
            if total_events > 0:
                positive_ratio = sentiment_counts['positive'] / total_events
                negative_ratio = sentiment_counts['negative'] / total_events
                avg_confidence = confidence_sum / total_events
                
                # More sensitive sentiment detection
                if positive_ratio > 0.4 and avg_confidence > 0.6:
                    overall = 'positive'
                elif negative_ratio > 0.3 and avg_confidence > 0.6:
                    overall = 'negative'
                elif positive_ratio > negative_ratio:
                    overall = 'positive'
                elif negative_ratio > positive_ratio:
                    overall = 'negative'
                else:
                    overall = 'neutral'
            else:
                overall = 'neutral'
            
            return {
                'overall_sentiment': overall,
                'sentiment_distribution': sentiment_counts,
                'sentiment_score': round(total_score / max(total_events, 1), 2),
                'analyzed_events': total_events
            }
        else:
            return {'error': f'API Error: {response.status_code}', 'overall_sentiment': 'neutral'}
            
    except Exception as e:
        logging.error(f"Sentiment analysis error: {str(e)}")
        return {'error': str(e), 'overall_sentiment': 'neutral'}

# -----------------------------
# API: Dashboard Analytics
# -----------------------------
@app.route('/api/dashboard', methods=['GET'])
def dashboard_analytics():
    try:
        # Get filter parameters
        week_offset = int(request.args.get('week_offset', 0))  # 0=current, -1=previous, 1=next
        category = request.args.get('category')
        
        # Calculate week dates based on offset
        today = datetime.now().date()
        start_of_current_week = today - timedelta(days=today.weekday())
        start_date = (start_of_current_week + timedelta(weeks=week_offset)).isoformat()
        end_date = (start_of_current_week + timedelta(weeks=week_offset, days=6)).isoformat()
        
        # Build query
        query = Event.query.filter(
            Event.date >= datetime.fromisoformat(start_date).date(),
            Event.date <= datetime.fromisoformat(end_date).date()
        )
        
        if category and category != 'all':
            query = query.filter(Event.category == category)
        
        events = query.all()
        
        # Calculate time spent per category
        category_time = {}
        daily_time = {}
        weekly_time = {}
        priority_distribution = {'low': 0, 'medium': 0, 'high': 0}
        
        total_hours = 0
        
        for event in events:
            # Calculate duration
            start_time = datetime.strptime(event.start_time, '%H:%M').time()
            end_time = datetime.strptime(event.end_time, '%H:%M').time()
            duration = datetime.combine(datetime.min, end_time) - datetime.combine(datetime.min, start_time)
            hours = duration.total_seconds() / 3600
            
            total_hours += hours
            
            # Category breakdown
            category_time[event.category] = category_time.get(event.category, 0) + hours
            
            # Daily breakdown
            date_str = event.date.isoformat()
            daily_time[date_str] = daily_time.get(date_str, 0) + hours
            
            # Weekly breakdown
            week_start = event.date - timedelta(days=event.date.weekday())
            week_str = week_start.isoformat()
            weekly_time[week_str] = weekly_time.get(week_str, 0) + hours
            
            # Priority distribution
            priority_distribution[event.priority] += 1
        
        # Prepare chart data
        category_chart = [{'name': k, 'value': round(v, 2)} for k, v in category_time.items()]
        daily_chart = [{'date': k, 'hours': round(v, 2)} for k, v in sorted(daily_time.items())]
        weekly_chart = [{'week': k, 'hours': round(v, 2)} for k, v in sorted(weekly_time.items())]
        priority_chart = [{'name': k, 'value': v} for k, v in priority_distribution.items()]
        
        # Calculate insights
        avg_daily_hours = total_hours / max(len(set(e.date for e in events)), 1)
        most_busy_category = max(category_time.keys(), key=category_time.get) if category_time else 'N/A'
        total_events = len(events)
        
        # Sentiment Analysis - only for filtered events
        sentiment_data = analyze_event_sentiment(events)
        
        # AI Mood Predictor
        mood_data = predict_week_mood(events)
        
        # AI Productivity Score
        productivity_score = calculate_productivity_score(events)
        
        return jsonify({
            'summary': {
                'total_hours': round(total_hours, 2),
                'total_events': total_events,
                'avg_daily_hours': round(avg_daily_hours, 2),
                'most_busy_category': most_busy_category,
                'date_range': {'start': start_date, 'end': end_date},
                'week_offset': week_offset,
                'week_label': get_week_label(week_offset)
            },
            'charts': {
                'category_time': category_chart,
                'daily_time': daily_chart,
                'weekly_time': weekly_chart,
                'priority_distribution': priority_chart
            },
            'sentiment': sentiment_data,
            'mood_prediction': mood_data,
            'productivity_score': productivity_score
        })
        
    except Exception as e:
        logging.error(f"Dashboard Error: {str(e)}")
        return jsonify({'error': 'Erreur lors de la génération du dashboard'}), 500

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