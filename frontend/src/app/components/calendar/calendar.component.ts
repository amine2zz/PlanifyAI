import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../services/calendar.service';

export type ViewMode = 'year' | 'month' | 'week' | 'day';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="action-buttons">
          <button class="add-event-btn" (click)="openAddEventModal()">+ Add Event</button>
          <button class="today-btn" (click)="goToToday()">Today</button>
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
                <div *ngFor="let event of day.events" 
                     class="event"
                     [class]="'priority-' + event.priority"
                     (click)="editEvent(event); $event.stopPropagation()">
                  {{event.title}}
                </div>
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
                  <div *ngFor="let day of getWeekDays(); let dayIndex = index" class="day-slot">
                    <div *ngFor="let event of getWeekDayEvents(day.fullDate, hour)" 
                         class="week-event"
                         [class]="'priority-' + event.priority"
                         (click)="editEvent(event)">
                      {{event.title}}
                    </div>
                  </div>
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
                <div *ngFor="let event of getDayEvents(hour)" 
                     class="day-event"
                     [class]="'priority-' + event.priority"
                     (click)="editEvent(event)">
                  <div class="event-title">{{event.title}}</div>
                  <div class="event-time">{{event.start_time}} - {{event.end_time}}</div>
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
      
      <!-- Add Event Modal -->
      <div class="modal-overlay" *ngIf="showAddEventModal" (click)="closeAddEventModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add New Event</h3>
            <button class="close-btn" (click)="closeAddEventModal()">×</button>
          </div>
          <form class="event-form" (ngSubmit)="saveNewEvent()">
            <div class="form-group">
              <label>Event Title *</label>
              <input type="text" [(ngModel)]="newEvent.title" name="title" required placeholder="Enter event title">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date *</label>
                <input type="date" [(ngModel)]="newEvent.date" name="date" required>
              </div>
              <div class="form-group">
                <label>Start Time *</label>
                <input type="time" [(ngModel)]="newEvent.startTime" name="startTime" required>
              </div>
              <div class="form-group">
                <label>End Time *</label>
                <input type="time" [(ngModel)]="newEvent.endTime" name="endTime" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="newEvent.category" name="category">
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="break">Break</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority</label>
                <select [(ngModel)]="newEvent.priority" name="priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="newEvent.description" name="description" placeholder="Optional description" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-btn" (click)="closeAddEventModal()">Cancel</button>
              <button type="submit" class="save-btn">Save Event</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Edit Event Modal -->
      <div class="modal-overlay" *ngIf="showEditEventModal" (click)="closeEditEventModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Edit Event</h3>
            <button class="close-btn" (click)="closeEditEventModal()">×</button>
          </div>
          <form class="event-form" (ngSubmit)="updateEvent()">
            <div class="form-group">
              <label>Event Title *</label>
              <input type="text" [(ngModel)]="editingEvent.title" name="title" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Date *</label>
                <input type="date" [(ngModel)]="editingEvent.date" name="date" required>
              </div>
              <div class="form-group">
                <label>Start Time *</label>
                <input type="time" [(ngModel)]="editingEvent.start_time" name="startTime" required>
              </div>
              <div class="form-group">
                <label>End Time *</label>
                <input type="time" [(ngModel)]="editingEvent.end_time" name="endTime" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="editingEvent.category" name="category">
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="break">Break</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority</label>
                <select [(ngModel)]="editingEvent.priority" name="priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="editingEvent.description" name="description" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="delete-btn" (click)="deleteEvent()">Delete</button>
              <button type="button" class="cancel-btn" (click)="closeEditEventModal()">Cancel</button>
              <button type="submit" class="save-btn">Update Event</button>
            </div>
          </form>
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
    
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    .add-event-btn {
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    
    .add-event-btn:hover {
      background: #5a6fd8;
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
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }
    
    .event-form {
      padding: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-sizing: border-box;
    }
    
    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }
    
    .cancel-btn, .save-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .cancel-btn {
      background: #6c757d;
      color: white;
    }
    
    .save-btn {
      background: #667eea;
      color: white;
      font-weight: 600;
    }
    
    .delete-btn {
      background: #dc3545;
      color: white;
    }
    
    .day-event {
      background: #667eea;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .day-event:hover {
      background: #5a6fd8;
      transform: translateY(-1px);
    }
    
    .day-event.priority-high {
      background: #dc3545;
    }
    
    .day-event.priority-medium {
      background: #ffc107;
      color: #333;
    }
    
    .day-event.priority-low {
      background: #28a745;
    }
    
    .event-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .event-time {
      font-size: 0.8rem;
      opacity: 0.9;
    }
    
    .event.priority-high {
      background: #dc3545;
    }
    
    .event.priority-medium {
      background: #ffc107;
      color: #333;
    }
    
    .event.priority-low {
      background: #28a745;
    }
    
    .week-event {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      margin-bottom: 0.25rem;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    
    .week-event:hover {
      background: #5a6fd8;
      transform: translateY(-1px);
    }
    
    .week-event.priority-high {
      background: #dc3545;
    }
    
    .week-event.priority-medium {
      background: #ffc107;
      color: #333;
    }
    
    .week-event.priority-low {
      background: #28a745;
    }
    
    .day-slot {
      background: #f8f9fa;
      border-right: 1px solid #e9ecef;
      min-height: 60px;
      padding: 0.25rem;
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
  showAddEventModal = false;
  showEditEventModal = false;
  editingEvent: any = null;
  newEvent = {
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    category: 'general',
    priority: 'medium',
    description: ''
  };

  constructor(private calendarService: CalendarService) {}

  ngOnInit() {
    this.loadEvents();
    this.generateAISuggestions();
    this.addSampleEvents();
  }

  setView(mode: ViewMode) {
    this.currentView = mode;
    // Ensure selectedDate is set to current context
    if (mode === 'day' || mode === 'week') {
      if (!this.selectedDate || 
          this.selectedDate.getFullYear() !== this.currentYear || 
          this.selectedDate.getMonth() !== this.currentMonth) {
        this.selectedDate = new Date(this.currentYear, this.currentMonth, new Date().getDate());
      }
    }
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
      const dayEvents = this.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === currentDate.getFullYear() &&
               eventDate.getMonth() === currentDate.getMonth() &&
               eventDate.getDate() === currentDate.getDate();
      });
      
      const day = {
        date: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === this.currentMonth,
        isToday: this.isToday(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
        hasEvents: dayEvents.length > 0,
        events: dayEvents
      };
      days.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  getWeekDays(): any[] {
    // Use current month/year context for week view
    const referenceDate = new Date(this.currentYear, this.currentMonth, this.selectedDate.getDate());
    const startOfWeek = new Date(referenceDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push({
        name: this.weekdays[i],
        date: day.getDate(),
        fullDate: day.toISOString().split('T')[0],
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
    const currentDateStr = this.selectedDate.toISOString().split('T')[0];
    return this.events.filter(event => {
      if (event.start_time && event.date === currentDateStr) {
        const eventHour = parseInt(event.start_time.split(':')[0]);
        return eventHour === hour;
      }
      return false;
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

  addSampleEvents() {
    // Add sample events for demonstration
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.events = [
      {
        id: 1,
        title: 'Team Standup',
        date: today.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '09:30',
        category: 'meeting',
        priority: 'medium'
      },
      {
        id: 2,
        title: 'Project Planning',
        date: today.toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '15:30',
        category: 'meeting',
        priority: 'high'
      },
      {
        id: 3,
        title: 'Client Call',
        date: tomorrow.toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00',
        category: 'meeting',
        priority: 'high'
      },
      {
        id: 4,
        title: 'Focus Work',
        date: tomorrow.toISOString().split('T')[0],
        start_time: '15:00',
        end_time: '17:00',
        category: 'work',
        priority: 'medium'
      }
    ];
  }

  openAddEventModal() {
    this.showAddEventModal = true;
    // Set default date to today
    const today = new Date();
    this.newEvent.date = today.toISOString().split('T')[0];
    // Set default time to next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    this.newEvent.startTime = nextHour.toTimeString().slice(0, 5);
    nextHour.setHours(nextHour.getHours() + 1);
    this.newEvent.endTime = nextHour.toTimeString().slice(0, 5);
  }

  closeAddEventModal() {
    this.showAddEventModal = false;
    this.resetNewEvent();
  }

  resetNewEvent() {
    this.newEvent = {
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      category: 'general',
      priority: 'medium',
      description: ''
    };
  }

  saveNewEvent() {
    if (this.newEvent.title && this.newEvent.date && this.newEvent.startTime && this.newEvent.endTime) {
      const event = {
        id: this.events.length + 1,
        title: this.newEvent.title,
        date: this.newEvent.date,
        start_time: this.newEvent.startTime,
        end_time: this.newEvent.endTime,
        category: this.newEvent.category,
        priority: this.newEvent.priority,
        description: this.newEvent.description
      };
      
      this.events.push(event);
      this.closeAddEventModal();
      
      alert('Event added successfully!');
    } else {
      alert('Please fill in all required fields.');
    }
  }

  editEvent(event: any) {
    this.editingEvent = { ...event }; // Create a copy
    this.showEditEventModal = true;
  }

  closeEditEventModal() {
    this.showEditEventModal = false;
    this.editingEvent = null;
  }

  updateEvent() {
    if (this.editingEvent && this.editingEvent.title) {
      const index = this.events.findIndex(e => e.id === this.editingEvent.id);
      if (index !== -1) {
        this.events[index] = { ...this.editingEvent };
        this.closeEditEventModal();
        alert('Event updated successfully!');
      }
    } else {
      alert('Please fill in all required fields.');
    }
  }

  deleteEvent() {
    if (this.editingEvent && confirm('Are you sure you want to delete this event?')) {
      const index = this.events.findIndex(e => e.id === this.editingEvent.id);
      if (index !== -1) {
        this.events.splice(index, 1);
        this.closeEditEventModal();
        alert('Event deleted successfully!');
      }
    }
  }

  getWeekDayEvents(date: string, hour: number): any[] {
    return this.events.filter(event => {
      if (event.date === date && event.start_time) {
        const eventHour = parseInt(event.start_time.split(':')[0]);
        return eventHour === hour;
      }
      return false;
    });
  }
}