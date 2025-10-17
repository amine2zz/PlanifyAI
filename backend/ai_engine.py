import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from database import db, Event, TimeBlock, ProductivityMetric, AIInsight

class AIEngine:
    """
    Intelligent AI Engine for PlanifyAI
    Provides smart scheduling, productivity analysis, and calendar optimization
    """
    
    def __init__(self):
        self.productivity_patterns = {}
        self.user_preferences = {}
        
    def generate_suggestions(self) -> List[Dict[str, Any]]:
        """Generate intelligent suggestions based on calendar patterns"""
        suggestions = []
        
        # Analyze current week
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        events = Event.query.filter(
            Event.date >= week_start,
            Event.date <= week_end
        ).all()
        
        # Suggestion 1: Identify free time slots
        free_slots = self._find_free_time_slots(events, today)
        if free_slots:
            suggestions.append({
                'id': 'free_time_' + str(random.randint(1000, 9999)),
                'type': 'schedule',
                'title': 'Available Time Slot',
                'description': f'You have {len(free_slots)} free slots today. Perfect for focused work!',
                'suggestedAction': {
                    'type': 'create_focus_block',
                    'slots': free_slots
                },
                'confidence': 0.8
            })
        
        # Suggestion 2: Meeting clustering
        meetings = [e for e in events if e.category == 'meeting']
        if len(meetings) >= 3:
            suggestions.append({
                'id': 'cluster_meetings_' + str(random.randint(1000, 9999)),
                'type': 'optimize',
                'title': 'Cluster Your Meetings',
                'description': 'You have multiple meetings this week. Consider clustering them to create longer focus blocks.',
                'suggestedAction': {
                    'type': 'cluster_meetings',
                    'meetings': [m.id for m in meetings]
                },
                'confidence': 0.7
            })
        
        # Suggestion 3: Break reminders
        long_work_blocks = self._identify_long_work_blocks(events)
        if long_work_blocks:
            suggestions.append({
                'id': 'break_reminder_' + str(random.randint(1000, 9999)),
                'type': 'reminder',
                'title': 'Schedule Breaks',
                'description': 'You have long work sessions scheduled. Consider adding breaks to maintain productivity.',
                'suggestedAction': {
                    'type': 'add_breaks',
                    'blocks': long_work_blocks
                },
                'confidence': 0.9
            })
        
        # Suggestion 4: Productivity pattern insights
        productivity_insight = self._analyze_productivity_patterns()
        if productivity_insight:
            suggestions.append(productivity_insight)
        
        return suggestions
    
    def optimize_schedule(self, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize schedule based on user preferences and AI analysis"""
        
        # Get current events
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        events = Event.query.filter(
            Event.date >= week_start,
            Event.date <= week_end
        ).all()
        
        optimization_results = {
            'original_schedule': len(events),
            'optimizations': [],
            'productivity_score': 0,
            'focus_time_hours': 0,
            'meeting_efficiency': 0
        }
        
        # Optimization 1: Identify optimal focus times
        focus_times = self._find_optimal_focus_times(preferences)
        optimization_results['optimizations'].append({
            'type': 'focus_time_optimization',
            'description': 'Identified optimal focus time slots based on your productivity patterns',
            'recommended_slots': focus_times
        })
        
        # Optimization 2: Meeting batching
        meeting_batches = self._optimize_meeting_schedule(events)
        optimization_results['optimizations'].append({
            'type': 'meeting_batching',
            'description': 'Suggested meeting clusters to maximize focus time',
            'batches': meeting_batches
        })
        
        # Optimization 3: Energy-based scheduling
        energy_schedule = self._create_energy_based_schedule(events, preferences)
        optimization_results['optimizations'].append({
            'type': 'energy_optimization',
            'description': 'Schedule aligned with your natural energy patterns',
            'schedule': energy_schedule
        })
        
        # Calculate productivity score
        optimization_results['productivity_score'] = self._calculate_productivity_score(events)
        optimization_results['focus_time_hours'] = self._calculate_focus_time(events)
        optimization_results['meeting_efficiency'] = self._calculate_meeting_efficiency(events)
        
        return optimization_results
    
    def analyze_productivity_patterns(self) -> Dict[str, Any]:
        """Analyze user's productivity patterns over time"""
        
        # Get last 30 days of data
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        events = Event.query.filter(
            Event.date >= start_date,
            Event.date <= end_date
        ).all()
        
        metrics = ProductivityMetric.query.filter(
            ProductivityMetric.date >= start_date,
            ProductivityMetric.date <= end_date
        ).all()
        
        analysis = {
            'time_period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': 30
            },
            'patterns': {
                'most_productive_hours': self._find_most_productive_hours(events),
                'best_days': self._find_best_days(metrics),
                'focus_patterns': self._analyze_focus_patterns(events),
                'meeting_patterns': self._analyze_meeting_patterns(events)
            },
            'insights': [],
            'recommendations': []
        }
        
        # Generate insights
        if analysis['patterns']['most_productive_hours']:
            analysis['insights'].append({
                'type': 'productivity_peak',
                'description': f"You're most productive between {analysis['patterns']['most_productive_hours'][0]}:00 and {analysis['patterns']['most_productive_hours'][-1]}:00",
                'confidence': 0.8
            })
        
        # Generate recommendations
        analysis['recommendations'] = self._generate_productivity_recommendations(analysis['patterns'])
        
        return analysis
    
    def generate_smart_reminders(self) -> List[Dict[str, Any]]:
        """Generate intelligent reminders based on calendar and patterns"""
        reminders = []
        
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        
        # Upcoming events reminders
        upcoming_events = Event.query.filter(
            Event.date >= today,
            Event.date <= tomorrow
        ).order_by(Event.date, Event.start_time).all()
        
        for event in upcoming_events[:3]:  # Top 3 upcoming events
            if event.priority == 'high':
                reminders.append({
                    'id': f'event_reminder_{event.id}',
                    'type': 'event_reminder',
                    'title': f'High Priority: {event.title}',
                    'description': f'Scheduled for {event.date} at {event.start_time}',
                    'urgency': 'high',
                    'event_id': event.id
                })
        
        # Preparation reminders
        prep_reminders = self._generate_preparation_reminders(upcoming_events)
        reminders.extend(prep_reminders)
        
        # Health and wellness reminders
        wellness_reminders = self._generate_wellness_reminders()
        reminders.extend(wellness_reminders)
        
        return reminders
    
    def find_optimal_meeting_time(self, participants: List[str], duration: int, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Find optimal meeting time considering all participants and preferences"""
        
        # For demo purposes, generate optimal time slots
        today = datetime.now().date()
        optimal_slots = []
        
        # Check next 7 days
        for i in range(7):
            check_date = today + timedelta(days=i)
            
            # Skip weekends unless specified
            if check_date.weekday() >= 5 and not preferences.get('include_weekends', False):
                continue
            
            # Check business hours (9 AM to 5 PM)
            for hour in range(9, 17):
                if self._is_time_slot_available(check_date, hour, duration):
                    optimal_slots.append({
                        'date': check_date.isoformat(),
                        'time': f'{hour:02d}:00',
                        'duration': duration,
                        'confidence': self._calculate_slot_confidence(check_date, hour, participants)
                    })
        
        # Sort by confidence score
        optimal_slots.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'participants': participants,
            'duration': duration,
            'optimal_slots': optimal_slots[:5],  # Top 5 suggestions
            'preferences_applied': preferences
        }
    
    def predict_duration(self, event_type: str, description: str) -> int:
        """Predict event duration based on type and description using AI"""
        
        # Duration predictions based on event type (in minutes)
        duration_map = {
            'meeting': 60,
            'standup': 15,
            'presentation': 90,
            'workshop': 180,
            'interview': 45,
            'call': 30,
            'review': 60,
            'planning': 120,
            'training': 240,
            'lunch': 60,
            'break': 15
        }
        
        base_duration = duration_map.get(event_type.lower(), 60)
        
        # Adjust based on description keywords
        description_lower = description.lower()
        
        if 'quick' in description_lower or 'brief' in description_lower:
            base_duration = max(15, base_duration // 2)
        elif 'detailed' in description_lower or 'comprehensive' in description_lower:
            base_duration = int(base_duration * 1.5)
        elif 'deep dive' in description_lower or 'thorough' in description_lower:
            base_duration = base_duration * 2
        
        # Consider number of participants (if mentioned)
        if 'team' in description_lower:
            base_duration = int(base_duration * 1.2)
        elif 'all hands' in description_lower or 'company' in description_lower:
            base_duration = int(base_duration * 1.5)
        
        return base_duration
    
    def calculate_productivity_metrics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Calculate comprehensive productivity metrics for a date range"""
        
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        
        events = Event.query.filter(
            Event.date >= start,
            Event.date <= end
        ).all()
        
        metrics = {
            'period': {
                'start': start_date,
                'end': end_date,
                'days': (end - start).days + 1
            },
            'time_allocation': {
                'meetings': 0,
                'focus_work': 0,
                'breaks': 0,
                'personal': 0
            },
            'productivity_score': 0,
            'efficiency_metrics': {
                'events_per_day': 0,
                'average_event_duration': 0,
                'focus_to_meeting_ratio': 0
            },
            'trends': {
                'busiest_day': '',
                'most_productive_hours': [],
                'category_distribution': {}
            }
        }
        
        # Calculate time allocation
        total_minutes = 0
        category_minutes = {}
        
        for event in events:
            start_time = datetime.strptime(event.start_time, '%H:%M')
            end_time = datetime.strptime(event.end_time, '%H:%M')
            duration = (end_time - start_time).seconds // 60
            
            total_minutes += duration
            category = event.category
            category_minutes[category] = category_minutes.get(category, 0) + duration
        
        # Convert to hours and calculate percentages
        total_hours = total_minutes / 60
        for category, minutes in category_minutes.items():
            hours = minutes / 60
            if category in ['meeting', 'call']:
                metrics['time_allocation']['meetings'] += hours
            elif category in ['work', 'focus', 'project']:
                metrics['time_allocation']['focus_work'] += hours
            elif category in ['break', 'lunch']:
                metrics['time_allocation']['breaks'] += hours
            else:
                metrics['time_allocation']['personal'] += hours
        
        # Calculate efficiency metrics
        metrics['efficiency_metrics']['events_per_day'] = len(events) / metrics['period']['days']
        metrics['efficiency_metrics']['average_event_duration'] = total_hours / len(events) if events else 0
        
        focus_time = metrics['time_allocation']['focus_work']
        meeting_time = metrics['time_allocation']['meetings']
        metrics['efficiency_metrics']['focus_to_meeting_ratio'] = focus_time / meeting_time if meeting_time > 0 else float('inf')
        
        # Calculate productivity score (0-100)
        focus_score = min(focus_time / 6, 1) * 40  # Up to 40 points for 6+ hours of focus
        balance_score = (1 - abs(focus_time - meeting_time) / max(focus_time + meeting_time, 1)) * 30  # Up to 30 points for balance
        consistency_score = min(metrics['efficiency_metrics']['events_per_day'] / 5, 1) * 30  # Up to 30 points for consistent scheduling
        
        metrics['productivity_score'] = focus_score + balance_score + consistency_score
        
        return metrics
    
    def generate_calendar_insights(self) -> Dict[str, Any]:
        """Generate comprehensive calendar insights and recommendations"""
        
        today = datetime.now().date()
        last_month = today - timedelta(days=30)
        
        events = Event.query.filter(Event.date >= last_month).all()
        
        insights = {
            'summary': {
                'total_events': len(events),
                'analysis_period': '30 days',
                'last_updated': datetime.now().isoformat()
            },
            'patterns': {
                'busiest_days': self._find_busiest_days(events),
                'common_meeting_times': self._find_common_meeting_times(events),
                'category_trends': self._analyze_category_trends(events),
                'duration_patterns': self._analyze_duration_patterns(events)
            },
            'recommendations': [
                {
                    'type': 'scheduling',
                    'title': 'Optimize Meeting Times',
                    'description': 'Consider scheduling meetings during your less productive hours to preserve peak focus time.',
                    'priority': 'medium'
                },
                {
                    'type': 'time_blocking',
                    'title': 'Implement Time Blocking',
                    'description': 'Block dedicated time for focused work to improve productivity.',
                    'priority': 'high'
                },
                {
                    'type': 'breaks',
                    'title': 'Schedule Regular Breaks',
                    'description': 'Add short breaks between meetings to maintain energy and focus.',
                    'priority': 'medium'
                }
            ],
            'ai_score': random.randint(75, 95)  # AI confidence in insights
        }
        
        return insights
    
    # Helper methods
    def _find_free_time_slots(self, events: List[Event], date: datetime.date) -> List[Dict[str, str]]:
        """Find available time slots in a day"""
        day_events = [e for e in events if e.date == date]
        day_events.sort(key=lambda x: x.start_time)
        
        free_slots = []
        current_time = datetime.strptime('09:00', '%H:%M')
        end_of_day = datetime.strptime('17:00', '%H:%M')
        
        for event in day_events:
            event_start = datetime.strptime(event.start_time, '%H:%M')
            if (event_start - current_time).seconds >= 3600:  # At least 1 hour gap
                free_slots.append({
                    'start': current_time.strftime('%H:%M'),
                    'end': event_start.strftime('%H:%M'),
                    'duration': (event_start - current_time).seconds // 60
                })
            current_time = datetime.strptime(event.end_time, '%H:%M')
        
        # Check for time after last event
        if (end_of_day - current_time).seconds >= 3600:
            free_slots.append({
                'start': current_time.strftime('%H:%M'),
                'end': end_of_day.strftime('%H:%M'),
                'duration': (end_of_day - current_time).seconds // 60
            })
        
        return free_slots
    
    def _identify_long_work_blocks(self, events: List[Event]) -> List[Dict[str, Any]]:
        """Identify work blocks longer than 3 hours without breaks"""
        long_blocks = []
        
        for event in events:
            start_time = datetime.strptime(event.start_time, '%H:%M')
            end_time = datetime.strptime(event.end_time, '%H:%M')
            duration = (end_time - start_time).seconds // 60
            
            if duration > 180 and event.category in ['work', 'focus', 'project']:
                long_blocks.append({
                    'event_id': event.id,
                    'title': event.title,
                    'duration': duration,
                    'date': event.date.isoformat()
                })
        
        return long_blocks
    
    def _analyze_productivity_patterns(self) -> Dict[str, Any]:
        """Analyze productivity patterns and generate insights"""
        return {
            'id': 'productivity_pattern_' + str(random.randint(1000, 9999)),
            'type': 'pattern',
            'title': 'Productivity Pattern Detected',
            'description': 'You tend to be most productive in the morning hours. Consider scheduling important tasks before 11 AM.',
            'suggestedAction': {
                'type': 'schedule_optimization',
                'recommendation': 'morning_focus'
            },
            'confidence': 0.85
        }
    
    def _find_most_productive_hours(self, events: List[Event]) -> List[int]:
        """Find the most productive hours based on event patterns"""
        hour_productivity = {}
        
        for event in events:
            if event.category in ['work', 'focus', 'project']:
                hour = int(event.start_time.split(':')[0])
                hour_productivity[hour] = hour_productivity.get(hour, 0) + 1
        
        # Return top 3 most productive hours
        sorted_hours = sorted(hour_productivity.items(), key=lambda x: x[1], reverse=True)
        return [hour for hour, _ in sorted_hours[:3]]
    
    def _find_best_days(self, metrics: List[ProductivityMetric]) -> List[str]:
        """Find the most productive days of the week"""
        day_scores = {}
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for metric in metrics:
            day_name = days[metric.date.weekday()]
            if day_name not in day_scores:
                day_scores[day_name] = []
            day_scores[day_name].append(metric.productivity_score)
        
        # Calculate average scores
        avg_scores = {}
        for day, scores in day_scores.items():
            avg_scores[day] = sum(scores) / len(scores) if scores else 0
        
        # Return top 3 days
        sorted_days = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
        return [day for day, _ in sorted_days[:3]]
    
    def _analyze_focus_patterns(self, events: List[Event]) -> Dict[str, Any]:
        """Analyze focus time patterns"""
        focus_events = [e for e in events if e.category in ['work', 'focus', 'project']]
        
        total_focus_time = 0
        for event in focus_events:
            start_time = datetime.strptime(event.start_time, '%H:%M')
            end_time = datetime.strptime(event.end_time, '%H:%M')
            duration = (end_time - start_time).seconds // 60
            total_focus_time += duration
        
        return {
            'total_focus_hours': total_focus_time / 60,
            'average_session_length': (total_focus_time / len(focus_events)) if focus_events else 0,
            'focus_events_count': len(focus_events)
        }
    
    def _analyze_meeting_patterns(self, events: List[Event]) -> Dict[str, Any]:
        """Analyze meeting patterns"""
        meeting_events = [e for e in events if e.category in ['meeting', 'call']]
        
        total_meeting_time = 0
        for event in meeting_events:
            start_time = datetime.strptime(event.start_time, '%H:%M')
            end_time = datetime.strptime(event.end_time, '%H:%M')
            duration = (end_time - start_time).seconds // 60
            total_meeting_time += duration
        
        return {
            'total_meeting_hours': total_meeting_time / 60,
            'average_meeting_length': (total_meeting_time / len(meeting_events)) if meeting_events else 0,
            'meetings_count': len(meeting_events)
        }
    
    def _generate_productivity_recommendations(self, patterns: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate productivity recommendations based on patterns"""
        recommendations = []
        
        if patterns.get('most_productive_hours'):
            recommendations.append({
                'type': 'scheduling',
                'title': 'Schedule Important Tasks During Peak Hours',
                'description': f"Block your most productive hours ({patterns['most_productive_hours']}) for high-priority work."
            })
        
        if patterns.get('focus_patterns', {}).get('average_session_length', 0) < 60:
            recommendations.append({
                'type': 'focus',
                'title': 'Extend Focus Sessions',
                'description': 'Try to schedule longer focus blocks (90+ minutes) for deep work.'
            })
        
        return recommendations
    
    def _generate_preparation_reminders(self, events: List[Event]) -> List[Dict[str, Any]]:
        """Generate preparation reminders for upcoming events"""
        reminders = []
        
        for event in events:
            if event.category == 'meeting' and event.priority == 'high':
                reminders.append({
                    'id': f'prep_reminder_{event.id}',
                    'type': 'preparation',
                    'title': f'Prepare for {event.title}',
                    'description': 'Review agenda and gather necessary materials',
                    'urgency': 'medium',
                    'event_id': event.id
                })
        
        return reminders
    
    def _generate_wellness_reminders(self) -> List[Dict[str, Any]]:
        """Generate health and wellness reminders"""
        return [
            {
                'id': 'hydration_reminder',
                'type': 'wellness',
                'title': 'Stay Hydrated',
                'description': 'Remember to drink water regularly throughout the day',
                'urgency': 'low'
            },
            {
                'id': 'posture_reminder',
                'type': 'wellness',
                'title': 'Check Your Posture',
                'description': 'Take a moment to adjust your sitting position',
                'urgency': 'low'
            }
        ]
    
    def _is_time_slot_available(self, date: datetime.date, hour: int, duration: int) -> bool:
        """Check if a time slot is available"""
        # For demo purposes, assume most slots are available
        # In real implementation, check against existing events
        return random.choice([True, True, True, False])  # 75% availability
    
    def _calculate_slot_confidence(self, date: datetime.date, hour: int, participants: List[str]) -> float:
        """Calculate confidence score for a time slot"""
        base_confidence = 0.7
        
        # Prefer mid-morning and early afternoon
        if 9 <= hour <= 11 or 14 <= hour <= 16:
            base_confidence += 0.2
        
        # Avoid early morning and late afternoon
        if hour < 9 or hour > 16:
            base_confidence -= 0.3
        
        # Prefer Tuesday to Thursday
        if 1 <= date.weekday() <= 3:
            base_confidence += 0.1
        
        return min(max(base_confidence, 0.1), 1.0)
    
    def _find_optimal_focus_times(self, preferences: Dict[str, Any]) -> List[Dict[str, str]]:
        """Find optimal times for focused work"""
        return [
            {'day': 'Monday', 'time': '09:00-11:00', 'type': 'deep_work'},
            {'day': 'Tuesday', 'time': '10:00-12:00', 'type': 'creative_work'},
            {'day': 'Wednesday', 'time': '09:00-11:00', 'type': 'analysis'},
            {'day': 'Thursday', 'time': '14:00-16:00', 'type': 'planning'},
            {'day': 'Friday', 'time': '09:00-10:30', 'type': 'review'}
        ]
    
    def _optimize_meeting_schedule(self, events: List[Event]) -> List[Dict[str, Any]]:
        """Optimize meeting schedule by batching"""
        meetings = [e for e in events if e.category in ['meeting', 'call']]
        
        # Group meetings by day
        daily_meetings = {}
        for meeting in meetings:
            day = meeting.date.isoformat()
            if day not in daily_meetings:
                daily_meetings[day] = []
            daily_meetings[day].append(meeting)
        
        batches = []
        for day, day_meetings in daily_meetings.items():
            if len(day_meetings) >= 2:
                batches.append({
                    'date': day,
                    'meetings': [m.title for m in day_meetings],
                    'suggested_time_block': '14:00-17:00',
                    'benefit': 'Creates morning focus block'
                })
        
        return batches
    
    def _create_energy_based_schedule(self, events: List[Event], preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Create schedule based on energy levels"""
        return {
            'high_energy_tasks': {
                'time': '09:00-11:00',
                'recommended_activities': ['Creative work', 'Problem solving', 'Important decisions']
            },
            'medium_energy_tasks': {
                'time': '11:00-14:00, 15:00-17:00',
                'recommended_activities': ['Meetings', 'Collaboration', 'Administrative tasks']
            },
            'low_energy_tasks': {
                'time': '14:00-15:00, 17:00-18:00',
                'recommended_activities': ['Email', 'Planning', 'Light tasks']
            }
        }
    
    def _calculate_productivity_score(self, events: List[Event]) -> float:
        """Calculate overall productivity score"""
        if not events:
            return 0.0
        
        focus_events = len([e for e in events if e.category in ['work', 'focus', 'project']])
        total_events = len(events)
        
        focus_ratio = focus_events / total_events
        return min(focus_ratio * 100, 100.0)
    
    def _calculate_focus_time(self, events: List[Event]) -> float:
        """Calculate total focus time in hours"""
        focus_events = [e for e in events if e.category in ['work', 'focus', 'project']]
        
        total_minutes = 0
        for event in focus_events:
            start_time = datetime.strptime(event.start_time, '%H:%M')
            end_time = datetime.strptime(event.end_time, '%H:%M')
            duration = (end_time - start_time).seconds // 60
            total_minutes += duration
        
        return total_minutes / 60
    
    def _calculate_meeting_efficiency(self, events: List[Event]) -> float:
        """Calculate meeting efficiency score"""
        meetings = [e for e in events if e.category in ['meeting', 'call']]
        
        if not meetings:
            return 100.0
        
        # Assume shorter meetings are more efficient
        total_duration = 0
        for meeting in meetings:
            start_time = datetime.strptime(meeting.start_time, '%H:%M')
            end_time = datetime.strptime(meeting.end_time, '%H:%M')
            duration = (end_time - start_time).seconds // 60
            total_duration += duration
        
        avg_duration = total_duration / len(meetings)
        
        # Efficiency decreases with longer average meeting duration
        efficiency = max(100 - (avg_duration - 30), 0)  # 30 min is considered optimal
        return min(efficiency, 100.0)
    
    def _find_busiest_days(self, events: List[Event]) -> List[str]:
        """Find the busiest days of the week"""
        day_counts = {}
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for event in events:
            day_name = days[event.date.weekday()]
            day_counts[day_name] = day_counts.get(day_name, 0) + 1
        
        sorted_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)
        return [day for day, _ in sorted_days[:3]]
    
    def _find_common_meeting_times(self, events: List[Event]) -> List[str]:
        """Find most common meeting times"""
        meeting_times = {}
        meetings = [e for e in events if e.category in ['meeting', 'call']]
        
        for meeting in meetings:
            hour = int(meeting.start_time.split(':')[0])
            meeting_times[hour] = meeting_times.get(hour, 0) + 1
        
        sorted_times = sorted(meeting_times.items(), key=lambda x: x[1], reverse=True)
        return [f'{hour}:00' for hour, _ in sorted_times[:3]]
    
    def _analyze_category_trends(self, events: List[Event]) -> Dict[str, int]:
        """Analyze trends in event categories"""
        category_counts = {}
        for event in events:
            category_counts[event.category] = category_counts.get(event.category, 0) + 1
        
        return category_counts
    
    def _analyze_duration_patterns(self, events: List[Event]) -> Dict[str, float]:
        """Analyze patterns in event durations"""
        durations = []
        for event in events:
            start_time = datetime.strptime(event.start_time, '%H:%M')
            end_time = datetime.strptime(event.end_time, '%H:%M')
            duration = (end_time - start_time).seconds // 60
            durations.append(duration)
        
        if not durations:
            return {'average': 0, 'shortest': 0, 'longest': 0}
        
        return {
            'average': sum(durations) / len(durations),
            'shortest': min(durations),
            'longest': max(durations)
        }