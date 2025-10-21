import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboardData: any = null;
  loading = false;
  error = '';
  
  // Filters
  currentWeekOffset = 0; // 0=current, -1=previous, 1=next
  selectedCategory = 'all';
  categories = ['all', 'work', 'meeting', 'personal', 'health', 'education', 'general'];
  
  // Charts
  categoryChart: any;
  dailyChart: any;
  weeklyChart: any;
  priorityChart: any;
  sentimentChart: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = '';
    
    const params = new URLSearchParams({
      week_offset: this.currentWeekOffset.toString(),
      category: this.selectedCategory
    });

    this.http.get(`http://127.0.0.1:5000/api/dashboard?${params}`)
      .subscribe({
        next: (data: any) => {
          this.dashboardData = data;
          this.loading = false;
          setTimeout(() => this.createCharts(), 100);
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement du dashboard';
          this.loading = false;
          console.error('Dashboard error:', error);
        }
      });
  }

  onFilterChange() {
    this.loadDashboard();
  }

  previousWeek() {
    this.currentWeekOffset--;
    this.loadDashboard();
  }

  nextWeek() {
    this.currentWeekOffset++;
    this.loadDashboard();
  }

  currentWeek() {
    this.currentWeekOffset = 0;
    this.loadDashboard();
  }

  getWeekLabel(): string {
    return this.dashboardData?.summary?.week_label || 'Cette semaine';
  }

  getDateRange(): string {
    if (!this.dashboardData?.summary?.date_range) return '';
    const start = new Date(this.dashboardData.summary.date_range.start).toLocaleDateString('fr-FR');
    const end = new Date(this.dashboardData.summary.date_range.end).toLocaleDateString('fr-FR');
    return `${start} - ${end}`;
  }

  createCharts() {
    this.destroyCharts();
    
    if (!this.dashboardData?.charts) return;

    // Category Time Chart (Doughnut)
    const categoryCtx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (categoryCtx && this.dashboardData.charts.category_time.length > 0) {
      this.categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: this.dashboardData.charts.category_time.map((item: any) => item.name),
          datasets: [{
            data: this.dashboardData.charts.category_time.map((item: any) => item.value),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Temps par Catégorie (heures)' }
          }
        }
      });
    }

    // Daily Time Chart (Line)
    const dailyCtx = document.getElementById('dailyChart') as HTMLCanvasElement;
    if (dailyCtx && this.dashboardData.charts.daily_time.length > 0) {
      this.dailyChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
          labels: this.dashboardData.charts.daily_time.map((item: any) => item.date),
          datasets: [{
            label: 'Heures par jour',
            data: this.dashboardData.charts.daily_time.map((item: any) => item.hours),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Évolution Quotidienne' }
          }
        }
      });
    }

    // Weekly Time Chart (Bar)
    const weeklyCtx = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (weeklyCtx && this.dashboardData.charts.weekly_time.length > 0) {
      this.weeklyChart = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
          labels: this.dashboardData.charts.weekly_time.map((item: any) => `Semaine ${item.week}`),
          datasets: [{
            label: 'Heures par semaine',
            data: this.dashboardData.charts.weekly_time.map((item: any) => item.hours),
            backgroundColor: '#4BC0C0'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Répartition Hebdomadaire' }
          }
        }
      });
    }

    // Priority Distribution Chart (Pie)
    const priorityCtx = document.getElementById('priorityChart') as HTMLCanvasElement;
    if (priorityCtx && this.dashboardData.charts.priority_distribution.length > 0) {
      this.priorityChart = new Chart(priorityCtx, {
        type: 'pie',
        data: {
          labels: this.dashboardData.charts.priority_distribution.map((item: any) => item.name),
          datasets: [{
            data: this.dashboardData.charts.priority_distribution.map((item: any) => item.value),
            backgroundColor: ['#FF6384', '#FFCE56', '#4BC0C0']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Distribution des Priorités' }
          }
        }
      });
    }

    // Sentiment Analysis Chart (Doughnut)
    const sentimentCtx = document.getElementById('sentimentChart') as HTMLCanvasElement;
    if (sentimentCtx && this.dashboardData.sentiment && this.dashboardData.sentiment.sentiment_distribution) {
      const sentimentData = this.dashboardData.sentiment.sentiment_distribution;
      this.sentimentChart = new Chart(sentimentCtx, {
        type: 'doughnut',
        data: {
          labels: ['Positif', 'Négatif', 'Neutre'],
          datasets: [{
            data: [sentimentData.positive, sentimentData.negative, sentimentData.neutral],
            backgroundColor: ['#28a745', '#dc3545', '#6c757d']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Analyse de Sentiment (IA)' }
          }
        }
      });
    }
  }

  getSentimentIcon(): string {
    if (!this.dashboardData?.sentiment) return '😐';
    const sentiment = this.dashboardData.sentiment.overall_sentiment;
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '🙁';
      default: return '😐';
    }
  }

  getSentimentLabel(): string {
    if (!this.dashboardData?.sentiment) return 'Neutre';
    const sentiment = this.dashboardData.sentiment.overall_sentiment;
    switch (sentiment) {
      case 'positive': return 'Positif';
      case 'negative': return 'Négatif';
      default: return 'Neutre';
    }
  }

  getProductivityIcon(): string {
    if (!this.dashboardData?.productivity_score) return '📈';
    const score = this.dashboardData.productivity_score.score;
    if (score >= 80) return '🎆';
    if (score >= 60) return '📈';
    if (score >= 40) return '📉';
    return '⚠️';
  }

  getProductivityColor(): string {
    if (!this.dashboardData?.productivity_score) return '#6c757d';
    const score = this.dashboardData.productivity_score.score;
    if (score >= 80) return 'linear-gradient(135deg, #28a745, #20c997)';
    if (score >= 60) return 'linear-gradient(135deg, #17a2b8, #6f42c1)';
    if (score >= 40) return 'linear-gradient(135deg, #ffc107, #fd7e14)';
    return 'linear-gradient(135deg, #dc3545, #e83e8c)';
  }

  destroyCharts() {
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.dailyChart) this.dailyChart.destroy();
    if (this.weeklyChart) this.weeklyChart.destroy();
    if (this.priorityChart) this.priorityChart.destroy();
    if (this.sentimentChart) this.sentimentChart.destroy();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }
}