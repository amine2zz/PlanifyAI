import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/calendar', pathMatch: 'full' },
  { path: 'calendar', loadComponent: () => import('./components/calendar/calendar.component').then(m => m.CalendarComponent) },
  { path: 'resume', loadComponent: () => import('./components/resume/resume.component').then(m => m.ResumeComponent) },
];
