import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatbotService, AIReply, AIItem } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="chatbot-container">
    <!-- Chat Bubble -->
    <div class="chat-bubble" (click)="toggleChat()" [class.open]="isOpen">
      <span class="bubble-icon">💬</span>
    </div>

    <!-- Chat Window -->
    <div class="chat-window" [class.open]="isOpen">
      <div class="chat-header">
        <span>Planify Assistant</span>
        <button class="close-btn" (click)="toggleChat()">×</button>
      </div>

      <div class="messages">
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
        
        <div *ngIf="messages.length === 1" class="predefined-questions">
          <div class="questions-label">Questions suggérées:</div>
          <button *ngFor="let q of predefinedQuestions" 
                  class="question-btn" 
                  (click)="askPredefinedQuestion(q)">{{ q }}</button>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="send()" class="composer">
        <input formControlName="question" placeholder="Posez une question..." />
        <button type="submit" [disabled]="form.invalid || loading">{{ loading ? '...' : '→' }}</button>
      </form>

      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  </div>
  `,
  styles: [`
    .chatbot-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; font-family: Inter, Roboto, Arial; }
    .chat-bubble { width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease; }
    .chat-bubble:hover { transform: scale(1.1); }
    .chat-bubble.open { transform: scale(0.9); }
    .bubble-icon { font-size: 24px; }
    .chat-window { position: absolute; bottom: 80px; right: 0; width: 350px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); transform: scale(0) translateY(20px); opacity: 0; transition: all 0.3s ease; transform-origin: bottom right; }
    .chat-window.open { transform: scale(1) translateY(0); opacity: 1; }
    .chat-header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
    .close-btn { background: none; border: none; color: white; font-size: 20px; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .messages { height: 350px; overflow-y: auto; padding: 15px 15px 0 15px; }
    .msg { margin: 10px 0; }
    .msg.user { text-align: right; }
    .who { font-size: 11px; opacity: 0.7; margin-bottom: 4px; }
    .body { display: inline-block; padding: 8px 12px; border-radius: 18px; max-width: 80%; word-wrap: break-word; }
    .msg:not(.user) .body { background: #f1f3f4; }
    .msg.user .body { background: #667eea; color: white; }
    .items { margin-top: 6px; font-size: 12px; }
    .composer { display: flex; gap: 8px; padding: 15px; border-top: 1px solid #eee; }
    .composer input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
    .composer button { background: #667eea; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; }
    .composer button:disabled { opacity: 0.5; }
    .error { color: #dc3545; padding: 0 15px; font-size: 12px; }
    .predefined-questions { padding: 10px 15px; border-top: 1px solid #eee; }
    .questions-label { font-size: 11px; color: #666; margin-bottom: 8px; }
    .question-btn { display: block; width: 100%; text-align: left; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 15px; padding: 8px 12px; margin-bottom: 5px; cursor: pointer; font-size: 12px; transition: background 0.2s; }
    .question-btn:hover { background: #e9ecef; }
  `]
})
export class ChatbotComponent implements OnInit {
  @Input() tasks: any[] = []; // optional; backend will fetch events anyway
  @Input() slots: any[] = [];

  form = this.fb.group({ question: ['', [Validators.required, Validators.minLength(1)]] });
  messages: { from: 'user'|'bot', text: string, items?: AIItem[] }[] = [];
  loading = false;
  error = '';
  isOpen = false;
  isListening = false;
  recognition: any;
  predefinedQuestions = [
    'Quelles tâches aujourd\'hui?',
    'Qu\'est-ce que j\'ai demain?',
    'Mes réunions cette semaine?',
    'Tâches prioritaires?',
    'Planning de la semaine?'
  ];

  constructor(private fb: FormBuilder, private svc: ChatbotService) {}

  ngOnInit(): void {
    this.messages.push({ from: 'bot', text: 'Bonjour! Je peux répondre aux questions sur votre planning.' });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  askPredefinedQuestion(question: string): void {
    this.form.patchValue({ question });
    this.send();
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
        this.form.patchValue({ question: '' });
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