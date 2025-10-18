import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeService } from 'src/app/services/resume.service';
import { DailySummary, MotivationalQuote } from './resume';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resume.component.html',
  styleUrls: ['./resume.component.css']
})
export class ResumeComponent implements OnInit {
  weeklySummary?: DailySummary;
  motivationalQuote?: MotivationalQuote;
  loading = true;
  error?: string;

  constructor(private resumeService: ResumeService) {}

  ngOnInit(): void {
    this.resumeService.getFullResume().subscribe({
      next: (data) => {
        // ✅ Match your actual backend response
        this.weeklySummary = data.summary;
        this.motivationalQuote = data.quote;
        this.loading = false;
      },
      error: (err) => {
        console.error('Resume fetch error:', err);
        this.error = 'Failed to load AI resume insights.';
        this.loading = false;
      }
    });
  }
}
