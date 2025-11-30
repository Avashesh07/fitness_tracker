import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, WorkoutEntry } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-workout-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workout-tracker">
      <!-- Page Header -->
      <div class="page-header animate-fade-in">
        <div class="header-content">
          <span class="header-tag">◆ COMBAT MODULE</span>
          <h1>TRAINING PROTOCOL</h1>
          <p class="header-desc">Log cardio and strength combat sessions</p>
        </div>
        <div class="streak-display">
          <div class="streak-flame">🔥</div>
          <div class="streak-info">
            <span class="streak-value mono">{{ currentStreak }}</span>
            <span class="streak-label">DAY STREAK</span>
          </div>
          <div class="streak-divider"></div>
          <div class="streak-info">
            <span class="streak-value mono">{{ totalWorkouts }}</span>
            <span class="streak-label">TOTAL SESSIONS</span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Input Panel -->
        <div class="input-panel card animate-fade-in" style="animation-delay: 0.1s">
          <div class="panel-header">
            <span class="panel-icon">◆</span>
            <span class="panel-title">LOG COMBAT SESSION</span>
          </div>
          
          <form (ngSubmit)="addWorkout()" class="input-form">
            <div class="form-field">
              <label>
                <span class="field-label">DATE STAMP</span>
              </label>
              <input 
                type="date" 
                [(ngModel)]="newEntry.date" 
                name="date"
                required>
            </div>

            <!-- Combat Type Selection -->
            <div class="combat-types">
              <div class="combat-card" [class.selected]="newEntry.cardio" (click)="newEntry.cardio = !newEntry.cardio">
                <div class="combat-icon">⚡</div>
                <div class="combat-info">
                  <span class="combat-name">CARDIO</span>
                  <span class="combat-desc">Endurance Training</span>
                </div>
                <div class="combat-check" *ngIf="newEntry.cardio">✓</div>
                <div class="combat-xp">+75 XP</div>
              </div>

              <div class="combat-card" [class.selected]="newEntry.strength" (click)="newEntry.strength = !newEntry.strength">
                <div class="combat-icon">💪</div>
                <div class="combat-info">
                  <span class="combat-name">STRENGTH</span>
                  <span class="combat-desc">Power Training</span>
                </div>
                <div class="combat-check" *ngIf="newEntry.strength">✓</div>
                <div class="combat-xp">+75 XP</div>
              </div>
            </div>

            @if (newEntry.cardio) {
              <div class="form-field duration animate-fade-in">
                <label>
                  <span class="field-icon">⚡</span>
                  <span class="field-label">CARDIO DURATION</span>
                  <span class="field-unit">MIN</span>
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newEntry.cardioMinutes" 
                  name="cardioMinutes"
                  placeholder="Minutes">
              </div>
            }

            @if (newEntry.strength) {
              <div class="form-field duration animate-fade-in">
                <label>
                  <span class="field-icon">💪</span>
                  <span class="field-label">STRENGTH DURATION</span>
                  <span class="field-unit">MIN</span>
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newEntry.strengthMinutes" 
                  name="strengthMinutes"
                  placeholder="Minutes">
              </div>
            }

            <div class="form-field">
              <label>
                <span class="field-label">MISSION NOTES</span>
                <span class="field-optional">OPTIONAL</span>
              </label>
              <textarea 
                [(ngModel)]="newEntry.notes" 
                name="notes"
                rows="2"
                placeholder="Combat debrief..."></textarea>
            </div>

            <div class="update-hint" *ngIf="hasExistingWorkout()">
              <span class="hint-icon">ℹ</span>
              <span class="hint-text">Entry exists for this date. Data will be merged/updated.</span>
            </div>

            <button type="submit" class="btn btn-primary submit-btn" [disabled]="!newEntry.cardio && !newEntry.strength">
              <span class="btn-icon">⚔</span>
              {{ hasExistingWorkout() ? 'UPDATE COMBAT SESSION' : 'LOG COMBAT SESSION' }}
            </button>
          </form>
        </div>

        <!-- Stats & Charts -->
        <div class="charts-container">
          <!-- Weekly Overview -->
          <div class="week-panel card animate-fade-in" style="animation-delay: 0.15s">
            <div class="panel-header">
              <span class="panel-icon">◆</span>
              <span class="panel-title">WEEKLY OPERATIONS</span>
            </div>
            <div class="week-grid">
              @for (day of weekDays; track day.name) {
                <div class="day-cell" [class.completed]="day.hasWorkout" [class.today]="day.isToday">
                  <span class="day-name">{{ day.name }}</span>
                  <div class="day-icons">
                    @if (day.hasWorkout) {
                      @if (day.cardio) {
                        <span class="day-badge cardio">⚡</span>
                      }
                      @if (day.strength) {
                        <span class="day-badge strength">💪</span>
                      }
                    } @else {
                      <span class="day-empty">—</span>
                    }
                  </div>
                  <div class="day-indicator" [class.active]="day.hasWorkout"></div>
                </div>
              }
            </div>
          </div>

          <!-- Distribution Chart -->
          <div class="chart-panel card animate-fade-in" style="animation-delay: 0.2s">
            <div class="panel-header">
              <span class="panel-icon">◆</span>
              <span class="panel-title">COMBAT DISTRIBUTION</span>
            </div>
            <div class="chart-container">
              <canvas #distributionChart></canvas>
            </div>
          </div>

          <!-- Activity Chart -->
          <div class="chart-panel card animate-fade-in" style="animation-delay: 0.25s">
            <div class="panel-header">
              <span class="panel-icon">◆</span>
              <span class="panel-title">MONTHLY ACTIVITY</span>
            </div>
            <div class="chart-container">
              <canvas #activityChart></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Combat Log -->
      <div class="data-log card animate-fade-in" style="animation-delay: 0.3s">
        <div class="panel-header">
          <span class="panel-icon">◆</span>
          <span class="panel-title">COMBAT LOG</span>
          <span class="entry-count">{{ workouts.length }} MISSIONS</span>
        </div>
        
        <div class="log-table">
          <div class="table-header">
            <span class="col-date">TIMESTAMP</span>
            <span class="col-type">TYPE</span>
            <span class="col-duration">DURATION</span>
            <span class="col-notes">NOTES</span>
            <span class="col-action">ACTION</span>
          </div>
          <div class="table-body">
            @for (entry of workouts.slice().reverse(); track entry.date) {
              <div class="table-row">
                <span class="col-date">
                  <span class="date-icon">◇</span>
                  {{ entry.date | date:'dd.MM.yyyy' }}
                </span>
                <span class="col-type">
                  <div class="type-badges">
                    @if (isTrue(entry.cardio)) {
                      <span class="type-badge cardio">⚡ CARDIO</span>
                    }
                    @if (isTrue(entry.strength)) {
                      <span class="type-badge strength">💪 STRENGTH</span>
                    }
                  </div>
                </span>
                <span class="col-duration">
                  <div class="duration-display">
                    @if (isTrue(entry.cardio) && entry.cardioMinutes) {
                      <span class="duration-item cardio mono">{{ entry.cardioMinutes }}m</span>
                    }
                    @if (isTrue(entry.strength) && entry.strengthMinutes) {
                      <span class="duration-item strength mono">{{ entry.strengthMinutes }}m</span>
                    }
                  </div>
                </span>
                <span class="col-notes">{{ entry.notes || '—' }}</span>
                <span class="col-action">
                  <button class="action-btn delete" (click)="deleteWorkout(entry.date)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M6 6l12 12M6 18L18 6"/>
                    </svg>
                  </button>
                </span>
              </div>
            }
            @empty {
              <div class="table-empty">
                <span class="empty-icon">⚔</span>
                <span class="empty-text">NO COMBAT SESSIONS LOGGED</span>
                <span class="empty-hint">Begin training protocol</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workout-tracker {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: linear-gradient(90deg, var(--bg-panel) 0%, transparent 100%);
      border-left: 3px solid var(--accent-red);
    }

    .header-tag {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--accent-red);
      letter-spacing: 0.2em;
    }

    .page-header h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.15em;
      margin: 8px 0 4px;
    }

    .header-desc {
      font-size: 13px;
      color: var(--text-secondary);
    }

    /* Streak Display */
    .streak-display {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px 24px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .streak-flame {
      font-size: 32px;
      animation: flicker 1s ease infinite;
    }

    @keyframes flicker {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .streak-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .streak-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--accent-primary);
      text-shadow: 0 0 15px var(--accent-primary-glow);
    }

    .streak-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }

    .streak-divider {
      width: 1px;
      height: 40px;
      background: var(--border-color);
    }

    .content-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 20px;
    }

    /* Panel Styles */
    .panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .panel-icon {
      color: var(--accent-primary);
      font-size: 10px;
    }

    .panel-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.15em;
    }

    /* Input Form */
    .input-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-field label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .field-icon {
      font-size: 14px;
    }

    .field-label {
      font-family: 'Rajdhani', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: var(--text-secondary);
    }

    .field-unit {
      margin-left: auto;
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--accent-primary);
    }

    .field-optional {
      margin-left: auto;
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: var(--text-muted);
    }

    textarea {
      font-family: 'Rajdhani', sans-serif;
      resize: vertical;
      min-height: 60px;
    }

    /* Combat Types */
    .combat-types {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .combat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
    }

    .combat-card:hover {
      border-color: var(--accent-primary);
    }

    .combat-card.selected {
      border-color: var(--accent-primary);
      background: var(--accent-primary-faint);
    }

    .combat-icon {
      font-size: 28px;
    }

    .combat-info {
      display: flex;
      flex-direction: column;
    }

    .combat-name {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.1em;
    }

    .combat-desc {
      font-size: 11px;
      color: var(--text-muted);
    }

    .combat-check {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-primary);
      color: var(--bg-void);
      font-size: 14px;
      font-weight: 700;
    }

    .combat-xp {
      position: absolute;
      bottom: 8px;
      right: 12px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--level-gold);
    }

    .submit-btn {
      margin-top: 12px;
      padding: 16px 24px;
    }

    .submit-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Charts Container */
    .charts-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Week Panel */
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
    }

    .day-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      transition: all var(--transition-fast);
    }

    .day-cell.today {
      border-color: var(--accent-primary);
    }

    .day-cell.completed {
      background: var(--accent-primary-faint);
    }

    .day-name {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .day-icons {
      display: flex;
      gap: 4px;
      min-height: 24px;
    }

    .day-badge {
      font-size: 16px;
    }

    .day-empty {
      color: var(--text-muted);
      font-size: 14px;
    }

    .day-indicator {
      width: 100%;
      height: 3px;
      background: var(--bg-void);
      margin-top: 8px;
    }

    .day-indicator.active {
      background: var(--accent-primary);
      box-shadow: 0 0 10px var(--accent-primary-glow);
    }

    /* Chart Panels */
    .chart-container {
      height: 180px;
      position: relative;
    }

    /* Data Log */
    .entry-count {
      margin-left: auto;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--text-muted);
      padding: 4px 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .log-table {
      border: 1px solid var(--border-color);
    }

    .table-header {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1fr 2fr 80px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      border-bottom: 1px solid var(--border-color);
    }

    .table-body {
      max-height: 350px;
      overflow-y: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1fr 2fr 80px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);
      transition: all var(--transition-fast);
    }

    .table-row:hover {
      background: var(--accent-primary-faint);
    }

    .col-date {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .date-icon {
      color: var(--accent-primary);
      font-size: 8px;
    }

    .type-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .type-badge {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      padding: 4px 8px;
      letter-spacing: 0.05em;
    }

    .type-badge.cardio {
      background: rgba(0, 168, 255, 0.15);
      color: var(--accent-blue);
      border-left: 2px solid var(--accent-blue);
    }

    .type-badge.strength {
      background: rgba(157, 78, 221, 0.15);
      color: var(--accent-purple);
      border-left: 2px solid var(--accent-purple);
    }

    .duration-display {
      display: flex;
      gap: 12px;
    }

    .duration-item {
      font-size: 13px;
    }

    .duration-item.cardio {
      color: var(--accent-blue);
    }

    .duration-item.strength {
      color: var(--accent-purple);
    }

    .col-notes {
      font-size: 13px;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .action-btn svg {
      width: 14px;
      height: 14px;
    }

    .action-btn.delete:hover {
      background: rgba(255, 45, 45, 0.1);
      border-color: var(--accent-red);
      color: var(--accent-red);
    }

    .table-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 32px;
      opacity: 0.5;
    }

    .empty-text {
      font-family: 'Orbitron', sans-serif;
      font-size: 12px;
      letter-spacing: 0.15em;
    }

    .empty-hint {
      font-size: 11px;
    }

    .update-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(0, 168, 255, 0.1);
      border-left: 2px solid var(--accent-blue);
      font-size: 11px;
      color: var(--accent-blue);
    }

    .hint-icon {
      font-size: 14px;
    }

    .hint-text {
      font-family: 'Share Tech Mono', monospace;
      letter-spacing: 0.02em;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
      }
    }

    @media (max-width: 768px) {
      .week-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .table-header,
      .table-row {
        grid-template-columns: 1fr 1fr 80px;
      }

      .col-duration,
      .col-notes {
        display: none;
      }
    }
  `]
})
export class WorkoutTrackerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('distributionChart') distributionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('activityChart') activityChartRef!: ElementRef<HTMLCanvasElement>;

  workouts: WorkoutEntry[] = [];
  newEntry = {
    date: new Date().toISOString().split('T')[0],
    cardio: false,
    strength: false,
    cardioMinutes: null as number | null,
    strengthMinutes: null as number | null,
    notes: ''
  };

  weekDays: any[] = [];
  currentStreak = 0;
  totalWorkouts = 0;

  distributionChart: Chart | null = null;
  activityChart: Chart | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadWorkouts();
    this.generateWeekDays();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.distributionChart?.destroy();
    this.activityChart?.destroy();
  }

  loadWorkouts() {
    this.apiService.getWorkouts().subscribe(workouts => {
      this.workouts = workouts;
      this.calculateStats();
      this.updateWeekDays();
      this.initCharts();
    });
  }

  generateWeekDays() {
    const today = new Date();
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.weekDays.push({
        name: dayNames[i],
        date: date.toISOString().split('T')[0],
        isToday: date.toDateString() === today.toDateString(),
        hasWorkout: false,
        cardio: false,
        strength: false
      });
    }
  }

  updateWeekDays() {
    this.weekDays.forEach(day => {
      const workout = this.workouts.find(w => w.date === day.date);
      if (workout) {
        day.hasWorkout = this.isTrue(workout.cardio) || this.isTrue(workout.strength);
        day.cardio = this.isTrue(workout.cardio);
        day.strength = this.isTrue(workout.strength);
      }
    });
  }

  calculateStats() {
    this.totalWorkouts = this.workouts.filter(w => 
      this.isTrue(w.cardio) || this.isTrue(w.strength)
    ).length;

    this.currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedWorkouts = [...this.workouts]
      .filter(w => this.isTrue(w.cardio) || this.isTrue(w.strength))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);
      workoutDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (workoutDate.getTime() === expectedDate.getTime()) {
        this.currentStreak++;
      } else if (i === 0 && workoutDate.getTime() === today.getTime() - 86400000) {
        this.currentStreak++;
      } else {
        break;
      }
    }
  }

  hasExistingWorkout(): boolean {
    return this.workouts.some(w => w.date === this.newEntry.date);
  }

  addWorkout() {
    if (!this.newEntry.cardio && !this.newEntry.strength) return;

    this.apiService.addWorkout({
      date: this.newEntry.date,
      cardio: this.newEntry.cardio,
      strength: this.newEntry.strength,
      cardioMinutes: this.newEntry.cardioMinutes || 0,
      strengthMinutes: this.newEntry.strengthMinutes || 0,
      notes: this.newEntry.notes
    }).subscribe(() => {
      this.newEntry = {
        date: new Date().toISOString().split('T')[0],
        cardio: false,
        strength: false,
        cardioMinutes: null,
        strengthMinutes: null,
        notes: ''
      };
      this.loadWorkouts();
    });
  }

  deleteWorkout(date: string) {
    if (confirm('Delete this combat session?')) {
      this.apiService.deleteWorkout(date).subscribe(() => {
        this.loadWorkouts();
      });
    }
  }

  isTrue(value: boolean | string): boolean {
    return value === true || value === 'true';
  }

  initCharts() {
    setTimeout(() => {
      this.initDistributionChart();
      this.initActivityChart();
    }, 100);
  }

  initDistributionChart() {
    if (!this.distributionChartRef?.nativeElement) return;

    this.distributionChart?.destroy();

    const ctx = this.distributionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const cardioCount = this.workouts.filter(w => this.isTrue(w.cardio)).length;
    const strengthCount = this.workouts.filter(w => this.isTrue(w.strength)).length;
    const bothCount = this.workouts.filter(w => this.isTrue(w.cardio) && this.isTrue(w.strength)).length;

    this.distributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['CARDIO', 'STRENGTH', 'BOTH'],
        datasets: [{
          data: [cardioCount - bothCount, strengthCount - bothCount, bothCount],
          backgroundColor: [
            'rgba(0, 168, 255, 0.8)',
            'rgba(157, 78, 221, 0.8)',
            'rgba(255, 106, 0, 0.8)'
          ],
          borderColor: ['#00a8ff', '#9d4edd', '#ff6a00'],
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#8090a0',
              padding: 12,
              usePointStyle: true,
              font: { family: 'Share Tech Mono', size: 10 }
            }
          },
          tooltip: {
            backgroundColor: '#141820',
            titleColor: '#ff6a00',
            bodyColor: '#e8e8e8',
            borderColor: 'rgba(255, 106, 0, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 0
          }
        }
      }
    });
  }

  initActivityChart() {
    if (!this.activityChartRef?.nativeElement || this.workouts.length === 0) return;

    this.activityChart?.destroy();

    const ctx = this.activityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const last4Weeks: { [key: string]: number } = {};
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekLabel = `W${4 - i}`;
      last4Weeks[weekLabel] = 0;
    }

    this.workouts.forEach(w => {
      if (this.isTrue(w.cardio) || this.isTrue(w.strength)) {
        const workoutDate = new Date(w.date);
        const diffDays = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);
        if (weekIndex < 4) {
          const weekLabel = `W${4 - weekIndex}`;
          if (last4Weeks[weekLabel] !== undefined) {
            last4Weeks[weekLabel]++;
          }
        }
      }
    });

    this.activityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(last4Weeks),
        datasets: [{
          label: 'Sessions',
          data: Object.values(last4Weeks),
          backgroundColor: 'rgba(255, 106, 0, 0.6)',
          borderColor: '#ff6a00',
          borderWidth: 2,
          borderRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141820',
            titleColor: '#ff6a00',
            bodyColor: '#e8e8e8',
            borderColor: 'rgba(255, 106, 0, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 0
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 106, 0, 0.08)' },
            ticks: { 
              color: '#4a5568',
              font: { family: 'Share Tech Mono', size: 10 },
              stepSize: 1
            }
          }
        }
      }
    });
  }
}
