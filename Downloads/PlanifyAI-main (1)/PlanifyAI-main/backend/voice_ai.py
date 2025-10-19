import re
from datetime import datetime, timedelta

class VoiceAI:
    def process_voice_command(self, transcript):
        transcript = transcript.lower().strip()
        
        title = self._extract_title(transcript)
        date = self._extract_date(transcript)
        time = self._extract_time(transcript)
        duration = self._extract_duration(transcript)
        category = self._extract_category(transcript)
        priority = self._extract_priority(transcript)
        location = self._extract_location(transcript)
        participants = self._extract_participants(transcript)
        
        start_time = datetime.strptime(time, '%H:%M')
        end_time = start_time + timedelta(minutes=duration)
        
        return {
            'success': True,
            'event': {
                'title': title,
                'date': date,
                'time': time,
                'endTime': end_time.strftime('%H:%M'),
                'category': category,
                'priority': priority,
                'location': location,
                'participants': participants,
                'duration': duration
            },
            'confidence': self._calculate_confidence(transcript),
            'suggestions': self._get_suggestions(transcript, category)
        }

    def _extract_title(self, transcript):
        # Remove command words first
        title = re.sub(r'\b(schedule|add|create|book|plan|set|make)\b', '', transcript)
        
        # Remove time information
        title = re.sub(r'\b\d{1,2}:?\d{0,2}\s*(am|pm|a\.m\.|p\.m\.)\b', '', title)
        
        # Remove date information
        title = re.sub(r'\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b', '', title)
        title = re.sub(r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b', '', title)
        title = re.sub(r'\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', '', title)
        title = re.sub(r'\b(next|this)\s+(week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', '', title)
        
        # Remove location prepositions
        title = re.sub(r'\b(at|in|on)\s+[a-z]+\b', '', title)
        
        # Remove participant information
        title = re.sub(r'\bwith\s+[a-z\s]+', '', title)
        
        # Clean up extra spaces and capitalize
        title = ' '.join(title.split())
        return title.title() if title else "New Event"

    def _extract_date(self, transcript):
        today = datetime.now().date()
        
        # Specific date formats
        date_patterns = [
            r'(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)',
            r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})',
            r'(\d{1,2})/(\d{1,2})/(\d{2,4})',
            r'(\d{1,2})-(\d{1,2})-(\d{2,4})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, transcript, re.IGNORECASE)
            if match:
                if 'january' in pattern or 'february' in pattern:
                    if len(match.groups()) == 2:
                        if match.group(1).isdigit():
                            day, month_name = match.groups()
                        else:
                            month_name, day = match.groups()
                        
                        months = ['january', 'february', 'march', 'april', 'may', 'june', 
                                'july', 'august', 'september', 'october', 'november', 'december']
                        month = months.index(month_name.lower()) + 1
                        day = int(day)
                        year = today.year
                        
                        target_date = datetime(year, month, day).date()
                        if target_date < today:
                            target_date = datetime(year + 1, month, day).date()
                        
                        return target_date.isoformat()
        
        # Relative dates
        if any(word in transcript for word in ['today', 'this day']):
            return today.isoformat()
        elif any(word in transcript for word in ['tomorrow', 'next day']):
            return (today + timedelta(days=1)).isoformat()
        elif 'day after tomorrow' in transcript:
            return (today + timedelta(days=2)).isoformat()
        elif 'next week' in transcript:
            return (today + timedelta(days=7)).isoformat()
        
        # Specific days
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for i, day in enumerate(days):
            if day in transcript:
                days_ahead = (i - today.weekday()) % 7
                if days_ahead == 0:
                    days_ahead = 7
                if 'next' in transcript:
                    days_ahead += 7
                return (today + timedelta(days=days_ahead)).isoformat()
        
        return today.isoformat()

    def _extract_time(self, transcript):
        # Enhanced time patterns
        time_patterns = [
            r'(\d{1,2}):(\d{2})\s*(am|pm)',
            r'(\d{1,2})\s*(am|pm)',
            r'(\d{1,2}):(\d{2})',
            r'at\s+(\d{1,2})',
            r'(\d{1,2})\s*o\'?clock'
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, transcript, re.IGNORECASE)
            if match:
                groups = match.groups()
                hour = int(groups[0])
                minute = int(groups[1]) if len(groups) > 1 and groups[1] and groups[1].isdigit() else 0
                
                if len(groups) > 2 and groups[2]:
                    period = groups[2].lower()
                    if 'pm' in period and hour != 12:
                        hour += 12
                    elif 'am' in period and hour == 12:
                        hour = 0
                elif len(groups) > 1 and groups[1] and not groups[1].isdigit():
                    period = groups[1].lower()
                    if 'pm' in period and hour != 12:
                        hour += 12
                    elif 'am' in period and hour == 12:
                        hour = 0
                
                return f"{hour:02d}:{minute:02d}"
        
        # Time keywords
        time_keywords = {
            'morning': '09:00', 'noon': '12:00', 'afternoon': '14:00',
            'evening': '18:00', 'night': '20:00', 'midnight': '00:00'
        }
        
        for keyword, time in time_keywords.items():
            if keyword in transcript:
                return time
        
        return (datetime.now() + timedelta(hours=1)).strftime("%H:%M")

    def _extract_duration(self, transcript):
        # Explicit duration
        duration_match = re.search(r'(\d+)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)', transcript)
        if duration_match:
            value = int(duration_match.group(1))
            unit = duration_match.group(2).lower()
            return value * 60 if 'hour' in unit or 'hr' in unit else value
        
        # Duration by category
        duration_map = {
            'meeting': 60, 'call': 30, 'conference': 120, 'standup': 15,
            'lunch': 60, 'dinner': 90, 'breakfast': 30,
            'workout': 60, 'gym': 90, 'run': 30,
            'appointment': 45, 'checkup': 30, 'interview': 60,
            'class': 90, 'lecture': 120, 'seminar': 180,
            'break': 15
        }
        
        for keyword, duration in duration_map.items():
            if keyword in transcript:
                return duration
        
        return 60

    def _extract_category(self, transcript):
        categories = {
            'meeting': ['meeting', 'call', 'conference', 'sync', 'standup', 'discussion'],
            'work': ['work', 'project', 'task', 'coding', 'development', 'review'],
            'personal': ['lunch', 'dinner', 'breakfast', 'gym', 'workout', 'run', 'break'],
            'health': ['doctor', 'appointment', 'checkup', 'dentist', 'hospital'],
            'education': ['class', 'lecture', 'seminar', 'study', 'exam', 'course'],
            'social': ['party', 'event', 'celebration', 'birthday', 'wedding']
        }
        
        for category, keywords in categories.items():
            if any(word in transcript for word in keywords):
                return category
        
        return 'general'

    def _extract_priority(self, transcript):
        high_priority = ['urgent', 'important', 'critical', 'asap', 'priority', 'emergency']
        low_priority = ['optional', 'maybe', 'if possible', 'casual', 'flexible']
        
        if any(word in transcript for word in high_priority):
            return 'high'
        elif any(word in transcript for word in low_priority):
            return 'low'
        
        # Auto-priority based on category
        if any(word in transcript for word in ['doctor', 'hospital', 'emergency']):
            return 'high'
        elif any(word in transcript for word in ['meeting', 'interview', 'exam']):
            return 'medium'
        
        return 'medium'

    def _extract_location(self, transcript):
        location_patterns = [
            r'at\s+([A-Za-z\s]+?)(?:\s+(?:on|at|with|for)|\s*$)',
            r'in\s+([A-Za-z\s]+?)(?:\s+(?:on|at|with|for)|\s*$)',
            r'room\s+(\w+)',
            r'conference\s+room\s+(\w+)'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, transcript, re.IGNORECASE)
            if match:
                location = match.group(1).strip()
                if len(location) > 2 and not any(word in location.lower() for word in ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']):
                    return location.title()
        
        # Common locations
        locations = ['office', 'home', 'gym', 'hospital', 'school', 'university', 'library']
        for loc in locations:
            if loc in transcript:
                return loc.title()
        
        if any(word in transcript for word in ['online', 'zoom', 'teams', 'skype', 'virtual']):
            return 'Online'
        
        return None

    def _extract_participants(self, transcript):
        participants = []
        
        # "with [name]" pattern
        with_pattern = r'with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        matches = re.findall(with_pattern, transcript, re.IGNORECASE)
        participants.extend([name.title() for name in matches])
        
        # Team/group patterns
        if 'team' in transcript:
            participants.append('Team')
        if 'everyone' in transcript or 'all' in transcript:
            participants.append('Everyone')
        
        return participants

    def _calculate_confidence(self, transcript):
        confidence = 0.5
        
        # Time specified
        if re.search(r'\d{1,2}:?\d{0,2}\s*(am|pm)', transcript):
            confidence += 0.2
        
        # Date specified
        if any(word in transcript for word in ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']):
            confidence += 0.15
        
        # Specific date
        if re.search(r'\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)', transcript):
            confidence += 0.2
        
        # Clear action word
        if any(word in transcript for word in ['schedule', 'add', 'create', 'book', 'plan']):
            confidence += 0.1
        
        # Detailed command
        if len(transcript.split()) > 5:
            confidence += 0.1
        
        return min(confidence, 1.0)

    def _get_suggestions(self, transcript, category):
        suggestions = []
        
        if category == 'meeting' and 'with' not in transcript:
            suggestions.append("Consider adding participants")
        
        if not re.search(r'at|in', transcript):
            suggestions.append("You might want to specify a location")
        
        if category in ['meeting', 'appointment'] and not re.search(r'\d+\s*(hour|minute)', transcript):
            suggestions.append("Consider specifying duration")
        
        return suggestions