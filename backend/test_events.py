from app import app, db, Event
from datetime import datetime, timedelta

def create_test_events():
    with app.app_context():
        # Clear existing events
        Event.query.delete()
        
        # Get current week dates
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        
        # Positive events
        positive_events = [
            Event(title="Birthday Party", description="Celebrating Sarah's birthday", 
                  date=start_of_week, start_time="19:00", end_time="22:00", category="personal"),
            Event(title="Wedding Ceremony", description="John and Mary's wedding", 
                  date=start_of_week + timedelta(days=1), start_time="15:00", end_time="18:00", category="personal"),
            Event(title="Vacation Planning", description="Planning summer vacation", 
                  date=start_of_week + timedelta(days=2), start_time="10:00", end_time="11:00", category="personal"),
        ]
        
        # Negative events
        negative_events = [
            Event(title="Emergency Meeting", description="Urgent project crisis", 
                  date=start_of_week + timedelta(days=3), start_time="09:00", end_time="10:00", category="work", priority="high"),
            Event(title="Doctor Appointment", description="Medical checkup for illness", 
                  date=start_of_week + timedelta(days=4), start_time="14:00", end_time="15:00", category="health"),
            Event(title="Tax Deadline", description="Submit tax documents urgently", 
                  date=start_of_week + timedelta(days=5), start_time="16:00", end_time="17:00", category="general", priority="high"),
        ]
        
        # Neutral events
        neutral_events = [
            Event(title="Team Standup", description="Daily team meeting", 
                  date=start_of_week + timedelta(days=6), start_time="09:00", end_time="09:30", category="meeting"),
        ]
        
        # Add all events
        for event in positive_events + negative_events + neutral_events:
            db.session.add(event)
        
        db.session.commit()
        print(f"Created {len(positive_events + negative_events + neutral_events)} test events")

if __name__ == "__main__":
    create_test_events()