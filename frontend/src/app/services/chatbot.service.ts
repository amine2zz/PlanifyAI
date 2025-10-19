// src/app/services/chatbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retryWhen, mergeMap, scan } from 'rxjs/operators';

export interface AIItem {
  type: 'slot'|'task'|string;
  day?: string;
  start?: string;
  end?: string;
  text?: string;
}

export interface AIReply {
  summary?: string;
  items?: AIItem[];
  [k: string]: any;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  // If frontend and backend share origin, keep ''. Otherwise use the backend origin, e.g. 'http://127.0.0.1:5000'
public base = 'http://127.0.0.1:5000'
  constructor(private http: HttpClient) {}

  /**
   * Send the user's question to the backend /api/ai-assist endpoint.
   * Backend will use stored events from DB to answer.
   */
  public ask(question: string, tasks: any[] = [], slots: any[] = []): Observable<AIReply> {
    const body = { question, tasks, slots };
    const url = `${this.base}/api/ai-assist`;
    return this.http.post<any>(url, body).pipe(
      map(res => this.normalizeAssistResponse(res)),
      // handle errors: no fallback to voice (per your request); just propagate
      catchError(this.handleError.bind(this))
    );
  }

  private normalizeAssistResponse(res: any): AIReply {
    if (!res) return { summary: 'Réponse vide du serveur', items: [] };
    // backend returns { reply: { summary, items } }
    const payload = res.reply ?? res;
    if (payload && typeof payload === 'object') {
      const summary = payload.summary ?? payload.reply ?? payload.text ?? '';
      const items = payload.items ?? [];
      return { summary, items };
    }
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        return { summary: parsed.summary ?? payload, items: parsed.items ?? [] };
      } catch {
        return { summary: payload, items: [] };
      }
    }
    return { summary: 'Format de réponse inconnu', items: [] };
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    console.error('ChatbotService HTTP error', err);
    return throwError(() => err);
  }
}
