import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CalendarComponent } from './components/calendar/calendar.component';
import { VoiceAssistantComponent } from './components/voice-assistant/voice-assistant.component';
import { AiDashboardComponent } from './components/ai-dashboard/ai-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CalendarComponent, VoiceAssistantComponent, AiDashboardComponent],
  template: `
    <div class="app-container">
      <header class="header">
        <h1>PlanifyAI</h1>
        <p>Smart Calendar & Planning Assistant</p>
        <nav class="nav-tabs">
          <button [class.active]="activeTab === 'calendar'" (click)="setActiveTab('calendar')">📅 Calendar</button>
          <button [class.active]="activeTab === 'voice'" (click)="setActiveTab('voice')">🎤 Voice Assistant</button>
          <button [class.active]="activeTab === 'ai'" (click)="setActiveTab('ai')">🧠 AI Dashboard</button>
        </nav>
      </header>
      <main class="main-content">
        <app-calendar *ngIf="activeTab === 'calendar'"></app-calendar>
        <app-voice-assistant *ngIf="activeTab === 'voice'"></app-voice-assistant>
        <app-ai-dashboard *ngIf="activeTab === 'ai'"></app-ai-dashboard>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .header {
      text-align: center;
      padding: 2rem;
      color: white;
    }
    .header h1 {
      font-size: 3rem;
      margin: 0;
      font-weight: 300;
    }
    .header p {
      font-size: 1.2rem;
      margin: 0.5rem 0 0 0;
      opacity: 0.9;
    }
    .main-content {
      padding: 0 2rem 2rem 2rem;
    }
    .nav-tabs {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .nav-tabs button {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }
    .nav-tabs button:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-2px);
    }
    .nav-tabs button.active {
      background: white;
      color: #667eea;
      font-weight: 600;
    }
  `]
})
export class AppComponent {
  title = 'PlanifyAI';
  activeTab = 'calendar';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}