export interface DailyScheduleItem {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  priority: string;
}

export interface DailySummary {
  summary: string;
}

export interface MotivationalQuote {
  quote: string;
  context_note: string;
}
