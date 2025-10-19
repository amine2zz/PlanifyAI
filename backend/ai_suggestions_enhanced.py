from datetime import datetime, timedelta, time
from collections import defaultdict, Counter
import random

class AICalendarSuggestions:
    def __init__(self):
        self.suggestion_templates = {
            'time_optimization': [
                "Consider batching similar tasks together for better focus",
                "Schedule buffer time between meetings to avoid rushing",
                "Move non-urgent tasks to less busy days",
                "Block time for deep work during your most productive hours"
            ],
            'health_wellness': [
                "Add 15-minute breaks between long meetings",
                "Schedule lunch breaks to maintain energy levels",
                "Consider walking meetings for casual discussions",
                "Block time for exercise to boost productivity"
            ],
            'productivity': [
                "Group similar meetings on the same day",
                "Reserve mornings for high-focus work",
                "Limit meetings to 25 or 50 minutes instead of 30/60",
                "Schedule weekly planning sessions"
            ],
            'balance': [
                "Ensure work-life balance with personal time blocks",
                "Schedule regular breaks throughout busy days",
                "Consider shorter meetings to create breathing room",
                "Block time for learning and skill development"
            ]
        }

    def analyze_calendar_patterns(self, events):
        """Analyze calendar events to identify patterns and optimization opportunities"""
        if not events:
            return []

        # Convert events to datetime objects for analysis
        processed_events = []
        for event in events:
            try:
                event_date = datetime.fromisoformat(event['date'])
                start_time = datetime.strptime(event['startTime'], '%H:%M').time()
                end_time = datetime.strptime(event['endTime'], '%H:%M').time()
                
                processed_events.append({
                    **event,
                    'datetime': event_date,
                    'start_datetime': datetime.combine(event_date, start_time),
                    'end_datetime': datetime.combine(event_date, end_time),
                    'duration': (datetime.combine(event_date, end_time) - 
                               datetime.combine(event_date, start_time)).total_seconds() / 3600
                })
            except:
                continue

        return self._generate_suggestions(processed_events)

    def _generate_suggestions(self, events):
        """Generate AI-powered suggestions based on calendar analysis"""
        suggestions = []
        
        # Generate actionable suggestions that can modify events
        suggestions.extend(self._suggest_event_modifications(events))
        suggestions.extend(self._suggest_time_optimizations(events))
        suggestions.extend(self._suggest_meeting_improvements(events))
        suggestions.extend(self._suggest_break_additions(events))
        suggestions.extend(self._suggest_event_consolidations(events))
        suggestions.extend(self._suggest_priority_adjustments(events))
        suggestions.extend(self._suggest_specific_improvements(events))
        suggestions.extend(self._suggest_recurring_patterns(events))
        suggestions.extend(self._suggest_weekly_routines(events))
        suggestions.extend(self._suggest_smart_scheduling(events))
        
        # Remove duplicates and prioritize
        unique_suggestions = []
        seen_types = set()
        for suggestion in suggestions:
            if suggestion['type'] not in seen_types:
                unique_suggestions.append(suggestion)
                seen_types.add(suggestion['type'])
        
        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        unique_suggestions.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return unique_suggestions[:12]  # Limit to top 12 actionable suggestions

    def _suggest_recurring_patterns(self, events):
        """Suggest recurring event patterns"""
        suggestions = []
        
        # Weekly lunch breaks Monday to Friday - only suggest if very few lunch events
        lunch_events = [e for e in events if 'lunch' in e['title'].lower()]
        has_regular_lunch = len(lunch_events) >= 3  # Need at least 3 lunch events to consider it regular
        
        if not has_regular_lunch:
            suggestions.append({
                'type': 'add_weekly_lunch',
                'priority': 'high',
                'title': 'Add Daily Lunch Breaks (Mon-Fri)',
                'description': 'Schedule consistent lunch breaks every weekday for better work-life balance.',
                'action': 'Add 1-hour lunch break at 12:30 PM, Monday through Friday',
                'impact': 'Improves energy levels and prevents afternoon fatigue',
                'editable': True,
                'suggested_changes': {
                    'recurring_events': [
                        {
                            'title': 'Lunch Break',
                            'start_time': '12:30',
                            'end_time': '13:30',
                            'category': 'personal',
                            'priority': 'medium',
                            'description': 'Daily lunch break for better productivity',
                            'days': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                        }
                    ]
                }
            })
        
        # Weekly planning sessions
        has_planning = any('planning' in e['title'].lower() or 'plan' in e['title'].lower() for e in events)
        if not has_planning:
            suggestions.append({
                'type': 'add_weekly_planning',
                'priority': 'medium',
                'title': 'Weekly Planning Session Every Monday',
                'description': 'Start each week with a 30-minute planning session to organize priorities.',
                'action': 'Add recurring planning session every Monday at 9:00 AM',
                'impact': 'Better weekly organization and goal achievement',
                'editable': True,
                'suggested_changes': {
                    'recurring_events': [
                        {
                            'title': 'Weekly Planning Session',
                            'start_time': '09:00',
                            'end_time': '09:30',
                            'category': 'work',
                            'priority': 'high',
                            'description': 'Plan and prioritize tasks for the week',
                            'days': ['monday']
                        }
                    ]
                }
            })
        
        return suggestions[:2]

    def _suggest_weekly_routines(self, events):
        """Suggest weekly routine improvements"""
        suggestions = []
        
        # Exercise routine
        has_exercise = any(word in e['title'].lower() for e in events 
                          for word in ['gym', 'workout', 'exercise', 'fitness', 'sport'])
        if not has_exercise:
            suggestions.append({
                'type': 'add_exercise_routine',
                'priority': 'medium',
                'title': 'Add Exercise Routine (3x per week)',
                'description': 'Regular exercise improves productivity and mental health.',
                'action': 'Schedule 1-hour workout sessions on Monday, Wednesday, Friday',
                'impact': 'Increased energy, better focus, improved health',
                'editable': True,
                'suggested_changes': {
                    'recurring_events': [
                        {
                            'title': 'Workout Session',
                            'start_time': '18:00',
                            'end_time': '19:00',
                            'category': 'health',
                            'priority': 'medium',
                            'description': 'Regular exercise for better health and productivity',
                            'days': ['monday', 'wednesday', 'friday']
                        }
                    ]
                }
            })
        
        # Learning time
        has_learning = any(word in e['title'].lower() for e in events 
                          for word in ['learn', 'study', 'course', 'training', 'skill'])
        if not has_learning:
            suggestions.append({
                'type': 'add_learning_time',
                'priority': 'low',
                'title': 'Weekly Learning Session',
                'description': 'Dedicate time for skill development and continuous learning.',
                'action': 'Block 2 hours every Friday afternoon for learning',
                'impact': 'Professional growth and skill enhancement',
                'editable': True,
                'suggested_changes': {
                    'recurring_events': [
                        {
                            'title': 'Learning & Development',
                            'start_time': '15:00',
                            'end_time': '17:00',
                            'category': 'education',
                            'priority': 'medium',
                            'description': 'Time for courses, reading, and skill development',
                            'days': ['friday']
                        }
                    ]
                }
            })
        
        return suggestions[:2]

    def _suggest_smart_scheduling(self, events):
        """AI-powered smart scheduling suggestions"""
        suggestions = []
        
        # Analyze work patterns
        work_events = [e for e in events if e['category'] in ['work', 'meeting']]
        if work_events:
            morning_work = sum(1 for e in work_events if e['start_datetime'].hour < 12)
            afternoon_work = sum(1 for e in work_events if e['start_datetime'].hour >= 12)
            
            if afternoon_work > morning_work * 1.5:
                suggestions.append({
                    'type': 'optimize_focus_time',
                    'priority': 'high',
                    'title': 'Add Morning Focus Blocks',
                    'description': 'You have more afternoon work. Mornings are typically more productive.',
                    'action': 'Block 2-hour focus sessions every morning (9-11 AM)',
                    'impact': 'Improved concentration and work quality',
                    'editable': True,
                    'suggested_changes': {
                        'recurring_events': [
                            {
                                'title': 'Deep Focus Work',
                                'start_time': '09:00',
                                'end_time': '11:00',
                                'category': 'work',
                                'priority': 'high',
                                'description': 'Uninterrupted time for important tasks',
                                'days': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                            }
                        ]
                    }
                })
        
        return suggestions[:1]

    # Include all other existing methods from the original file
    def _suggest_event_modifications(self, events):
        suggestions = []
        for event in events:
            if event['duration'] > 1.5 and 'meeting' in event['title'].lower():
                suggestions.append({
                    'type': 'shorten_meeting',
                    'priority': 'medium',
                    'title': f'Shorten "{event["title"]}"',
                    'description': f'This {event["duration"]:.1f}h meeting could be more efficient if shortened.',
                    'action': 'Reduce meeting duration to 1.5 hours',
                    'impact': 'Saves time and maintains focus',
                    'editable': True,
                    'event_id': event['id'],
                    'suggested_changes': {
                        'end_time': self._calculate_new_end_time(event['start_datetime'], 1.5)
                    }
                })
        return suggestions[:4]

    def _suggest_time_optimizations(self, events):
        suggestions = []
        for event in events:
            if (event['start_datetime'].hour >= 15 and 'meeting' in event['title'].lower()):
                suggestions.append({
                    'type': 'reschedule_optimal',
                    'priority': 'medium',
                    'title': f'Move "{event["title"]}" to Morning',
                    'description': 'Afternoon meetings are less productive than morning ones.',
                    'action': 'Reschedule to 10:00 AM',
                    'impact': 'Frees afternoon for high-focus work',
                    'editable': True,
                    'event_id': event['id'],
                    'suggested_changes': {
                        'start_time': '10:00',
                        'end_time': self._calculate_end_time('10:00', event['duration'])
                    }
                })
        return suggestions[:2]

    def _suggest_meeting_improvements(self, events):
        return []

    def _suggest_break_additions(self, events):
        return []

    def _suggest_event_consolidations(self, events):
        return []

    def _suggest_priority_adjustments(self, events):
        return []

    def _suggest_specific_improvements(self, events):
        suggestions = []
        
        # Detect late night work events (after 10 PM)
        late_night_events = [e for e in events if e['start_datetime'].hour >= 22 or e['end_datetime'].hour >= 22]
        if late_night_events:
            suggestions.append({
                'type': 'reduce_late_work',
                'priority': 'high',
                'title': 'Reduce Late Night Work Sessions',
                'description': f'Found {len(late_night_events)} events scheduled after 10 PM. Late work affects sleep and productivity.',
                'action': 'Move late events to earlier hours (before 6 PM)',
                'impact': 'Better sleep quality and next-day productivity',
                'editable': True,
                'suggested_changes': {
                    'event_modifications': [{
                        'event_id': e['id'],
                        'start_time': '16:00',
                        'end_time': self._calculate_end_time('16:00', e['duration'])
                    } for e in late_night_events[:3]]
                }
            })
        
        # Detect very long work sessions (over 4 hours)
        long_work_events = [e for e in events if e['duration'] > 4 and e['category'] in ['work', 'meeting']]
        if long_work_events:
            suggestions.append({
                'type': 'break_long_sessions',
                'priority': 'high',
                'title': 'Break Up Long Work Sessions',
                'description': f'Found {len(long_work_events)} work sessions over 4 hours. Long sessions reduce effectiveness.',
                'action': 'Split into 2-hour blocks with 30-minute breaks',
                'impact': 'Maintains focus and prevents burnout',
                'editable': True,
                'suggested_changes': {
                    'split_events': [{
                        'original_id': e['id'],
                        'new_events': [
                            {
                                'title': f"{e['title']} - Part 1",
                                'start_time': e['startTime'],
                                'end_time': self._calculate_end_time(e['startTime'], 2),
                                'category': e['category'],
                                'priority': e['priority']
                            },
                            {
                                'title': f"{e['title']} - Part 2",
                                'start_time': self._calculate_end_time(e['startTime'], 2.5),
                                'end_time': self._calculate_end_time(e['startTime'], 4.5),
                                'category': e['category'],
                                'priority': e['priority']
                            }
                        ]
                    } for e in long_work_events[:2]]
                }
            })
        
        # Detect unclear/generic event titles
        unclear_events = [e for e in events if len(e['title'].split()) < 2 or 
                         e['title'].lower() in ['work', 'meeting', 'task', 'event', 'appointment']]
        if unclear_events:
            suggestions.append({
                'type': 'clarify_titles',
                'priority': 'medium',
                'title': 'Add More Descriptive Event Titles',
                'description': f'Found {len(unclear_events)} events with unclear titles. Specific titles improve organization.',
                'action': 'Update event titles to be more descriptive',
                'impact': 'Better calendar organization and clarity',
                'editable': True,
                'suggested_changes': {
                    'title_improvements': [{
                        'event_id': e['id'],
                        'current_title': e['title'],
                        'suggested_title': self._suggest_better_title(e)
                    } for e in unclear_events[:3]]
                }
            })
        
        # Detect potential time errors (2 AM events)
        for event in events:
            if event['start_datetime'].hour == 2:
                suggestions.append({
                    'type': 'fix_time',
                    'priority': 'high',
                    'title': f'Fix Time for "{event["title"]}"',
                    'description': '2:00 AM seems incorrect. Should this be 2:00 PM?',
                    'action': 'Change from 2:00 AM to 2:00 PM',
                    'impact': 'Fixes scheduling error',
                    'editable': True,
                    'event_id': event['id'],
                    'suggested_changes': {
                        'start_time': '14:00',
                        'end_time': '15:00'
                    }
                })
        
        return suggestions[:4]
    
    def _suggest_better_title(self, event):
        """Suggest better titles based on category and time"""
        category_suggestions = {
            'work': f"Work Session - {event['title']}",
            'meeting': f"Team Meeting - {event['title']}",
            'personal': f"Personal Time - {event['title']}",
            'health': f"Health Activity - {event['title']}",
            'education': f"Learning Session - {event['title']}"
        }
        return category_suggestions.get(event['category'], f"Scheduled Activity - {event['title']}")

    # Helper methods
    def _calculate_new_end_time(self, start_datetime, duration_hours):
        new_end = start_datetime + timedelta(hours=duration_hours)
        return new_end.strftime('%H:%M')
    
    def _calculate_end_time(self, start_time_str, duration_hours):
        start_time = datetime.strptime(start_time_str, '%H:%M').time()
        start_datetime = datetime.combine(datetime.today(), start_time)
        end_datetime = start_datetime + timedelta(hours=duration_hours)
        return end_datetime.strftime('%H:%M')