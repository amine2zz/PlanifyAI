# test_app.py

import pytest
from app import SmartPlanifyGenerator

class TestSmartPlanifyGenerator:
    def setup_method(self):
        self.planify = SmartPlanifyGenerator()
    
    def test_parse_time_slot_valid(self):
        slot = self.planify.parse_time_slot('lundi', '09:00', '12:00')
        assert slot['day'] == 'lundi'
        assert slot['start'] == '09:00'
        assert slot['end'] == '12:00'
    
    def test_parse_time_slot_invalid_time(self):
        with pytest.raises(ValueError):
            self.planify.parse_time_slot('lundi', '12:00', '09:00')
    
    def test_generate_schedule(self):
        slots = [
            {'day': 'lundi', 'start': '09:00', 'end': '12:00'},
            {'day': 'mardi', 'start': '14:00', 'end': '18:00'}
        ]
        
        tasks = [
            {'type': 'étude', 'priority': 'high', 'duration': 120},
            {'type': 'sport', 'priority': 'medium', 'duration': 90}
        ]
        
        schedule = self.planify.generate_schedule(slots, tasks)
        
        assert schedule['total_slots'] == 2
        assert 'lundi' in schedule['calendar']
        assert 'mardi' in schedule['calendar']
        # Check if tasks have been scheduled
        assert any(item['type'] == 'task' for item in schedule['calendar']['lundi'] + schedule['calendar']['mardi'])