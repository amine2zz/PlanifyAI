from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)  # Format: "HH:MM"
    end_time = db.Column(db.String(10), nullable=False)    # Format: "HH:MM"
    category = db.Column(db.String(50), default='general')
    priority = db.Column(db.Enum('low', 'medium', 'high'), default='medium')
    is_recurring = db.Column(db.Boolean, default=False)
    recurring_pattern = db.Column(db.String(100))  # JSON string for recurring rules
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Event {self.title}>'

class TimeBlock(db.Model):
    __tablename__ = 'time_blocks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)
    end_time = db.Column(db.String(10), nullable=False)
    block_type = db.Column(db.Enum('focus', 'break', 'meeting', 'personal'), default='focus')
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<TimeBlock {self.title}>'

class UserPreference(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)  # For future multi-user support
    preference_key = db.Column(db.String(100), nullable=False)
    preference_value = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserPreference {self.preference_key}>'

class ProductivityMetric(db.Model):
    __tablename__ = 'productivity_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    focus_time = db.Column(db.Integer, default=0)  # Minutes of focused work
    meeting_time = db.Column(db.Integer, default=0)  # Minutes in meetings
    break_time = db.Column(db.Integer, default=0)  # Minutes of breaks
    productivity_score = db.Column(db.Float, default=0.0)  # 0-100 score
    tasks_completed = db.Column(db.Integer, default=0)
    tasks_planned = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ProductivityMetric {self.date}>'

class AIInsight(db.Model):
    __tablename__ = 'ai_insights'
    
    id = db.Column(db.Integer, primary_key=True)
    insight_type = db.Column(db.String(50), nullable=False)  # 'pattern', 'suggestion', 'optimization'
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    confidence_score = db.Column(db.Float, default=0.0)  # 0-1 confidence
    data = db.Column(db.Text)  # JSON data for the insight
    is_applied = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<AIInsight {self.title}>'

class CalendarSync(db.Model):
    __tablename__ = 'calendar_sync'
    
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.String(50), nullable=False)  # 'google', 'outlook', 'apple'
    external_id = db.Column(db.String(200))
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)
    sync_status = db.Column(db.Enum('pending', 'synced', 'error'), default='pending')
    
    event = db.relationship('Event', backref='sync_records')
    
    def __repr__(self):
        return f'<CalendarSync {self.provider}>'