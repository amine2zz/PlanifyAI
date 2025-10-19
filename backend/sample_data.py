from app import app, db, Event
from datetime import datetime, timedelta
import random

def create_sample_events():
    """Create sample events for testing AI suggestions"""
    
    with app.app_context():
        # Clear existing events
        Event.query.delete()
        
        # Sample events for the next 2 weeks
        base_date = datetime.now().date()
        
        sample_events = [
            # Week 1 - Overloaded Monday
            {'title': 'Team Standup', 'date': base_date, 'start_time': '09:00', 'end_time': '09:30', 'category': 'meeting', 'priority': 'medium'},
            {'title': 'Project Review Meeting', 'date': base_date, 'start_time': '09:30', 'end_time': '10:30', 'category': 'meeting', 'priority': 'high'},
            {'title': 'Client Call', 'date': base_date, 'start_time': '10:30', 'end_time': '11:30', 'category': 'meeting', 'priority': 'high'},
            {'title': 'Code Review', 'date': base_date, 'start_time': '11:30', 'end_time': '12:30', 'category': 'work', 'priority': 'medium'},
            {'title': 'Sprint Planning', 'date': base_date, 'start_time': '14:00', 'end_time': '16:00', 'category': 'meeting', 'priority': 'high'},
            {'title': 'Documentation Update', 'date': base_date, 'start_time': '16:00', 'end_time': '17:00', 'category': 'work', 'priority': 'low'},
            
            # Tuesday - Better balanced
            {'title': 'Focus Time - Development', 'date': base_date + timedelta(days=1), 'start_time': '09:00', 'end_time': '11:00', 'category': 'work', 'priority': 'high'},
            {'title': 'Lunch Break', 'date': base_date + timedelta(days=1), 'start_time': '12:00', 'end_time': '13:00', 'category': 'personal', 'priority': 'medium'},
            {'title': 'Team Meeting', 'date': base_date + timedelta(days=1), 'start_time': '15:00', 'end_time': '16:00', 'category': 'meeting', 'priority': 'medium'},
            
            # Wednesday - Light day
            {'title': 'Weekly One-on-One', 'date': base_date + timedelta(days=2), 'start_time': '10:00', 'end_time': '10:30', 'category': 'meeting', 'priority': 'medium'},
            {'title': 'Learning Session', 'date': base_date + timedelta(days=2), 'start_time': '14:00', 'end_time': '15:00', 'category': 'education', 'priority': 'low'},
            
            # Thursday - Back-to-back meetings
            {'title': 'Architecture Review', 'date': base_date + timedelta(days=3), 'start_time': '09:00', 'end_time': '10:00', 'category': 'meeting', 'priority': 'high'},
            {'title': 'Stakeholder Meeting', 'date': base_date + timedelta(days=3), 'start_time': '10:00', 'end_time': '11:00', 'category': 'meeting', 'priority': 'high'},
            {'title': 'Technical Discussion', 'date': base_date + timedelta(days=3), 'start_time': '11:00', 'end_time': '12:00', 'category': 'meeting', 'priority': 'medium'},
            {'title': 'Product Demo', 'date': base_date + timedelta(days=3), 'start_time': '14:00', 'end_time': '15:30', 'category': 'meeting', 'priority': 'high'},
            
            # Friday - Mixed activities
            {'title': 'Code Development', 'date': base_date + timedelta(days=4), 'start_time': '09:00', 'end_time': '12:00', 'category': 'work', 'priority': 'high'},
            {'title': 'Team Retrospective', 'date': base_date + timedelta(days=4), 'start_time': '15:00', 'end_time': '16:00', 'category': 'meeting', 'priority': 'medium'},
            
            # Week 2 - Similar patterns
            {'title': 'Weekly Planning', 'date': base_date + timedelta(days=7), 'start_time': '09:00', 'end_time': '10:00', 'category': 'planning', 'priority': 'high'},
            {'title': 'Client Presentation', 'date': base_date + timedelta(days=7), 'start_time': '10:00', 'end_time': '11:30', 'category': 'meeting', 'priority': 'high'},
            {'title': 'Bug Fixing Session', 'date': base_date + timedelta(days=7), 'start_time': '14:00', 'end_time': '17:00', 'category': 'work', 'priority': 'high'},
            
            # Health and personal events (missing - will trigger suggestions)
            {'title': 'Doctor Appointment', 'date': base_date + timedelta(days=8), 'start_time': '16:00', 'end_time': '17:00', 'category': 'health', 'priority': 'medium'},
            {'title': 'Gym Session', 'date': base_date + timedelta(days=9), 'start_time': '18:00', 'end_time': '19:00', 'category': 'health', 'priority': 'low'},
        ]
        
        # Create events
        for event_data in sample_events:
            event = Event(
                title=event_data['title'],
                description=f"Sample event: {event_data['title']}",
                date=event_data['date'],
                start_time=event_data['start_time'],
                end_time=event_data['end_time'],
                category=event_data['category'],
                priority=event_data['priority']
            )
            db.session.add(event)
        
        db.session.commit()
        print(f"Created {len(sample_events)} sample events for AI suggestions testing")

if __name__ == '__main__':
    create_sample_events()