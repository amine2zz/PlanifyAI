// src/app/components/chatbot/chatbot.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatbotService, AIReply, AIItem } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="chatbot">
    <div class="header">Planify — Assistant</div>

    <div class="messages" *ngIf="messages.length">
      <div *ngFor="let m of messages" class="msg" [class.user]="m.from === 'user'">
        <div class="who">{{ m.from === 'user' ? 'Vous' : 'Planify' }}</div>
        <div class="body">{{ m.text }}</div>
        <div *ngIf="m.items?.length" class="items">
          <div *ngFor="let it of m.items" class="item">
            <strong>{{ it.type }}</strong>
            <span *ngIf="it.day"> — {{ it.day }}</span>
            <span *ngIf="it.start"> {{ it.start }} </span>
            <span *ngIf="it.end"> à {{ it.end }}</span>
            <span *ngIf="it.text"> • {{ it.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <form [formGroup]="form" (ngSubmit)="send()" class="composer">
      <input formControlName="question" placeholder="Posez une question (ex: Quelles tâches pour lundi ?)" />
      <button type="submit" [disabled]="form.invalid || loading">{{ loading ? 'En cours...' : 'Envoyer' }}</button>
    </form>

    <div *ngIf="error" class="error">{{ error }}</div>
  </div>
  `,
  styles: [`
    .chatbot{ max-width:720px; margin:12px auto; font-family:Inter, Roboto, Arial; }
    .header{ font-weight:700; margin-bottom:8px }
    .messages{ max-height:340px; overflow:auto; margin-bottom:8px }
    .msg{ margin:10px 0; }
    .msg.user{ text-align:right }
    .who{ font-size:11px; opacity:0.7; }
    .body{ display:inline-block; margin-top:4px; padding:10px; border-radius:8px; background:#f3f4f6 }
    .msg.user .body{ background:#dbeafe }
    .items{ margin-top:6px; font-size:13px }
    .composer{ display:flex; gap:8px }
    .composer input{ flex:1; padding:8px; border-radius:6px; border:1px solid #ddd }
    .composer button{ padding:8px 12px; border-radius:6px; }
    .error{ color:#8b0000; margin-top:8px }
  `]
})
export class ChatbotComponent implements OnInit {
  @Input() tasks: any[] = []; // optional; backend will fetch events anyway
  @Input() slots: any[] = [];

  form = this.fb.group({ question: ['', [Validators.required, Validators.minLength(1)]] });
  messages: { from: 'user'|'bot', text: string, items?: AIItem[] }[] = [];
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private svc: ChatbotService) {}

  ngOnInit(): void {
    this.messages.push({ from: 'bot', text: 'Bonjour — je peux répondre aux questions sur ton planning. Ex: "Quelles tâches pour lundi ?"' });
  }

  public send(): void {
    if (this.form.invalid) return;
    this.error = '';
    const question = (this.form.value.question || '').trim();
    if (!question) return;

    this.messages.push({ from: 'user', text: question });
    this.loading = true;

    // ask the backend. We allow passing tasks/slots but backend reads DB if omitted.
    this.svc.ask(question, this.tasks, this.slots).subscribe({
      next: (r: AIReply) => {
        const summary = r?.summary || 'Aucune réponse fournie.';
        const items = r?.items || [];
        this.messages.push({ from: 'bot', text: summary, items });
        this.form.reset();
        this.loading = false;
        setTimeout(() => this.scrollBottom(), 50);
      },
      error: (err) => {
        console.error('chat error', err);
        this.error = this.formatErr(err);
        this.messages.push({ from: 'bot', text: 'Désolé, une erreur est survenue.' });
        this.loading = false;
      }
    });
  }

  private formatErr(e: any): string {
    if (!e) return 'Erreur inconnue';
    if (e.error && e.error.error) return e.error.error;
    if (e.message) return e.message;
    return JSON.stringify(e);
  }

  private scrollBottom(): void {
    try {
      const el = document.querySelector('.messages');
      if (!el) return;
      (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
    } catch(e) { console.warn(e); }
  }
}
