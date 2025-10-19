import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Event {
  id?: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = 'http://localhost:5000/api';
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadEvents();
  }

  // Event Management
  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events`);
  }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/events`, event);
  }

  updateEvent(id: number, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/events/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events/${id}`);
  }

  // AI Features
  getAISuggestions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ai/suggestions`);
  }

  applySuggestion(suggestion: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai/apply-suggestion`, { suggestion });
  }

  // Analytics
  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`);
  }

  // Voice Processing
  processVoiceCommand(transcript: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai/process-voice`, { transcript });
  }

  // Utility Methods
  private loadEvents() {
    this.getEvents().subscribe({
      next: (events) => this.eventsSubject.next(events),
      error: () => console.log('Backend not available')
    });
  }

  refreshEvents() {
    this.loadEvents();
  }
}