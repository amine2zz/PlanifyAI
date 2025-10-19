import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../services/calendar.service';
import { ChatbotComponent } from '../chatbot/chatbot.component';

interface Suggestion {
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
  impact: string;
  event_id?: number;
  event_ids?: number[];
  suggested_changes?: any;
  editable?: boolean;
  editing?: boolean;
  originalAction?: string;
  originalImpact?: string;
  originalRecurringEvents?: any[];
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
  totalEvents: number;
  analysisDate: string;
}

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatbotComponent],
  template: `
    <div class="suggestions-container">
      <header class="suggestions-header">
        <h1>🤖 AI Calendar Optimization</h1>
        <p>Smart suggestions to optimize your schedule and boost productivity</p>
        <div class="stats">
          <span class="stat">📅 {{totalEvents}} Events Analyzed</span>
          <span class="stat">🔄 Updated {{getTimeAgo(analysisDate)}}</span>
        </div>
      </header>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Analyzing your calendar patterns...</p>
      </div>

      <div class="suggestions-grid" *ngIf="!loading && suggestions.length > 0">
        <div 
          class="suggestion-card" 
          *ngFor="let suggestion of suggestions; trackBy: trackBySuggestion"
          [class]="'priority-' + suggestion.priority"
        >
          <div class="suggestion-header">
            <div class="suggestion-icon">{{getIcon(suggestion.type)}}</div>
            <div class="suggestion-priority">{{suggestion.priority.toUpperCase()}}</div>
          </div>
          
          <h3>{{suggestion.title}}</h3>
          <p class="description">{{suggestion.description}}</p>
          
          <div class="action-section">
            <h4>💡 Recommended Action:</h4>
            <p>{{suggestion.action}}</p>
          </div>
          
          <div class="impact-section">
            <h4>📈 Expected Impact:</h4>
            <p>{{suggestion.impact}}</p>
          </div>
          
          <div class="suggestion-actions">
            <button class="apply-btn" (click)="showApplyModal(suggestion)" [disabled]="applying">
              {{applying ? 'Applying...' : 'Apply Suggestion'}}
            </button>
          </div>
        </div>
      </div>

      <div class="no-suggestions" *ngIf="!loading && suggestions.length === 0">
        <div class="empty-state">
          <h2>🎉 Your Calendar Looks Great!</h2>
          <p>No optimization suggestions at the moment. Keep up the good work!</p>
          <button class="refresh-btn" (click)="loadSuggestions()">Refresh Analysis</button>
        </div>
      </div>

      <div class="tips-section" *ngIf="!loading">
        <h2>💡 Quick Optimization Tips</h2>
        <div class="tips-grid">
          <div class="tip-card">
            <h3>🕐 Time Blocking</h3>
            <p>Group similar tasks together for better focus and reduced context switching.</p>
          </div>
          <div class="tip-card">
            <h3>⚡ Energy Management</h3>
            <p>Schedule demanding tasks during your peak energy hours (usually mornings).</p>
          </div>
          <div class="tip-card">
            <h3>🔄 Buffer Time</h3>
            <p>Add 15-minute buffers between meetings to prevent rushing and improve quality.</p>
          </div>
          <div class="tip-card">
            <h3>🎯 Priority Focus</h3>
            <p>Limit high-priority tasks to 2-3 per day to maintain quality and reduce stress.</p>
          </div>
        </div>
      </div>

      <!-- Apply Suggestion Modal -->
      <div *ngIf="applyingModal" class="modal-overlay" (click)="closeApplyModal()">
        <div class="modal-content apply-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>📝 Customize Suggestion</h3>
            <button class="close-btn" (click)="closeApplyModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="suggestion-preview">
              <h4>{{currentSuggestion?.title}}</h4>
              <p>{{currentSuggestion?.description}}</p>
            </div>

            <!-- Recurring Events Edit -->
            <div *ngIf="currentSuggestion?.suggested_changes?.recurring_events" class="recurring-events-edit">
              <h4>🔄 Recurring Schedule</h4>
              <div *ngFor="let event of currentSuggestion?.suggested_changes?.recurring_events; let i = index" class="recurring-event-form">
                <div class="form-field">
                  <label>Event Title:</label>
                  <input [(ngModel)]="event.title" class="form-input">
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>Start Time:</label>
                    <input type="time" [(ngModel)]="event.start_time" class="form-input">
                  </div>
                  <div class="form-field">
                    <label>End Time:</label>
                    <input type="time" [(ngModel)]="event.end_time" class="form-input">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>Category:</label>
                    <select [(ngModel)]="event.category" class="form-input">
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
                    <select [(ngModel)]="event.priority" class="form-input">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div class="form-field">
                  <label>Description:</label>
                  <textarea [(ngModel)]="event.description" class="form-input" rows="2"></textarea>
                </div>
                <div class="form-field">
                  <label>Days:</label>
                  <div class="days-selector">
                    <label *ngFor="let day of weekDays" class="day-checkbox">
                      <input type="checkbox" [checked]="event.days.includes(day.value)" (change)="toggleDay(event, day.value)">
                      <span>{{day.label}}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeApplyModal()">Cancel</button>
            <button class="apply-btn" (click)="confirmApplySuggestion()" [disabled]="applying">
              {{applying ? 'Applying...' : 'Apply Changes'}}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Chatbot Component -->
    <app-chatbot></app-chatbot>
  `,
  styles: [`
    .suggestions-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .suggestions-header {
      text-align: center;
      margin-bottom: 30px;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
    }

    .suggestions-header h1 {
      margin: 0 0 10px 0;
      font-size: 2.5em;
      font-weight: 700;
    }

    .suggestions-header p {
      margin: 0 0 20px 0;
      font-size: 1.2em;
      opacity: 0.9;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      flex-wrap: wrap;
    }

    .stat {
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9em;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }

    .suggestion-card {
      background: white;
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border-left: 5px solid #ddd;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .suggestion-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .priority-high {
      border-left-color: #e74c3c;
    }

    .priority-medium {
      border-left-color: #f39c12;
    }

    .priority-low {
      border-left-color: #27ae60;
    }

    .suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .suggestion-icon {
      font-size: 2em;
    }

    .suggestion-priority {
      background: #f8f9fa;
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 0.8em;
      font-weight: 600;
      color: #666;
    }

    .priority-high .suggestion-priority {
      background: #fee;
      color: #e74c3c;
    }

    .priority-medium .suggestion-priority {
      background: #fff8e1;
      color: #f39c12;
    }

    .priority-low .suggestion-priority {
      background: #f0fff4;
      color: #27ae60;
    }

    .suggestion-card h3 {
      margin: 0 0 15px 0;
      color: #2c3e50;
      font-size: 1.3em;
    }

    .description {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .action-section, .impact-section {
      margin: 15px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .action-section h4, .impact-section h4 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 0.9em;
    }

    .action-section p, .impact-section p {
      margin: 0;
      color: #555;
      font-size: 0.9em;
      line-height: 1.5;
    }

    .apply-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      margin-top: 15px;
    }

    .apply-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .apply-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .no-suggestions {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-state h2 {
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 25px;
      font-size: 1.1em;
    }

    .refresh-btn {
      padding: 12px 30px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 25px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .refresh-btn:hover {
      background: #5a6fd8;
    }

    .tips-section {
      margin-top: 50px;
    }

    .tips-section h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 30px;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .tip-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }

    .tip-card h3 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .tip-card p {
      color: #666;
      font-size: 0.9em;
      line-height: 1.5;
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

    .apply-modal {
      max-width: 600px;
      max-height: 90vh;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .suggestion-preview {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .suggestion-preview h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .recurring-event-form {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      background: #f9f9f9;
    }

    .form-field {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .days-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .day-checkbox {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    }

    .day-checkbox input[type="checkbox"]:checked + span {
      font-weight: 600;
      color: #007bff;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .cancel-btn {
      background: #6c757d;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .suggestions-container {
        padding: 15px;
      }
      
      .suggestions-header {
        padding: 20px;
      }
      
      .suggestions-header h1 {
        font-size: 2em;
      }
      
      .stats {
        flex-direction: column;
        gap: 10px;
      }
      
      .suggestions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SuggestionsComponent implements OnInit {
  suggestions: Suggestion[] = [];
  totalEvents = 0;
  analysisDate = '';
  loading = true;
  applying = false;
  applyingModal = false;
  currentSuggestion: Suggestion | null = null;
  weekDays = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
  ];

  constructor(private calendarService: CalendarService) {}

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.loading = true;
    this.calendarService.getAISuggestions().subscribe({
      next: (response: SuggestionsResponse) => {
        this.suggestions = response.suggestions;
        this.totalEvents = response.totalEvents;
        this.analysisDate = response.analysisDate;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading suggestions:', error);
        this.loading = false;
      }
    });
  }

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'load_balancing': '⚖️',
      'meeting_optimization': '🤝',
      'time_optimization': '⏰',
      'meeting_spacing': '📅',
      'meeting_duration': '⏱️',
      'wellness': '🌱',
      'productivity': '🚀',
      'weekly_planning': '📋',
      'weekly_review': '🔍',
      'skill_development': '📚',
      'add_weekly_lunch': '🍽️',
      'add_exercise_routine': '💪',
      'optimize_focus_time': '🎯'
    };
    return icons[type] || '💡';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  trackBySuggestion(index: number, suggestion: Suggestion): string {
    return suggestion.title + suggestion.type;
  }

  showApplyModal(suggestion: Suggestion) {
    this.currentSuggestion = JSON.parse(JSON.stringify(suggestion));
    this.applyingModal = true;
  }

  closeApplyModal() {
    this.applyingModal = false;
    this.currentSuggestion = null;
  }

  toggleDay(event: any, day: string) {
    const index = event.days.indexOf(day);
    if (index > -1) {
      event.days.splice(index, 1);
    } else {
      event.days.push(day);
    }
  }

  confirmApplySuggestion() {
    if (this.currentSuggestion) {
      this.applying = true;
      this.calendarService.applySuggestion(this.currentSuggestion).subscribe({
        next: (response) => {
          this.applying = false;
          
          let message = `✅ Success: ${response.message}`;
          if (response.created_dates) {
            message += `\n\n📅 Created events for: ${response.created_dates.length} dates`;
          }
          if (response.modified_event) {
            message += `\n\n📝 Modified Event ID: ${response.modified_event}`;
          }
          
          alert(message);
          
          this.suggestions = this.suggestions.filter(s => s !== this.findOriginalSuggestion());
          
          this.closeApplyModal();
          setTimeout(() => this.loadSuggestions(), 1000);
        },
        error: (error) => {
          this.applying = false;
          console.error('Error applying suggestion:', error);
          alert(`❌ Error: ${error.error?.error || 'Failed to apply suggestion'}`);
        }
      });
    }
  }

  findOriginalSuggestion(): Suggestion {
    return this.suggestions.find(s => 
      s.title === this.currentSuggestion?.title && 
      s.type === this.currentSuggestion?.type
    ) || this.suggestions[0];
  }
}