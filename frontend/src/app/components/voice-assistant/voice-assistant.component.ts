import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../services/calendar.service';

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voice-assistant">
      <div class="voice-header">
        <h3>🎤 AI Voice Assistant</h3>
        <p>Say something like: "Schedule meeting with John tomorrow at 2 PM"</p>
      </div>
      
      <div class="voice-controls">
        <button 
          class="voice-btn"
          [class.listening]="isListening"
          [class.processing]="isProcessing"
          (click)="toggleListening()"
          [disabled]="isProcessing">
          <span class="mic-icon">🎤</span>
          <span class="status-text">
            {{isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Click to Speak'}}
          </span>
        </button>
      </div>

      <div class="voice-feedback" *ngIf="transcript">
        <div class="transcript">
          <strong>You said:</strong> "{{transcript}}"
        </div>
        <div class="ai-interpretation" *ngIf="aiInterpretation">
          <strong>AI understood:</strong>
          <div class="interpretation-details">
            <p><strong>Event:</strong> {{aiInterpretation.title}}</p>
            <p><strong>Date:</strong> {{aiInterpretation.date}}</p>
            <p><strong>Time:</strong> {{aiInterpretation.time}}</p>
            <p><strong>Duration:</strong> {{aiInterpretation.duration}} minutes</p>
          </div>
          <div class="action-buttons">
            <button class="confirm-btn" (click)="confirmEvent()">✅ Add to Calendar</button>
            <button class="edit-btn" (click)="editEvent()">✏️ Edit Details</button>
            <button class="cancel-btn" (click)="cancelEvent()">❌ Cancel</button>
          </div>
        </div>
      </div>

      <div class="voice-examples">
        <h4>Try saying:</h4>
        <div class="examples">
          <div class="example" (click)="useExample(example)" *ngFor="let example of voiceExamples">
            "{{example}}"
          </div>
        </div>
      </div>

      <div class="recent-voice-events" *ngIf="recentVoiceEvents.length > 0">
        <h4>Recent Voice-Created Events:</h4>
        <div class="recent-event" *ngFor="let event of recentVoiceEvents">
          <span class="event-title">{{event.title}}</span>
          <span class="event-date">{{event.date}} at {{event.time}}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .voice-assistant {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 2rem;
      color: white;
      margin: 1rem 0;
    }

    .voice-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .voice-header h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }

    .voice-controls {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .voice-btn {
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50px;
      padding: 1rem 2rem;
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .voice-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-2px);
    }

    .voice-btn.listening {
      background: #ff4757;
      border-color: #ff4757;
      animation: pulse 1.5s infinite;
    }

    .voice-btn.processing {
      background: #ffa502;
      border-color: #ffa502;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .mic-icon {
      font-size: 1.2rem;
    }

    .voice-feedback {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .transcript {
      margin-bottom: 1rem;
      font-style: italic;
    }

    .ai-interpretation {
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 1rem;
    }

    .interpretation-details {
      margin: 1rem 0;
    }

    .interpretation-details p {
      margin: 0.5rem 0;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .action-buttons button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .confirm-btn {
      background: #2ed573;
      color: white;
    }

    .edit-btn {
      background: #ffa502;
      color: white;
    }

    .cancel-btn {
      background: #ff4757;
      color: white;
    }

    .voice-examples {
      margin-bottom: 2rem;
    }

    .voice-examples h4 {
      margin-bottom: 1rem;
    }

    .examples {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 0.5rem;
    }

    .example {
      background: rgba(255,255,255,0.1);
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      font-style: italic;
    }

    .example:hover {
      background: rgba(255,255,255,0.2);
    }

    .recent-voice-events {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1rem;
    }

    .recent-event {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .recent-event:last-child {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .voice-assistant {
        padding: 1rem;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .examples {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VoiceAssistantComponent implements OnInit, OnDestroy {
  isListening = false;
  isProcessing = false;
  transcript = '';
  aiInterpretation: any = null;
  recentVoiceEvents: any[] = [];
  
  private recognition: any;
  private speechSynthesis: any;

  voiceExamples = [
    "Schedule meeting with team tomorrow at 10 AM",
    "Add lunch with Sarah on Friday at 1 PM",
    "Block 2 hours for project work next Monday morning",
    "Remind me to call client at 3 PM today",
    "Schedule doctor appointment next week",
    "Add gym session every Tuesday at 6 PM"
  ];

  constructor(private calendarService: CalendarService) {}

  ngOnInit() {
    this.initializeSpeechRecognition();
    this.loadRecentVoiceEvents();
  }

  ngOnDestroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.transcript = transcript;
        this.isListening = false;
        this.isProcessing = true;
        this.processVoiceInput(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        this.isProcessing = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.startListening();
    }
  }

  startListening() {
    if (this.recognition) {
      this.transcript = '';
      this.aiInterpretation = null;
      this.recognition.start();
    } else {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }
  }

  processVoiceInput(transcript: string) {
    // Send to AI backend for processing
    this.calendarService.processVoiceCommand(transcript).subscribe({
      next: (interpretation) => {
        this.aiInterpretation = interpretation;
        this.isProcessing = false;
        this.speakResponse(`I understood: ${interpretation.title} on ${interpretation.date} at ${interpretation.time}`);
      },
      error: (error) => {
        console.error('Voice processing error:', error);
        this.isProcessing = false;
        this.speakResponse("Sorry, I couldn't understand that. Please try again.");
      }
    });
  }

  speakResponse(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }

  confirmEvent() {
    if (this.aiInterpretation) {
      const event = {
        title: this.aiInterpretation.title,
        date: this.aiInterpretation.date,
        startTime: this.aiInterpretation.time,
        endTime: this.calculateEndTime(this.aiInterpretation.time, this.aiInterpretation.duration),
        category: this.aiInterpretation.category || 'general',
        priority: this.aiInterpretation.priority || 'medium',
        description: `Created via voice command: "${this.transcript}"`
      };

      this.calendarService.createEvent(event).subscribe({
        next: (createdEvent) => {
          this.recentVoiceEvents.unshift(event);
          this.saveRecentVoiceEvents();
          this.speakResponse("Event added to your calendar successfully!");
          this.clearVoiceInput();
        },
        error: (error) => {
          console.error('Error creating event:', error);
          this.speakResponse("Sorry, there was an error adding the event.");
        }
      });
    }
  }

  editEvent() {
    // Open edit modal or navigate to edit page
    this.speakResponse("Opening event editor");
  }

  cancelEvent() {
    this.clearVoiceInput();
    this.speakResponse("Event cancelled");
  }

  useExample(example: string) {
    this.transcript = example;
    this.isProcessing = true;
    this.processVoiceInput(example);
  }

  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + duration);
    
    return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
  }

  private clearVoiceInput() {
    this.transcript = '';
    this.aiInterpretation = null;
  }

  private loadRecentVoiceEvents() {
    const saved = localStorage.getItem('recentVoiceEvents');
    if (saved) {
      this.recentVoiceEvents = JSON.parse(saved);
    }
  }

  private saveRecentVoiceEvents() {
    localStorage.setItem('recentVoiceEvents', JSON.stringify(this.recentVoiceEvents.slice(0, 5)));
  }
}