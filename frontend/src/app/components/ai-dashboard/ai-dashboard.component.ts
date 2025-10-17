import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../services/calendar.service';

@Component({
  selector: 'app-ai-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-dashboard">
      <div class="dashboard-header">
        <h2>🧠 AI Intelligence Center</h2>
        <p>Your personal AI assistant for smart scheduling and productivity</p>
      </div>

      <div class="ai-cards">
        <!-- Smart Suggestions Card -->
        <div class="ai-card suggestions-card">
          <div class="card-header">
            <h3>💡 Smart Suggestions</h3>
            <span class="ai-badge">{{suggestions.length}} Active</span>
          </div>
          <div class="suggestions-list">
            <div class="suggestion" *ngFor="let suggestion of suggestions" 
                 [class]="'priority-' + suggestion.priority">
              <div class="suggestion-icon">{{suggestion.icon}}</div>
              <div class="suggestion-content">
                <h4>{{suggestion.title}}</h4>
                <p>{{suggestion.description}}</p>
                <div class="suggestion-actions">
                  <button class="apply-btn" (click)="applySuggestion(suggestion)">Apply</button>
                  <button class="dismiss-btn" (click)="dismissSuggestion(suggestion)">Dismiss</button>
                </div>
              </div>
              <div class="confidence-score">
                <span>{{suggestion.confidence}}% confident</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Productivity Insights Card -->
        <div class="ai-card insights-card">
          <div class="card-header">
            <h3>📊 Productivity Insights</h3>
            <span class="refresh-btn" (click)="refreshInsights()">🔄</span>
          </div>
          <div class="insights-content">
            <div class="insight-metric">
              <div class="metric-value">{{productivityScore}}%</div>
              <div class="metric-label">Productivity Score</div>
              <div class="metric-trend" [class]="productivityTrend">
                {{productivityTrend === 'up' ? '📈' : productivityTrend === 'down' ? '📉' : '➡️'}}
              </div>
            </div>
            <div class="insight-details">
              <div class="detail-item">
                <span class="label">Peak Hours:</span>
                <span class="value">{{peakHours}}</span>
              </div>
              <div class="detail-item">
                <span class="label">Focus Time:</span>
                <span class="value">{{focusTime}} hrs/day</span>
              </div>
              <div class="detail-item">
                <span class="label">Meeting Efficiency:</span>
                <span class="value">{{meetingEfficiency}}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Predictions Card -->
        <div class="ai-card predictions-card">
          <div class="card-header">
            <h3>🔮 AI Predictions</h3>
            <span class="ai-badge">Next 7 Days</span>
          </div>
          <div class="predictions-list">
            <div class="prediction" *ngFor="let prediction of predictions">
              <div class="prediction-date">{{prediction.date}}</div>
              <div class="prediction-content">
                <h4>{{prediction.title}}</h4>
                <p>{{prediction.description}}</p>
                <div class="prediction-confidence">
                  <div class="confidence-bar">
                    <div class="confidence-fill" [style.width.%]="prediction.confidence"></div>
                  </div>
                  <span>{{prediction.confidence}}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Smart Scheduling Card -->
        <div class="ai-card scheduling-card">
          <div class="card-header">
            <h3>🎯 Smart Scheduling</h3>
            <button class="optimize-btn" (click)="optimizeSchedule()">Optimize Now</button>
          </div>
          <div class="scheduling-content">
            <div class="optimization-result" *ngIf="optimizationResult">
              <h4>Optimization Complete!</h4>
              <div class="optimization-stats">
                <div class="stat">
                  <span class="stat-value">+{{optimizationResult.focusTimeGain}}h</span>
                  <span class="stat-label">Focus Time Gained</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{optimizationResult.meetingsReduced}}</span>
                  <span class="stat-label">Meetings Optimized</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{optimizationResult.efficiencyGain}}%</span>
                  <span class="stat-label">Efficiency Boost</span>
                </div>
              </div>
            </div>
            <div class="quick-actions">
              <button class="action-btn" (click)="findMeetingTime()">
                🤝 Find Meeting Time
              </button>
              <button class="action-btn" (click)="blockFocusTime()">
                🎯 Block Focus Time
              </button>
              <button class="action-btn" (click)="scheduleBreaks()">
                ☕ Schedule Breaks
              </button>
            </div>
          </div>
        </div>

        <!-- Pattern Recognition Card -->
        <div class="ai-card patterns-card">
          <div class="card-header">
            <h3>🔍 Pattern Recognition</h3>
            <span class="learning-indicator">🧠 Learning...</span>
          </div>
          <div class="patterns-content">
            <div class="pattern" *ngFor="let pattern of recognizedPatterns">
              <div class="pattern-icon">{{pattern.icon}}</div>
              <div class="pattern-info">
                <h4>{{pattern.title}}</h4>
                <p>{{pattern.description}}</p>
                <div class="pattern-frequency">
                  Occurs {{pattern.frequency}}
                </div>
              </div>
              <div class="pattern-action">
                <button class="automate-btn" (click)="automatePattern(pattern)">
                  Automate
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Chat Assistant -->
        <div class="ai-card chat-card">
          <div class="card-header">
            <h3>💬 AI Chat Assistant</h3>
            <span class="online-indicator">🟢 Online</span>
          </div>
          <div class="chat-content">
            <div class="chat-messages">
              <div class="message ai-message" *ngFor="let message of chatMessages">
                <div class="message-avatar">🤖</div>
                <div class="message-content">{{message.content}}</div>
                <div class="message-time">{{message.time}}</div>
              </div>
            </div>
            <div class="chat-input">
              <input type="text" 
                     placeholder="Ask me anything about your schedule..."
                     [(ngModel)]="chatInput"
                     (keyup.enter)="sendChatMessage()"
                     #chatInputRef>
              <button (click)="sendChatMessage()">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-dashboard {
      padding: 2rem;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .dashboard-header h2 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .ai-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
    }

    .ai-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .ai-card:hover {
      transform: translateY(-4px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f1f3f4;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.3rem;
    }

    .ai-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .suggestion {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      border-left: 4px solid #667eea;
    }

    .suggestion.priority-high {
      border-left-color: #ff4757;
      background: #fff5f5;
    }

    .suggestion.priority-medium {
      border-left-color: #ffa502;
      background: #fffbf0;
    }

    .suggestion.priority-low {
      border-left-color: #2ed573;
      background: #f0fff4;
    }

    .suggestion-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .suggestion-content {
      flex: 1;
    }

    .suggestion-content h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }

    .suggestion-content p {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .suggestion-actions {
      display: flex;
      gap: 0.5rem;
    }

    .apply-btn, .dismiss-btn {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .apply-btn {
      background: #2ed573;
      color: white;
    }

    .dismiss-btn {
      background: #ddd;
      color: #666;
    }

    .confidence-score {
      font-size: 0.8rem;
      color: #666;
      text-align: center;
    }

    .insights-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .insight-metric {
      text-align: center;
      position: relative;
    }

    .metric-value {
      font-size: 3rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .metric-label {
      font-size: 1rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .metric-trend {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 1.5rem;
    }

    .insight-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f3f4;
    }

    .prediction {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: #f8f9fa;
      margin-bottom: 1rem;
    }

    .prediction-date {
      font-weight: bold;
      color: #667eea;
      min-width: 80px;
    }

    .prediction-content {
      flex: 1;
    }

    .prediction-content h4 {
      margin: 0 0 0.5rem 0;
    }

    .prediction-content p {
      margin: 0 0 0.75rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .prediction-confidence {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .confidence-bar {
      flex: 1;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #2ed573 0%, #667eea 100%);
      transition: width 0.3s ease;
    }

    .optimization-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin: 1rem 0;
    }

    .stat {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: #667eea;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #666;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .action-btn:hover {
      background: #f8f9fa;
      border-color: #667eea;
    }

    .pattern {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: #f8f9fa;
      margin-bottom: 1rem;
    }

    .pattern-icon {
      font-size: 1.5rem;
    }

    .pattern-info {
      flex: 1;
    }

    .pattern-info h4 {
      margin: 0 0 0.25rem 0;
    }

    .pattern-info p {
      margin: 0 0 0.25rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .pattern-frequency {
      font-size: 0.8rem;
      color: #999;
    }

    .automate-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
    }

    .chat-content {
      display: flex;
      flex-direction: column;
      height: 300px;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 0;
    }

    .message {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .message-content {
      flex: 1;
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    .message-time {
      font-size: 0.7rem;
      color: #999;
      align-self: flex-end;
    }

    .chat-input {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f3f4;
    }

    .chat-input input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      outline: none;
    }

    .chat-input button {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .ai-cards {
        grid-template-columns: 1fr;
      }
      
      .optimization-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AiDashboardComponent implements OnInit {
  suggestions: any[] = [];
  productivityScore = 87;
  productivityTrend = 'up';
  peakHours = '9 AM - 11 AM';
  focusTime = 4.2;
  meetingEfficiency = 78;
  predictions: any[] = [];
  optimizationResult: any = null;
  recognizedPatterns: any[] = [];
  chatMessages: any[] = [];
  chatInput = '';

  constructor(private calendarService: CalendarService) {}

  ngOnInit() {
    this.loadAIData();
    this.initializeChat();
  }

  loadAIData() {
    // Load AI suggestions
    this.calendarService.getAISuggestions().subscribe(suggestions => {
      this.suggestions = suggestions.map(s => ({
        ...s,
        icon: this.getIconForSuggestion(s.type),
        priority: s.confidence > 0.8 ? 'high' : s.confidence > 0.6 ? 'medium' : 'low'
      }));
    });

    // Load predictions
    this.predictions = [
      {
        date: 'Tomorrow',
        title: 'High Meeting Load',
        description: 'You have 5 meetings scheduled. Consider blocking focus time.',
        confidence: 85
      },
      {
        date: 'Thursday',
        title: 'Optimal Focus Day',
        description: 'Perfect day for deep work with minimal interruptions.',
        confidence: 92
      },
      {
        date: 'Friday',
        title: 'Energy Dip Expected',
        description: 'Schedule lighter tasks based on your patterns.',
        confidence: 76
      }
    ];

    // Load recognized patterns
    this.recognizedPatterns = [
      {
        icon: '☕',
        title: 'Morning Coffee Break',
        description: 'You take a coffee break every day at 10:30 AM',
        frequency: 'Daily at 10:30 AM'
      },
      {
        icon: '🏃',
        title: 'Lunch Hour Workout',
        description: 'You exercise during lunch on Tuesdays and Thursdays',
        frequency: 'Twice weekly'
      },
      {
        icon: '📞',
        title: 'Friday Client Calls',
        description: 'Most client calls happen on Friday afternoons',
        frequency: 'Weekly pattern'
      }
    ];
  }

  initializeChat() {
    this.chatMessages = [
      {
        content: 'Hello! I\'m your AI assistant. I can help you optimize your schedule, find meeting times, and answer questions about your calendar.',
        time: new Date().toLocaleTimeString()
      }
    ];
  }

  getIconForSuggestion(type: string): string {
    const icons: {[key: string]: string} = {
      'schedule': '📅',
      'optimize': '⚡',
      'reminder': '🔔',
      'pattern': '🔍',
      'focus': '🎯',
      'break': '☕',
      'meeting': '🤝'
    };
    return icons[type] || '💡';
  }

  applySuggestion(suggestion: any) {
    console.log('Applying suggestion:', suggestion);
    // Implement suggestion application logic
  }

  dismissSuggestion(suggestion: any) {
    this.suggestions = this.suggestions.filter(s => s.id !== suggestion.id);
  }

  refreshInsights() {
    // Refresh productivity insights
    this.calendarService.analyzeProductivityPatterns().subscribe(analysis => {
      // Update insights
    });
  }

  optimizeSchedule() {
    this.calendarService.getOptimalSchedule({}).subscribe(result => {
      this.optimizationResult = {
        focusTimeGain: 2.5,
        meetingsReduced: 3,
        efficiencyGain: 15
      };
    });
  }

  findMeetingTime() {
    // Open meeting time finder
    console.log('Finding optimal meeting time...');
  }

  blockFocusTime() {
    // Create focus time blocks
    console.log('Blocking focus time...');
  }

  scheduleBreaks() {
    // Schedule automatic breaks
    console.log('Scheduling breaks...');
  }

  automatePattern(pattern: any) {
    console.log('Automating pattern:', pattern);
    // Implement pattern automation
  }

  sendChatMessage() {
    if (this.chatInput.trim()) {
      // Add user message
      this.chatMessages.push({
        content: this.chatInput,
        time: new Date().toLocaleTimeString(),
        isUser: true
      });

      // Process with AI and add response
      this.processAIChat(this.chatInput);
      this.chatInput = '';
    }
  }

  processAIChat(message: string) {
    // Simulate AI response
    setTimeout(() => {
      let response = 'I understand you want to know about ' + message.toLowerCase() + '. Let me help you with that.';
      
      if (message.toLowerCase().includes('meeting')) {
        response = 'I can help you find the best time for meetings. Would you like me to analyze your calendar for optimal slots?';
      } else if (message.toLowerCase().includes('focus')) {
        response = 'Based on your patterns, your best focus time is between 9-11 AM. Shall I block some focus time for you?';
      } else if (message.toLowerCase().includes('productivity')) {
        response = `Your current productivity score is ${this.productivityScore}%. You're doing great! Your peak hours are ${this.peakHours}.`;
      }

      this.chatMessages.push({
        content: response,
        time: new Date().toLocaleTimeString(),
        isUser: false
      });
    }, 1000);
  }
}