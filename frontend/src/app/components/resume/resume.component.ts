import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeService } from '../../services/resume.service';
import { DailySummary, MotivationalQuote } from './resume';
import { ChatbotComponent } from '../chatbot/chatbot.component';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule, ChatbotComponent],
  template: `
    <div class="resume-wrapper">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">📊 Weekly Insights</h1>
          <p class="hero-subtitle">AI-powered analysis of your productivity and schedule</p>
        </div>
        <div class="hero-decoration">
          <div class="floating-icon">🤖</div>
          <div class="floating-icon delay-1">📈</div>
          <div class="floating-icon delay-2">⚡</div>
        </div>
      </div>

      <ng-container *ngIf="!loading && !error; else loadingOrError">
        <div class="content-grid">
          <!-- Weekly Summary Card -->
          <div class="insight-card summary-card">
            <div class="card-header">
              <div class="card-icon">📋</div>
              <h2 class="card-title">Weekly Summary</h2>
            </div>
            <div class="card-content">
              <p class="summary-text">
                {{ weeklySummary?.summary || 'No summary available yet. Add some events to your calendar to get personalized insights!' }}
              </p>
            </div>
            <div class="card-footer">
              <span class="ai-badge">✨ AI Generated</span>
            </div>
          </div>

          <!-- Motivation Card -->
          <div class="insight-card motivation-card">
            <div class="card-header">
              <div class="card-icon">💡</div>
              <h2 class="card-title">Daily Motivation</h2>
            </div>
            <div class="card-content">
              <blockquote class="quote-block">
                <div class="quote-mark">"</div>
                <p class="quote-text">
                  {{ motivationalQuote?.quote || 'Stay consistent, progress is built daily. Every small step counts towards your bigger goals.' }}
                </p>
                <div class="quote-mark closing">"</div>
              </blockquote>
              <div class="quote-context">
                <span class="context-icon">🎯</span>
                {{ motivationalQuote?.context_note || 'Personalized motivation based on your schedule patterns.' }}
              </div>
            </div>
            <div class="card-footer">
              <span class="ai-badge">🧠 Smart Insights</span>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-value">{{ getWeeklyEventCount() }}</div>
              <div class="stat-label">Events This Week</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏰</div>
              <div class="stat-value">{{ getProductivityScore() }}%</div>
              <div class="stat-label">Productivity Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-value">{{ getCompletionRate() }}%</div>
              <div class="stat-label">Goal Progress</div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #loadingOrError>
        <div class="status-container">
          <div *ngIf="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <h3>Analyzing Your Schedule</h3>
            <p>Our AI is processing your calendar data to generate personalized insights...</p>
          </div>
          <div *ngIf="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>{{ error }}</p>
            <button class="retry-btn" (click)="ngOnInit()">Try Again</button>
          </div>
        </div>
      </ng-template>
    </div>

    <!-- Chatbot Component -->
    <app-chatbot></app-chatbot>
  `,
  styles: [`
    .resume-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .hero-section {
      position: relative;
      padding: 60px 20px;
      text-align: center;
      overflow: hidden;
    }

    .hero-content {
      position: relative;
      z-index: 2;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      color: white;
      margin: 0 0 16px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: rgba(255,255,255,0.9);
      margin: 0;
      font-weight: 400;
    }

    .hero-decoration {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .floating-icon {
      position: absolute;
      font-size: 2rem;
      opacity: 0.1;
      animation: float 6s ease-in-out infinite;
    }

    .floating-icon:nth-child(1) { top: 20%; left: 10%; }
    .floating-icon:nth-child(2) { top: 60%; right: 15%; }
    .floating-icon:nth-child(3) { bottom: 20%; left: 20%; }

    .delay-1 { animation-delay: -2s; }
    .delay-2 { animation-delay: -4s; }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    .content-grid {
      max-width: 1200px;
      margin: -40px auto 0;
      padding: 0 20px 60px;
      position: relative;
      z-index: 1;
    }

    .insight-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .insight-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }

    .card-header {
      display: flex;
      align-items: center;
      padding: 30px 30px 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .card-icon {
      font-size: 2.5rem;
      margin-right: 16px;
    }

    .card-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      margin: 0;
    }

    .card-content {
      padding: 30px;
    }

    .summary-text {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #4a5568;
      margin: 0;
    }

    .quote-block {
      position: relative;
      margin: 0;
      padding: 0;
    }

    .quote-mark {
      font-size: 4rem;
      color: #667eea;
      font-weight: 900;
      line-height: 1;
      opacity: 0.3;
    }

    .quote-mark.closing {
      text-align: right;
      margin-top: -20px;
    }

    .quote-text {
      font-size: 1.25rem;
      font-style: italic;
      color: #2d3748;
      line-height: 1.6;
      margin: -30px 0 20px 0;
      padding: 0 20px;
      font-weight: 500;
    }

    .quote-context {
      display: flex;
      align-items: center;
      font-size: 0.95rem;
      color: #718096;
      margin-top: 20px;
      padding: 15px;
      background: #f7fafc;
      border-radius: 10px;
    }

    .context-icon {
      margin-right: 8px;
      font-size: 1.1rem;
    }

    .card-footer {
      padding: 20px 30px;
      background: #f8f9fa;
      border-top: 1px solid #f0f0f0;
    }

    .ai-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .stat-card {
      background: white;
      padding: 30px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
    }

    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 15px;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: #667eea;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #718096;
      font-weight: 500;
    }

    .status-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 40px;
    }

    .loading-state, .error-state {
      text-align: center;
      background: white;
      padding: 60px 40px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      max-width: 500px;
    }

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 30px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-state h3, .error-state h3 {
      font-size: 1.5rem;
      color: #2d3748;
      margin: 0 0 15px 0;
      font-weight: 700;
    }

    .loading-state p, .error-state p {
      color: #718096;
      margin: 0 0 20px 0;
      line-height: 1.6;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .retry-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .retry-btn:hover {
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      
      .content-grid {
        padding: 0 15px 40px;
      }
      
      .card-header, .card-content {
        padding: 20px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ResumeComponent implements OnInit {
  weeklySummary?: DailySummary;
  motivationalQuote?: MotivationalQuote;
  loading = true;
  error?: string;

  constructor(private resumeService: ResumeService) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = undefined;
    
    this.resumeService.getFullResume().subscribe({
      next: (data) => {
        this.weeklySummary = data.summary;
        this.motivationalQuote = data.quote;
        this.loading = false;
      },
      error: (err) => {
        console.error('Resume fetch error:', err);
        this.error = 'Failed to load AI resume insights. Please check your connection and try again.';
        this.loading = false;
      }
    });
  }

  getWeeklyEventCount(): number {
    // Mock data - you can connect this to real analytics
    return Math.floor(Math.random() * 15) + 5;
  }

  getProductivityScore(): number {
    // Mock data - you can connect this to real analytics
    return Math.floor(Math.random() * 30) + 70;
  }

  getCompletionRate(): number {
    // Mock data - you can connect this to real analytics
    return Math.floor(Math.random() * 25) + 75;
  }
}