import pytest
from app import PlanifyGenerator

class TestPlanifyGenerator:
    def setup_method(self):
        self.planify = PlanifyGenerator()
    
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
            {'day': 'lundi', 'start': '09:00', 'end': '12:00', 'duration': '3:00:00'},
            {'day': 'mardi', 'start': '14:00', 'end': '18:00', 'duration': '4:00:00'}
        ]
        
        schedule = self.planify.generate_schedule(slots)
        
        assert schedule['total_slots'] == 2
        assert len(schedule['schedule']['lundi']) == 1
        assert len(schedule['schedule']['mardi']) == 1
        assert schedule['schedule']['lundi'][0]['start'] == '09:00'