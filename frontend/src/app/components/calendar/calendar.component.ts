import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-container">
      <div class="header">
        <div class="nav-controls">
          <button class="nav-btn" (click)="prevPeriod()">‹</button>
          <h2 class="title">{{getTitle()}}</h2>
          <button class="nav-btn" (click)="nextPeriod()">›</button>
        </div>
        <div class="view-controls">
          <button *ngFor="let view of views" 
                  [class.active]="currentView === view"
                  (click)="setView(view)">{{view}}</button>
          <button class="today-btn" (click)="goToday()">Today</button>
        </div>
      </div>

      <div class="dashboard" *ngIf="showDashboard">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>{{analytics.totalEvents}}</h3>
            <p>Total Events</p>
          </div>
          <div class="stat-card">
            <h3>{{analytics.weeklyEvents}}</h3>
            <p>This Week</p>
          </div>
        </div>
        <div class="category-chart">
          <h3>Time by Category</h3>
          <div class="chart-bars">
            <div *ngFor="let cat of analytics.categories" class="bar-item">
              <div class="bar" [class]="'category-' + cat.name" [style.height.%]="getBarHeight(cat.count)"></div>
              <span>{{cat.name}} ({{cat.count}})</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="calendar-content" [ngSwitch]="currentView">
        <div *ngSwitchCase="'Month'" class="month-view">
          <div class="weekdays">
            <div *ngFor="let day of weekdays" class="weekday">{{day}}</div>
          </div>
          <div class="calendar-grid">
            <div *ngFor="let day of calendarDays" 
                 class="day-cell" 
                 [class.today]="day.isToday"
                 [class.other-month]="!day.isCurrentMonth">
              <span class="day-number">{{day.date}}</span>
              <div class="events-container">
                <div *ngFor="let event of day.events" 
                     class="event-item" 
                     [class]="'category-' + event.category + ' priority-' + event.priority"
                     (click)="editEvent(event)">
                  <span class="event-title">{{event.title}}</span>
                  <span class="event-time">{{event.startTime}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'Week'" class="week-view">
          <div class="week-header">
            <div class="time-header"></div>
            <div *ngFor="let day of getWeekDays()" class="week-day">
              <div class="day-name">{{day.name}}</div>
              <div class="day-date">{{day.date}}</div>
            </div>
          </div>
          <div class="week-grid">
            <div *ngFor="let hour of hours" class="hour-row">
              <div class="hour-label">{{hour}}:00</div>
              <div *ngFor="let day of getWeekDays()" class="hour-cell">
                <div *ngFor="let event of getHourEvents(day.fullDate, hour)" 
                     class="week-event"
                     [class]="'category-' + event.category"
                     (click)="editEvent(event)">
                  {{event.title}}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'Day'" class="day-view">
          <div class="day-header">
            <h3>{{selectedDate | date:'fullDate'}}</h3>
          </div>
          <div class="day-schedule">
            <div *ngFor="let hour of hours" class="hour-block">
              <div class="hour-label">{{hour}}:00</div>
              <div class="hour-content">
                <div *ngFor="let event of getHourEvents(selectedDate.toISOString().split('T')[0], hour)" 
                     class="day-event"
                     [class]="'category-' + event.category"
                     (click)="editEvent(event)">
                  <div class="event-title">{{event.title}}</div>
                  <div class="event-time">{{event.startTime}} - {{event.endTime}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="voice-assistant">
        <div class="voice-header">
          <h3>🎤 AI Voice Assistant</h3>
          <button class="dashboard-toggle" (click)="toggleDashboard()">
            📊 {{showDashboard ? 'Hide' : 'Show'}} Analytics
          </button>
        </div>
        
        <div class="voice-controls">
          <button class="voice-btn" 
                  [class.listening]="isListening"
                  [class.processing]="isProcessing"
                  (click)="toggleVoice()">
            <span class="mic-icon">{{isListening ? '🔴' : '🎤'}}</span>
            <span>{{isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Click to Speak'}}</span>
          </button>
        </div>

        <div *ngIf="lastCommand || voiceResult" class="voice-feedback">
          <div class="transcript">
            <label><strong>What you said:</strong></label>
            <textarea [(ngModel)]="lastCommand" 
                      class="transcript-edit" 
                      placeholder="Edit your voice command here..."
                      (input)="onTranscriptEdit()"></textarea>
            <button class="reprocess-btn" (click)="reprocessCommand()" [disabled]="!lastCommand">
              🔄 Reprocess
            </button>
          </div>
          
          <div *ngIf="voiceResult" class="ai-interpretation">
            <div class="interpretation-header">
              <strong>AI understood:</strong>
              <span class="confidence-badge" [class]="getConfidenceClass(voiceResult.confidence)">
                {{(voiceResult.confidence * 100).toFixed(0)}}% confident
              </span>
            </div>
            
            <div class="event-preview">
              <div class="preview-field">
                <label>Title:</label>
                <input [(ngModel)]="voiceResult.event.title" class="edit-input">
              </div>
              <div class="preview-row">
                <div class="preview-field">
                  <label>Date:</label>
                  <input type="date" [(ngModel)]="voiceResult.event.date" class="edit-input">
                </div>
                <div class="preview-field">
                  <label>Time:</label>
                  <input type="time" [(ngModel)]="voiceResult.event.time" class="edit-input">
                </div>
                <div class="preview-field">
                  <label>End:</label>
                  <input type="time" [(ngModel)]="voiceResult.event.endTime" class="edit-input">
                </div>
              </div>
              <div class="preview-row">
                <div class="preview-field">
                  <label>Category:</label>
                  <select [(ngModel)]="voiceResult.event.category" class="edit-select">
                    <option value="general">General</option>
                    <option value="meeting">Meeting</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                  </select>
                </div>
                <div class="preview-field">
                  <label>Priority:</label>
                  <select [(ngModel)]="voiceResult.event.priority" class="edit-select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button class="confirm-btn" (click)="confirmEvent()">✅ Add to Calendar</button>
              <button class="retry-btn" (click)="retryVoice()">🔄 Try Again</button>
              <button class="cancel-btn" (click)="cancelVoice()">❌ Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Event Modal -->
      <div *ngIf="editingEvent" class="modal-overlay" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Edit Event</h3>
            <button class="close-btn" (click)="closeEditModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Title:</label>
              <input [(ngModel)]="editingEvent.title" class="form-input">
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Date:</label>
                <input type="date" [(ngModel)]="editingEvent.date" class="form-input">
              </div>
              <div class="form-field">
                <label>Start:</label>
                <input type="time" [(ngModel)]="editingEvent.startTime" class="form-input">
              </div>
              <div class="form-field">
                <label>End:</label>
                <input type="time" [(ngModel)]="editingEvent.endTime" class="form-input">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Category:</label>
                <select [(ngModel)]="editingEvent.category" class="form-input">
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                </select>
              </div>
              <div class="form-field">
                <label>Priority:</label>
                <select [(ngModel)]="editingEvent.priority" class="form-input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div class="form-field">
              <label>Description:</label>
              <textarea [(ngModel)]="editingEvent.description" class="form-input" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="delete-btn" (click)="deleteEvent()">Delete</button>
            <button class="cancel-btn" (click)="closeEditModal()">Cancel</button>
            <button class="save-btn" (click)="saveEvent()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin-bottom: 1rem; }
    .nav-controls { display: flex; align-items: center; gap: 1rem; }
    .view-controls { display: flex; gap: 0.5rem; }
    .view-controls button { padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; }
    .view-controls button.active { background: rgba(255,255,255,0.4); }
    .nav-btn { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; }
    .title { margin: 0; font-size: 1.8rem; font-weight: 600; }
    .today-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    
    .dashboard { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px; }
    .stat-card h3 { margin: 0; font-size: 2rem; color: #667eea; }
    .stat-card p { margin: 0.5rem 0 0 0; color: #666; }
    .category-chart h3 { margin: 0 0 1rem 0; }
    .chart-bars { display: flex; gap: 1rem; align-items: flex-end; height: 150px; }
    .bar-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .bar { width: 100%; min-height: 10px; border-radius: 4px 4px 0 0; }
    .bar-item span { margin-top: 0.5rem; font-size: 0.8rem; text-align: center; }
    
    .weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #f8f9fa; border-radius: 8px; overflow: hidden; margin-bottom: 1px; }
    .weekday { padding: 1rem; text-align: center; font-weight: 600; background: #f8f9fa; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #f8f9fa; border-radius: 8px; overflow: hidden; margin-bottom: 2rem; }
    .day-cell { min-height: 120px; background: white; padding: 0.75rem; }
    .day-cell.today { background: #e3f2fd; border: 2px solid #2196f3; }
    .day-cell.other-month { opacity: 0.4; }
    .day-number { font-weight: 600; font-size: 1.1rem; }
    .events-container { margin-top: 0.5rem; }
    .event-item { padding: 0.25rem 0.5rem; margin-bottom: 0.25rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; display: flex; justify-content: space-between; }
    .event-title { font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .event-time { font-size: 0.7rem; opacity: 0.8; }
    
    .week-view, .day-view { background: white; border-radius: 12px; padding: 1rem; }
    .week-header { display: grid; grid-template-columns: 80px repeat(7, 1fr); gap: 1px; margin-bottom: 1rem; }
    .time-header { background: #f8f9fa; }
    .week-day { text-align: center; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; }
    .week-grid { display: grid; grid-template-columns: 80px repeat(7, 1fr); gap: 1px; }
    .hour-row { display: contents; }
    .hour-label { padding: 0.5rem; font-size: 0.9rem; color: #666; border-right: 1px solid #eee; }
    .hour-cell { min-height: 60px; border-bottom: 1px solid #eee; padding: 0.25rem; }
    .week-event, .day-event { padding: 0.25rem 0.5rem; border-radius: 4px; margin-bottom: 0.25rem; cursor: pointer; font-size: 0.8rem; }
    .day-schedule { max-height: 600px; overflow-y: auto; }
    .hour-block { display: flex; border-bottom: 1px solid #eee; min-height: 80px; }
    .hour-content { flex: 1; padding: 0.5rem; }
    
    .category-general { background: #6c757d; color: white; }
    .category-meeting { background: #007bff; color: white; }
    .category-work { background: #28a745; color: white; }
    .category-personal { background: #17a2b8; color: white; }
    .category-health { background: #dc3545; color: white; }
    .category-education { background: #6f42c1; color: white; }
    
    .priority-high { border-left: 4px solid #dc3545; }
    .priority-medium { border-left: 4px solid #ffc107; }
    .priority-low { border-left: 4px solid #28a745; }
    
    .voice-assistant { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 2rem; color: white; }
    .voice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .voice-header h3 { margin: 0; font-size: 1.5rem; }
    .dashboard-toggle { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .voice-controls { display: flex; justify-content: center; margin-bottom: 2rem; }
    .voice-btn { background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); border-radius: 50px; padding: 1rem 2rem; color: white; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; }
    .voice-btn.listening { background: #ff4757; animation: pulse 1.5s infinite; }
    .voice-btn.processing { background: #ffa502; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    .voice-feedback { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; }
    .transcript { margin-bottom: 1.5rem; }
    .transcript label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
    .transcript-edit { width: 100%; min-height: 60px; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.2); color: white; resize: vertical; font-family: inherit; }
    .reprocess-btn { margin-top: 0.5rem; padding: 0.5rem 1rem; background: #5a6fd8; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .ai-interpretation { background: rgba(255,255,255,0.15); border-radius: 8px; padding: 1.5rem; }
    .interpretation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .confidence-badge { padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 600; }
    .confidence-high { background: #2ed573; }
    .confidence-medium { background: #ffa502; }
    .confidence-low { background: #ff4757; }
    .event-preview { margin: 1rem 0; }
    .preview-field { margin-bottom: 1rem; }
    .preview-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
    .preview-field label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
    .edit-input, .edit-select { width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.2); color: white; }
    .action-buttons { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; }
    .action-buttons button { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .confirm-btn { background: #2ed573; color: white; }
    .retry-btn { background: #ffa502; color: white; }
    .cancel-btn { background: #ff4757; color: white; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #eee; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .form-field { margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
    .form-input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; }
    .modal-footer { display: flex; gap: 1rem; justify-content: flex-end; padding: 1.5rem; border-top: 1px solid #eee; }
    .delete-btn { background: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; }
    .save-btn { background: #28a745; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; }
  `]
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  selectedDate = new Date();
  currentView = 'Month';
  views = ['Month', 'Week', 'Day'];
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  hours = Array.from({length: 24}, (_, i) => i);
  calendarDays: any[] = [];
  events: any[] = [];
  analytics: any = { categories: [], weeklyEvents: 0, totalEvents: 0 };
  showDashboard = false;
  editingEvent: any = null;
  
  isListening = false;
  isProcessing = false;
  lastCommand = '';
  voiceResult: any = null;
  recognition: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.updateCalendar();
    this.loadEvents();
    this.loadAnalytics();
    this.initVoice();
  }

  setView(view: string) {
    this.currentView = view;
    if (view === 'Day') {
      this.selectedDate = new Date(this.currentDate);
    }
  }

  getTitle(): string {
    if (this.currentView === 'Month') {
      return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (this.currentView === 'Week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return `Week of ${weekStart.toLocaleDateString()}`;
    } else {
      return this.selectedDate.toLocaleDateString();
    }
  }

  prevPeriod() {
    if (this.currentView === 'Month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.currentView === 'Week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.selectedDate.setDate(this.selectedDate.getDate() - 1);
    }
    this.updateCalendar();
  }

  nextPeriod() {
    if (this.currentView === 'Month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.currentView === 'Week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.selectedDate.setDate(this.selectedDate.getDate() + 1);
    }
    this.updateCalendar();
  }

  goToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.updateCalendar();
  }

  toggleDashboard() {
    this.showDashboard = !this.showDashboard;
    if (this.showDashboard) {
      this.loadAnalytics();
    }
  }

  updateCalendar() {
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayEvents = this.events.filter(e => 
        new Date(e.date).toDateString() === currentDate.toDateString()
      );
      
      this.calendarDays.push({
        date: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === this.currentDate.getMonth(),
        isToday: currentDate.toDateString() === new Date().toDateString(),
        events: dayEvents
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  getWeekDays() {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push({
        name: this.weekdays[i],
        date: day.getDate(),
        fullDate: day.toISOString().split('T')[0]
      });
    }
    return days;
  }

  getHourEvents(date: string, hour: number) {
    return this.events.filter(e => {
      if (e.date === date && e.startTime) {
        const eventHour = parseInt(e.startTime.split(':')[0]);
        return eventHour === hour;
      }
      return false;
    });
  }

  getBarHeight(count: number): number {
    const maxCount = Math.max(...this.analytics.categories.map((c: any) => c.count));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  loadEvents() {
    this.http.get<any[]>('http://localhost:5000/api/events').subscribe({
      next: (events) => {
        this.events = events;
        this.updateCalendar();
      },
      error: () => console.log('Database not connected')
    });
  }

  loadAnalytics() {
    this.http.get<any>('http://localhost:5000/api/analytics').subscribe({
      next: (data) => {
        this.analytics = data;
      },
      error: () => console.log('Analytics not available')
    });
  }

  editEvent(event: any) {
    this.editingEvent = { ...event };
  }

  closeEditModal() {
    this.editingEvent = null;
  }

  saveEvent() {
    if (this.editingEvent) {
      this.http.put(`http://localhost:5000/api/events/${this.editingEvent.id}`, this.editingEvent).subscribe({
        next: () => {
          this.loadEvents();
          this.loadAnalytics();
          this.closeEditModal();
        },
        error: () => console.log('Error updating event')
      });
    }
  }

  deleteEvent() {
    if (this.editingEvent && confirm('Delete this event?')) {
      this.http.delete(`http://localhost:5000/api/events/${this.editingEvent.id}`).subscribe({
        next: () => {
          this.loadEvents();
          this.loadAnalytics();
          this.closeEditModal();
        },
        error: () => console.log('Error deleting event')
      });
    }
  }

  initVoice() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      
      this.recognition.onstart = () => {
        this.isListening = true;
        this.isProcessing = false;
      };
      
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.lastCommand = transcript;
        this.isListening = false;
        this.isProcessing = true;
        this.recognition.stop();
        this.processVoiceCommand(transcript);
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
      };
      
      this.recognition.onerror = () => {
        this.isListening = false;
        this.isProcessing = false;
      };
    }
  }

  toggleVoice() {
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.isListening = true;
      this.voiceResult = null;
      this.recognition.start();
    }
  }

  processVoiceCommand(transcript: string) {
    this.http.post('http://localhost:5000/api/ai/process-voice', { transcript }).subscribe({
      next: (result: any) => {
        this.voiceResult = result;
        this.isProcessing = false;
      },
      error: () => {
        this.isProcessing = false;
      }
    });
  }

  onTranscriptEdit() {
    this.voiceResult = null;
  }

  reprocessCommand() {
    if (this.lastCommand.trim()) {
      this.isProcessing = true;
      this.processVoiceCommand(this.lastCommand);
    }
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.6) return 'confidence-medium';
    return 'confidence-low';
  }

  confirmEvent() {
    if (this.voiceResult?.event) {
      const eventData = {
        title: this.voiceResult.event.title,
        date: this.voiceResult.event.date,
        startTime: this.voiceResult.event.time,
        endTime: this.voiceResult.event.endTime,
        category: this.voiceResult.event.category,
        priority: this.voiceResult.event.priority
      };

      this.http.post('http://localhost:5000/api/events', eventData).subscribe({
        next: () => {
          this.loadEvents();
          this.loadAnalytics();
          this.cancelVoice();
          alert('Event created successfully!');
        },
        error: () => console.log('Error creating event')
      });
    }
  }

  retryVoice() {
    this.voiceResult = null;
    this.lastCommand = '';
    this.toggleVoice();
  }

  cancelVoice() {
    this.voiceResult = null;
    this.lastCommand = '';
    this.isProcessing = false;
  }
}