import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <header>
        <h1>🗓️ PlanifyAI</h1>
        <p>Smart Calendar with Voice Commands</p>
        <nav>
          <a routerLink="/calendar" routerLinkActive="active">📅 Calendar</a>
          <a routerLink="/suggestions" routerLinkActive="active">🤖 AI Suggestions</a>
        </nav>
      </header>
      <main>
        <div class="color-legend">
          <h4>📊 Category Colors:</h4>
          <div class="legend-items">
            <span class="legend-item"><div class="color-box category-work"></div>Work</span>
            <span class="legend-item"><div class="color-box category-meeting"></div>Meeting</span>
            <span class="legend-item"><div class="color-box category-personal"></div>Personal</span>
            <span class="legend-item"><div class="color-box category-health"></div>Health</span>
            <span class="legend-item"><div class="color-box category-education"></div>Education</span>
            <span class="legend-item"><div class="color-box category-general"></div>General</span>
          </div>
        </div>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app { min-height: 100vh; background: #f5f5f5; }
    header { background: #667eea; color: white; padding: 2rem; text-align: center; }
    header h1 { margin: 0; font-size: 2.5rem; }
    header p { margin: 0.5rem 0 1rem 0; opacity: 0.9; }
    nav { display: flex; justify-content: center; gap: 2rem; }
    nav a { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 20px; transition: background 0.2s; }
    nav a:hover, nav a.active { background: rgba(255,255,255,0.2); }
    main { padding: 2rem; min-height: calc(100vh - 200px); }
    .color-legend { background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .color-legend h4 { margin: 0 0 0.5rem 0; color: #333; }
    .legend-items { display: flex; gap: 1rem; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
    .color-box { width: 16px; height: 16px; border-radius: 3px; }
    .category-work { background: #28a745; }
    .category-meeting { background: #007bff; }
    .category-personal { background: #17a2b8; }
    .category-health { background: #dc3545; }
    .category-education { background: #6f42c1; }
    .category-general { background: #6c757d; }
  `]
})
export class AppComponent {
  title = 'PlanifyAI';
}