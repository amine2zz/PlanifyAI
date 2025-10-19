import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
import { DailyScheduleItem, DailySummary, MotivationalQuote } from '../components/resume/resume';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private dbUrl = 'http://127.0.0.1:5000/api/events';
  private aiUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) {}

  getSchedule(): Observable<DailyScheduleItem[]> {
    return this.http.get<DailyScheduleItem[]>(this.dbUrl);
  }

  generateWeeklySummary(schedule: DailyScheduleItem[]): Observable<DailySummary> {
    const tasks = schedule.map(item => ({
      type: 'task',
      day: new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
      start: item.startTime,
      end: item.endTime,
      text: item.title
    }));
    return this.http.post<DailySummary>(`${this.aiUrl}/daily-summary`, { tasks, slots: [] });
  }

  getMotivationalQuote(schedule: DailyScheduleItem[]): Observable<MotivationalQuote> {
    const tasks = schedule.map(item => ({
      type: 'task',
      day: new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
      start: item.startTime,
      end: item.endTime,
      text: item.title
    }));
    return this.http.post<MotivationalQuote>(`${this.aiUrl}/smart-reminders`, { tasks, slots: [] });
  }

  getFullResume(): Observable<{ summary: DailySummary; quote: MotivationalQuote }> {
    return this.getSchedule().pipe(
      switchMap(schedule =>
        this.generateWeeklySummary(schedule).pipe(
          switchMap(summary =>
            this.getMotivationalQuote(schedule).pipe(
              map(quote => ({ summary, quote }))
            )
          )
        )
      )
    );
  }
}