import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Suggestion {
  start: string;  // "YYYY-MM-DDTHH:MM"
  end: string;    // "YYYY-MM-DDTHH:MM"
  reason: string; // short explanation
}
@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule],
template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal-content">
        <h3>Suggested Time Slots</h3>
        <div *ngIf="suggestions?.length; else noSuggestions">
          <div *ngFor="let s of suggestions" class="suggestion-item">
            <p><strong>{{s.start}} - {{s.end}}</strong></p>
            <p>{{s.reason}}</p>
            <button (click)="selectSuggestion(s)">Use This Slot</button>
          </div>
        </div>
        <ng-template #noSuggestions>
          <p>No suggestions available.</p>
        </ng-template>
        <button class="close-btn" (click)="close()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; }
    .modal-content { background:white; padding:2rem; border-radius:10px; width:400px; max-width:90%; }
    .suggestion-item { border:1px solid #ccc; padding:0.5rem; margin-bottom:0.5rem; border-radius:6px; }
    .close-btn { margin-top:1rem; padding:0.5rem 1rem; }
  `]
})
export class SuggestionsComponent {
  @Input() visible: boolean = false;
  @Input() suggestions: Suggestion[] = [];
  @Output() suggestionSelected = new EventEmitter<Suggestion>();
  @Output() closed = new EventEmitter<void>();

  selectSuggestion(suggestion: Suggestion) {
    this.suggestionSelected.emit(suggestion);
  }

  close() {
    this.closed.emit();
  }
}
