import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app">
      <header>
        <h1>🗓️ PlanifyAI</h1>
        <p>Smart Calendar with Voice Commands</p>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app { min-height: 100vh; background: #f5f5f5; }
    header { background: #667eea; color: white; padding: 2rem; text-align: center; }
    header h1 { margin: 0; font-size: 2.5rem; }
    header p { margin: 0.5rem 0 0 0; opacity: 0.9; }
    main { padding: 2rem; }
  `]
})
export class AppComponent {}
