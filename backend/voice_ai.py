import re
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import spacy
from dateutil import parser

class VoiceAI:
    """
    Advanced Voice AI for processing natural language calendar commands
    """
    
    def __init__(self):
        # Load spaCy model for NLP (install with: python -m spacy download en_core_web_sm)
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        # Common patterns for calendar events
        self.event_patterns = {
            'meeting': ['meeting', 'call', 'conference', 'discussion', 'sync'],
            'appointment': ['appointment', 'visit', 'checkup', 'session'],
            'work': ['work', 'project', 'task', 'focus', 'coding', 'development'],
            'personal': ['lunch', 'dinner', 'gym', 'workout', 'break', 'rest'],
            'reminder': ['remind', 'reminder', 'note', 'alert']
        }
        
        # Time patterns
        self.time_patterns = {
            'morning': ['morning', 'am', 'a.m.'],
            'afternoon': ['afternoon', 'pm', 'p.m.'],
            'evening': ['evening', 'night'],
            'specific_times': r'\b(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)\b',
            'relative_times': r'\b(in|after|before)\s+(\d+)\s+(minutes?|hours?|days?)\b'
        }
        
        # Date patterns
        self.date_patterns = {
            'today': ['today', 'this day'],
            'tomorrow': ['tomorrow', 'next day'],
            'days': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            'relative_dates': r'\b(next|this)\s+(week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            'specific_dates': r'\b(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?\b'
        }
        
        # Duration patterns
        self.duration_patterns = {
            'minutes': r'\b(\d+)\s*(?:minutes?|mins?)\b',
            'hours': r'\b(\d+)\s*(?:hours?|hrs?)\b',
            'default_durations': {
                'meeting': 60,
                'call': 30,
                'lunch': 60,
                'break': 15,
                'workout': 90,
                'appointment': 45
            }
        }

    def process_voice_command(self, transcript: str) -> Dict[str, Any]:
        """
        Process voice transcript and extract calendar event information
        """
        transcript = transcript.lower().strip()
        
        try:
            # Extract event components
            event_info = {
                'title': self._extract_title(transcript),
                'category': self._extract_category(transcript),
                'date': self._extract_date(transcript),
                'time': self._extract_time(transcript),
                'duration': self._extract_duration(transcript),
                'priority': self._extract_priority(transcript),
                'participants': self._extract_participants(transcript),
                'location': self._extract_location(transcript),
                'confidence': self._calculate_confidence(transcript)
            }
            
            # Validate and enhance the extracted information
            event_info = self._validate_and_enhance(event_info, transcript)
            
            return {
                'success': True,
                'event': event_info,
                'original_transcript': transcript,
                'processing_notes': self._get_processing_notes(event_info)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'original_transcript': transcript,
                'suggestions': self._get_error_suggestions(transcript)
            }

    def _extract_title(self, transcript: str) -> str:
        """Extract event title from transcript"""
        # Remove common command words
        command_words = ['schedule', 'add', 'create', 'book', 'set up', 'plan']
        title = transcript
        
        for word in command_words:
            title = re.sub(rf'\b{word}\b', '', title, flags=re.IGNORECASE)
        
        # Remove time and date information for cleaner title
        title = re.sub(r'\b(at|on|for|from|to)\s+\d+', '', title)
        title = re.sub(r'\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\b\d{1,2}:?\d{0,2}\s*(am|pm|a\.m\.|p\.m\.)\b', '', title, flags=re.IGNORECASE)
        
        # Clean up and capitalize
        title = ' '.join(title.split())
        return title.title() if title else "New Event"

    def _extract_category(self, transcript: str) -> str:
        """Determine event category based on keywords"""
        for category, keywords in self.event_patterns.items():
            for keyword in keywords:
                if keyword in transcript:
                    return category
        return 'general'

    def _extract_date(self, transcript: str) -> str:
        """Extract date from transcript"""
        today = datetime.now().date()
        
        # Check for relative dates
        if any(word in transcript for word in self.date_patterns['today']):
            return today.isoformat()
        
        if any(word in transcript for word in self.date_patterns['tomorrow']):
            return (today + timedelta(days=1)).isoformat()
        
        # Check for specific days
        for i, day in enumerate(self.date_patterns['days']):
            if day in transcript:
                days_ahead = (i - today.weekday()) % 7
                if days_ahead == 0:  # If it's today, assume next week
                    days_ahead = 7
                target_date = today + timedelta(days=days_ahead)
                return target_date.isoformat()
        
        # Check for "next week", "this friday", etc.
        next_match = re.search(self.date_patterns['relative_dates'], transcript, re.IGNORECASE)
        if next_match:
            modifier, period = next_match.groups()
            if period in self.date_patterns['days']:
                day_index = self.date_patterns['days'].index(period.lower())
                if modifier.lower() == 'next':
                    days_ahead = (day_index - today.weekday()) % 7 + 7
                else:  # this
                    days_ahead = (day_index - today.weekday()) % 7
                target_date = today + timedelta(days=days_ahead)
                return target_date.isoformat()
        
        # Default to today if no date found
        return today.isoformat()

    def _extract_time(self, transcript: str) -> str:
        """Extract time from transcript"""
        # Look for specific times (e.g., "2 PM", "14:30")
        time_match = re.search(self.time_patterns['specific_times'], transcript, re.IGNORECASE)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            period = time_match.group(3).lower()
            
            # Convert to 24-hour format
            if 'p' in period and hour != 12:
                hour += 12
            elif 'a' in period and hour == 12:
                hour = 0
            
            return f"{hour:02d}:{minute:02d}"
        
        # Look for general time periods
        if any(word in transcript for word in self.time_patterns['morning']):
            return "09:00"
        elif any(word in transcript for word in self.time_patterns['afternoon']):
            return "14:00"
        elif any(word in transcript for word in self.time_patterns['evening']):
            return "18:00"
        
        # Default to next available hour
        now = datetime.now()
        next_hour = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        return next_hour.strftime("%H:%M")

    def _extract_duration(self, transcript: str) -> int:
        """Extract duration in minutes"""
        # Look for explicit duration
        hour_match = re.search(self.duration_patterns['hours'], transcript)
        if hour_match:
            return int(hour_match.group(1)) * 60
        
        minute_match = re.search(self.duration_patterns['minutes'], transcript)
        if minute_match:
            return int(minute_match.group(1))
        
        # Use default duration based on category
        category = self._extract_category(transcript)
        return self.duration_patterns['default_durations'].get(category, 60)

    def _extract_priority(self, transcript: str) -> str:
        """Determine priority based on keywords"""
        high_priority_words = ['urgent', 'important', 'critical', 'asap', 'priority']
        low_priority_words = ['optional', 'if possible', 'maybe', 'casual']
        
        if any(word in transcript for word in high_priority_words):
            return 'high'
        elif any(word in transcript for word in low_priority_words):
            return 'low'
        return 'medium'

    def _extract_participants(self, transcript: str) -> list:
        """Extract participant names"""
        participants = []
        
        # Look for "with [name]" patterns
        with_pattern = r'\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        matches = re.findall(with_pattern, transcript, re.IGNORECASE)
        participants.extend(matches)
        
        # Look for common names (this could be enhanced with a name database)
        common_names = ['john', 'jane', 'mike', 'sarah', 'david', 'lisa', 'tom', 'anna']
        for name in common_names:
            if name in transcript.lower():
                participants.append(name.title())
        
        return list(set(participants))  # Remove duplicates

    def _extract_location(self, transcript: str) -> Optional[str]:
        """Extract location information"""
        location_patterns = [
            r'\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'conference room\s+(\w+)',
            r'room\s+(\w+)'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, transcript, re.IGNORECASE)
            if match:
                return match.group(1)
        
        # Check for common locations
        if 'office' in transcript:
            return 'Office'
        elif 'home' in transcript:
            return 'Home'
        elif 'online' in transcript or 'zoom' in transcript or 'teams' in transcript:
            return 'Online'
        
        return None

    def _calculate_confidence(self, transcript: str) -> float:
        """Calculate confidence score for the extraction"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on clear indicators
        if re.search(self.time_patterns['specific_times'], transcript, re.IGNORECASE):
            confidence += 0.2
        
        if any(day in transcript for day in self.date_patterns['days']):
            confidence += 0.15
        
        if any(word in transcript for word in ['today', 'tomorrow']):
            confidence += 0.1
        
        if len(transcript.split()) > 3:  # More detailed commands
            confidence += 0.1
        
        # Decrease confidence for ambiguous commands
        if len(transcript.split()) < 3:
            confidence -= 0.2
        
        return min(max(confidence, 0.1), 1.0)

    def _validate_and_enhance(self, event_info: Dict[str, Any], transcript: str) -> Dict[str, Any]:
        """Validate and enhance extracted information"""
        # Ensure date is not in the past (unless it's today)
        event_date = datetime.fromisoformat(event_info['date']).date()
        today = datetime.now().date()
        
        if event_date < today:
            event_info['date'] = today.isoformat()
        
        # Ensure time is reasonable
        try:
            event_time = datetime.strptime(event_info['time'], '%H:%M').time()
            if event_time.hour < 6:  # Very early morning, probably PM
                new_hour = event_time.hour + 12
                event_info['time'] = f"{new_hour:02d}:{event_time.minute:02d}"
        except:
            event_info['time'] = "09:00"  # Default fallback
        
        # Add smart suggestions
        event_info['suggestions'] = self._generate_suggestions(event_info, transcript)
        
        return event_info

    def _generate_suggestions(self, event_info: Dict[str, Any], transcript: str) -> list:
        """Generate smart suggestions for the event"""
        suggestions = []
        
        # Suggest adding participants if meeting detected but no participants found
        if event_info['category'] == 'meeting' and not event_info['participants']:
            suggestions.append("Consider adding participants to this meeting")
        
        # Suggest location for meetings
        if event_info['category'] == 'meeting' and not event_info['location']:
            suggestions.append("Don't forget to specify the meeting location")
        
        # Suggest preparation time for important meetings
        if event_info['priority'] == 'high' and event_info['category'] == 'meeting':
            suggestions.append("Consider blocking 15 minutes before for preparation")
        
        return suggestions

    def _get_processing_notes(self, event_info: Dict[str, Any]) -> list:
        """Get processing notes for the user"""
        notes = []
        
        if event_info['confidence'] < 0.7:
            notes.append("Low confidence in interpretation. Please review the details.")
        
        if not event_info['participants'] and event_info['category'] == 'meeting':
            notes.append("No participants detected. You may want to add them manually.")
        
        return notes

    def _get_error_suggestions(self, transcript: str) -> list:
        """Get suggestions when processing fails"""
        return [
            "Try being more specific about the time (e.g., '2 PM' instead of 'afternoon')",
            "Include the day (e.g., 'tomorrow' or 'Monday')",
            "Use clear action words like 'schedule', 'add', or 'create'",
            "Example: 'Schedule meeting with John tomorrow at 2 PM'"
        ]

    def get_smart_suggestions_for_transcript(self, transcript: str) -> list:
        """Get smart suggestions to improve voice commands"""
        suggestions = []
        
        if len(transcript.split()) < 4:
            suggestions.append("Try providing more details for better accuracy")
        
        if not re.search(r'\d', transcript):
            suggestions.append("Include specific times or dates")
        
        if 'meeting' in transcript and 'with' not in transcript:
            suggestions.append("Specify who the meeting is with")
        
        return suggestions