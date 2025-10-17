import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../services/calendar.service';

export type ViewMode = 'year' | 'month' | 'week' | 'day';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="view-controls">
          <button *ngFor="let mode of viewModes" 
                  [class.active]="currentView === mode"
                  (click)="setView(mode)">
            {{mode | titlecase}}
          </button>
        </div>
        <div class="navigation">
          <button (click)="navigate(-1)">‹</button>
          <h2>{{getTitle()}}</h2>
          <button (click)="navigate(1)">›</button>
        </div>
        <div class="today-btn">
          <button (click)="goToToday()">Today</button>
        </div>
      </div>
      
      <div class="calendar-content" [ngSwitch]="currentView">
        <div *ngSwitchCase="'year'" class="year-view">
          <div class="months-grid">
            <div *ngFor="let month of months; let i = index" 
                 class="month-card" 
                 (click)="selectMonth(i)">
              <h3>{{month}}</h3>
              <div class="mini-calendar">
                <div *ngFor="let day of getMonthDays(i)" 
                     class="mini-day"
                     [class.today]="isToday(currentYear, i, day)"
                     [class.has-events]="hasEvents(currentYear, i, day)">
                  {{day}}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div *ngSwitchCase="'month'" class="month-view">
          <div class="weekdays">
            <div *ngFor="let day of weekdays" class="weekday">{{day}}</div>
          </div>
          <div class="days-grid">
            <div *ngFor="let day of getCalendarDays()" 
                 class="day-cell"
                 [class.today]="day.isToday"
                 [class.other-month]="!day.isCurrentMonth"
                 [class.has-events]="day.hasEvents"
                 (click)="selectDay(day)">
              <span class="day-number">{{day.date}}</span>
              <div *ngIf="day.events" class="events">
                <div *ngFor="let event of day.events" class="event">{{event.title}}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div *ngSwitchCase="'week'" class="week-view">
          <div class="week-header">
            <div *ngFor="let day of getWeekDays()" 
                 class="week-day-header"
                 [class.today]="day.isToday">
              <div class="day-name">{{day.name}}</div>
              <div class="day-date">{{day.date}}</div>
            </div>
          </div>
          <div class="week-content">
            <div class="time-slots">
              <div *ngFor="let hour of hours" class="time-slot">
                <span class="time">{{hour}}:00</span>
                <div class="hour-events">
                  <div *ngFor="let day of getWeekDays()" class="day-slot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div *ngSwitchCase="'day'" class="day-view">
          <div class="day-header">
            <h3>{{selectedDate | date:'fullDate'}}</h3>
          </div>
          <div class="day-schedule">
            <div *ngFor="let hour of hours" class="hour-block">
              <div class="hour-label">{{hour}}:00</div>
              <div class="hour-content">
                <div *ngFor="let event of getDayEvents(hour)" class="day-event">
                  {{event.title}}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="ai-suggestions" *ngIf="aiSuggestions.length > 0">
        <h3>AI Suggestions</h3>
        <div *ngFor="let suggestion of aiSuggestions" class="suggestion">
          <p>{{suggestion.text}}</p>
          <button (click)="applySuggestion(suggestion)">Apply</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .view-controls button {
      margin-right: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .view-controls button.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
    
    .navigation {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .navigation button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background 0.2s;
    }
    
    .navigation button:hover {
      background: #e9ecef;
    }
    
    .today-btn button {
      padding: 0.5rem 1rem;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .year-view .months-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding: 2rem;
    }
    
    .month-card {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .month-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    
    .mini-calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-top: 0.5rem;
    }
    
    .mini-day {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      border-radius: 2px;
    }
    
    .mini-day.today {
      background: #667eea;
      color: white;
    }
    
    .mini-day.has-events {
      background: #ffc107;
    }
    
    .month-view {
      padding: 1rem;
    }
    
    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      margin-bottom: 1px;
    }
    
    .weekday {
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      background: #f8f9fa;
    }
    
    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #e9ecef;
    }
    
    .day-cell {
      min-height: 120px;
      background: white;
      padding: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .day-cell:hover {
      background: #f8f9fa;
    }
    
    .day-cell.today {
      background: #e3f2fd;
    }
    
    .day-cell.other-month {
      opacity: 0.5;
    }
    
    .day-number {
      font-weight: 600;
      display: block;
      margin-bottom: 0.25rem;
    }
    
    .events {
      font-size: 0.8rem;
    }
    
    .event {
      background: #667eea;
      color: white;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      margin-bottom: 0.2rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .week-view, .day-view {
      padding: 1rem;
    }
    
    .week-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      margin-bottom: 1rem;
    }
    
    .week-day-header {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
    }
    
    .week-day-header.today {
      background: #667eea;
      color: white;
    }
    
    .time-slots {
      display: flex;
      flex-direction: column;
    }
    
    .time-slot {
      display: flex;
      border-bottom: 1px solid #e9ecef;
      min-height: 60px;
    }
    
    .time {
      width: 80px;
      padding: 1rem;
      font-size: 0.9rem;
      color: #666;
    }
    
    .hour-events {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
    }
    
    .day-slot {
      background: #f8f9fa;
      border-right: 1px solid #e9ecef;
    }
    
    .day-schedule {
      max-height: 600px;
      overflow-y: auto;
    }
    
    .hour-block {
      display: flex;
      border-bottom: 1px solid #e9ecef;
      min-height: 80px;
    }
    
    .hour-label {
      width: 80px;
      padding: 1rem;
      font-size: 0.9rem;
      color: #666;
      border-right: 1px solid #e9ecef;
    }
    
    .hour-content {
      flex: 1;
      padding: 0.5rem;
    }
    
    .day-event {
      background: #667eea;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }
    
    .ai-suggestions {
      border-top: 1px solid #e9ecef;
      padding: 1rem 2rem;
      background: #f8f9fa;
    }
    
    .suggestion {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .suggestion button {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class CalendarComponent implements OnInit {
  currentView: ViewMode = 'month';
  viewModes: ViewMode[] = ['year', 'month', 'week', 'day'];
  
  currentDate = new Date();
  selectedDate = new Date();
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  
  months = ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'];
  
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  hours = Array.from({length: 24}, (_, i) => i);
  
  events: any[] = [];
  aiSuggestions: any[] = [];

  constructor(private calendarService: CalendarService) {}

  ngOnInit() {
    this.loadEvents();
    this.generateAISuggestions();
  }

  setView(mode: ViewMode) {
    this.currentView = mode;
  }

  navigate(direction: number) {
    switch(this.currentView) {
      case 'year':
        this.currentYear += direction;
        break;
      case 'month':
        this.currentMonth += direction;
        if (this.currentMonth > 11) {
          this.currentMonth = 0;
          this.currentYear++;
        } else if (this.currentMonth < 0) {
          this.currentMonth = 11;
          this.currentYear--;
        }
        break;
      case 'week':
        this.selectedDate.setDate(this.selectedDate.getDate() + (direction * 7));
        break;
      case 'day':
        this.selectedDate.setDate(this.selectedDate.getDate() + direction);
        break;
    }
  }

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.currentYear = this.currentDate.getFullYear();
    this.currentMonth = this.currentDate.getMonth();
  }

  getTitle(): string {
    switch(this.currentView) {
      case 'year':
        return this.currentYear.toString();
      case 'month':
        return `${this.months[this.currentMonth]} ${this.currentYear}`;
      case 'week':
        return `Week of ${this.selectedDate.toLocaleDateString()}`;
      case 'day':
        return this.selectedDate.toLocaleDateString();
      default:
        return '';
    }
  }

  selectMonth(monthIndex: number) {
    this.currentMonth = monthIndex;
    this.setView('month');
  }

  selectDay(day: any) {
    this.selectedDate = new Date(this.currentYear, this.currentMonth, day.date);
    this.setView('day');
  }

  getMonthDays(monthIndex: number): number[] {
    const daysInMonth = new Date(this.currentYear, monthIndex + 1, 0).getDate();
    return Array.from({length: daysInMonth}, (_, i) => i + 1);
  }

  getCalendarDays(): any[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const day = {
        date: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === this.currentMonth,
        isToday: this.isToday(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
        hasEvents: this.hasEvents(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
        events: this.getDayEvents(currentDate.getHours())
      };
      days.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  getWeekDays(): any[] {
    const startOfWeek = new Date(this.selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push({
        name: this.weekdays[i],
        date: day.getDate(),
        isToday: this.isToday(day.getFullYear(), day.getMonth(), day.getDate())
      });
    }
    return days;
  }

  isToday(year: number, month: number, day: number): boolean {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  }

  hasEvents(year: number, month: number, day: number): boolean {
    return this.events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year &&
             eventDate.getMonth() === month &&
             eventDate.getDate() === day;
    });
  }

  getDayEvents(hour: number): any[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getHours() === hour;
    });
  }

  loadEvents() {
    this.calendarService.getEvents().subscribe(events => {
      this.events = events;
    });
  }

  generateAISuggestions() {
    this.aiSuggestions = [
      { text: "You have a free slot tomorrow at 2 PM. Perfect for your weekly review!", action: 'schedule_review' },
      { text: "Based on your patterns, you're most productive on Tuesday mornings.", action: 'highlight_productive_time' },
      { text: "You have 3 meetings this week. Consider blocking focus time between them.", action: 'block_focus_time' }
    ];
  }

  applySuggestion(suggestion: any) {
    console.log('Applying suggestion:', suggestion);
    // Implement AI suggestion logic
  }
}