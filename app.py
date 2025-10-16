from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
import json
import re
import random

app = Flask(__name__)

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
        """Parse and validate time slot"""
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
        """Parse voice input to extract tasks and timing"""
        text = text.lower()
        tasks = []
        
        # Extract tasks with time patterns
        patterns = [
            r'(étude|révision|cours|réunion|sport|projet)\s+(?:de\s+)?(\d{1,2}h?\d{0,2}?)(?:\s+à\s+(\d{1,2}h?\d{0,2}?))?',
            r'(\d{1,2}h?\d{0,2}?)\s+(?:de\s+)?(étude|révision|cours|réunion|sport|projet)',
            r'(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2}h?\d{0,2}?)\s+(étude|révision|cours|réunion|sport|projet)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if len(match) >= 2:
                    task_type = next((t for t in self.task_patterns.keys() if t in match), 'étude')
                    tasks.append({
                        'type': task_type,
                        'text': ' '.join(match),
                        'priority': self.task_patterns[task_type]['priority'],
                        'duration': self.task_patterns[task_type]['duration']
                    })
        
        return tasks
    
    def suggest_optimal_timing(self, free_slots, tasks):
        """AI-powered timing suggestions based on task types and free slots"""
        suggestions = []
        
        # Sort tasks by priority
        sorted_tasks = sorted(tasks, key=lambda x: {'high': 3, 'medium': 2, 'low': 1}[x['priority']], reverse=True)
        
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
        """Find optimal time slot for a task"""
        task_duration = task['duration']
        task_type = task.get('type', 'work')
        
        # Optimal times for different task types
        optimal_times = {
            'focus': [(9, 11), (14, 16)],  # Morning and afternoon focus
            'meeting': [(10, 12), (14, 17)],  # Business hours
            'activity': [(7, 9), (18, 20)],  # Early morning or evening
            'break': [(12, 13), (16, 17)]  # Lunch and afternoon break
        }
        
        best_slots = []
        for slot in free_slots:
            slot_start = datetime.strptime(slot['start'], '%H:%M').hour
            slot_duration = (datetime.strptime(slot['end'], '%H:%M') - datetime.strptime(slot['start'], '%H:%M')).seconds // 60
            
            if slot_duration >= task_duration:
                score = self.calculate_slot_score(slot_start, task_type, optimal_times)
                best_slots.append({'slot': slot, 'score': score})
        
        return max(best_slots, key=lambda x: x['score'])['slot'] if best_slots else None
    
    def calculate_slot_score(self, start_hour, task_type, optimal_times):
        """Calculate how good a time slot is for a task type"""
        base_score = 50
        
        if task_type in optimal_times:
            for optimal_start, optimal_end in optimal_times[task_type]:
                if optimal_start <= start_hour <= optimal_end:
                    base_score += 30
        
        # Bonus for morning productivity
        if 8 <= start_hour <= 10:
            base_score += 20
        
        return base_score + random.randint(-5, 5)
    
    def get_suggestion_reason(self, task, slot):
        """Generate explanation for timing suggestion"""
        reasons = {
            'focus': 'Période optimale pour la concentration',
            'meeting': 'Horaire professionnel idéal',
            'activity': 'Moment parfait pour l\'activité physique',
            'work': 'Créneau productif recommandé'
        }
        return reasons.get(task.get('type', 'work'), 'Créneau disponible adapté')
    
    def generate_smart_calendar(self, free_slots, tasks, suggestions):
        """Generate intelligent calendar with auto-scheduled tasks"""
        calendar = {day: [] for day in self.days}
        
        # Add free slots
        for slot in free_slots:
            day = slot['day'].lower()
            if day in calendar:
                calendar[day].append({
                    'type': 'free',
                    'start': slot['start'],
                    'end': slot['end'],
                    'title': 'Temps libre'
                })
        
        # Add suggested tasks
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
        
        # Sort by time
        for day in calendar:
            calendar[day].sort(key=lambda x: x['start'])
        
        return calendar
    
    def generate_schedule(self, time_slots, tasks=None, voice_input=None):
        """Enhanced schedule generation with AI features"""
        # Parse voice input if provided
        parsed_tasks = []
        if voice_input:
            parsed_tasks = self.parse_voice_text(voice_input)
        if tasks:
            parsed_tasks.extend(tasks)
        
        # Generate suggestions
        suggestions = self.suggest_optimal_timing(time_slots, parsed_tasks) if parsed_tasks else []
        
        # Create smart calendar
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
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_schedule():
    try:
        data = request.json
        slots = data.get('slots', [])
        tasks = data.get('tasks', [])
        voice_input = data.get('voice_input', '')
        
        if not slots:
            return jsonify({'error': 'Aucun créneau fourni'}), 400
        
        parsed_slots = []
        for slot in slots:
            parsed_slot = planify.parse_time_slot(
                slot['day'], 
                slot['start'], 
                slot['end']
            )
            parsed_slots.append(parsed_slot)
        
        schedule = planify.generate_schedule(parsed_slots, tasks, voice_input)
        return jsonify(schedule)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/voice-parse', methods=['POST'])
def parse_voice():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Aucun texte fourni'}), 400
        
        tasks = planify.parse_voice_text(text)
        return jsonify({'tasks': tasks})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/export', methods=['POST'])
def export_schedule():
    try:
        data = request.json
        filename = f"planning_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return jsonify({
            'filename': filename,
            'data': data
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)