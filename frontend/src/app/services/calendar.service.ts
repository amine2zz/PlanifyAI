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
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface AISuggestion {
  id: string;
  type: 'schedule' | 'optimize' | 'reminder' | 'pattern';
  title: string;
  description: string;
  suggestedAction: any;
  confidence: number;
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

  getEventsByDate(date: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/date/${date}`);
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
  getAISuggestions(): Observable<AISuggestion[]> {
    return this.http.get<AISuggestion[]>(`${this.apiUrl}/ai/suggestions`);
  }

  getOptimalSchedule(preferences: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai/optimize-schedule`, preferences);
  }

  analyzeProductivityPatterns(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ai/productivity-analysis`);
  }

  getSmartReminders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ai/smart-reminders`);
  }

  // Calendar Intelligence
  findOptimalMeetingTime(participants: string[], duration: number, preferences: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai/find-meeting-time`, {
      participants,
      duration,
      preferences
    });
  }

  predictEventDuration(eventType: string, description: string): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/ai/predict-duration`, {
      eventType,
      description
    });
  }

  getConflictResolutions(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ai/conflict-resolutions/${eventId}`);
  }

  // Time Management
  getTimeBlocks(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/time-blocks/${date}`);
  }

  createTimeBlock(timeBlock: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/time-blocks`, timeBlock);
  }

  // Analytics
  getProductivityMetrics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/productivity`, {
      params: { startDate, endDate }
    });
  }

  getCalendarInsights(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/insights`);
  }

  // AI Voice Processing
  processVoiceCommand(transcript: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai/process-voice`, { transcript });
  }

  // Advanced AI Features
  getChatResponse(message: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai/chat`, { message });
  }

  getPersonalizedInsights(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ai/personalized-insights`);
  }

  // Utility Methods
  private loadEvents() {
    this.getEvents().subscribe({
      next: (events) => {
        console.log('Calendar service loaded events:', events);
        this.eventsSubject.next(events);
      },
      error: (error) => {
        console.log('Backend not available, using local events:', error);
      }
    });
  }

  refreshEvents() {
    this.loadEvents();
  }

  // Local Storage for offline functionality
  saveToLocalStorage(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getFromLocalStorage(key: string): any {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // Date Utilities
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateTime(date: Date): string {
    return date.toISOString();
  }

  parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSameWeek(date1: Date, date2: Date): boolean {
    const startOfWeek1 = new Date(date1);
    startOfWeek1.setDate(date1.getDate() - date1.getDay());
    
    const startOfWeek2 = new Date(date2);
    startOfWeek2.setDate(date2.getDate() - date2.getDay());
    
    return startOfWeek1.toDateString() === startOfWeek2.toDateString();
  }

  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}