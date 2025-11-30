import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CalorieEntry } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-calorie-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calorie-tracker">
      <!-- Page Header -->
      <div class="page-header animate-fade-in">
        <div class="header-content">
          <span class="header-tag">◆ ENERGY MODULE</span>
          <h1>FUEL MANAGEMENT</h1>
          <p class="header-desc">Monitor caloric intake and expenditure rates</p>
        </div>
        <div class="fuel-status">
          <div class="fuel-gauge-large">
            <div class="gauge-label">NET BALANCE</div>
            <div class="gauge-display" [class.deficit]="getNetToday() < 0" [class.surplus]="getNetToday() > 0">
              <span class="gauge-value mono">{{ getNetToday() > 0 ? '+' : '' }}{{ getNetToday() }}</span>
              <span class="gauge-unit">KCAL</span>
            </div>
            <div class="gauge-bar">
              <div class="gauge-center"></div>
              <div class="gauge-fill" [class.deficit]="getNetToday() < 0" [class.surplus]="getNetToday() > 0" 
                   [style.width.%]="getGaugeWidth()"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Input Panel -->
        <div class="input-panel card animate-fade-in" style="animation-delay: 0.1s">
          <div class="panel-header">
            <span class="panel-icon">◆</span>
            <span class="panel-title">FUEL INPUT</span>
          </div>
          
          <form (ngSubmit)="addCalories()" class="input-form">
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
            
            <div class="dual-input">
              <div class="form-field intake">
                <label>
                  <span class="field-icon">🔥</span>
                  <span class="field-label">INTAKE</span>
                  <span class="field-optional">OPTIONAL</span>
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newEntry.caloriesEaten" 
                  name="caloriesEaten"
                  placeholder="Calories eaten">
              </div>
              
              <div class="form-field burn">
                <label>
                  <span class="field-icon">⚡</span>
                  <span class="field-label">BURN</span>
                  <span class="field-optional">OPTIONAL</span>
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newEntry.caloriesBurnt" 
                  name="caloriesBurnt"
                  placeholder="Calories burnt">
              </div>
            </div>

            <div class="update-hint" *ngIf="hasExistingEntry()">
              <span class="hint-icon">ℹ</span>
              <span class="hint-text">Entry exists for this date. Only filled fields will be updated.</span>
            </div>

            <button type="submit" class="btn btn-primary submit-btn" [disabled]="!canSubmit()">
              <span class="btn-icon">◈</span>
              {{ hasExistingEntry() ? 'UPDATE FUEL DATA' : 'LOG FUEL DATA' }}
            </button>
          </form>

          <!-- Today's Summary -->
          @if (todayEntry) {
            <div class="today-summary">
              <div class="summary-header">
                <span class="summary-icon">◇</span>
                <span class="summary-title">TODAY'S FUEL REPORT</span>
              </div>
              <div class="summary-meters">
                <div class="meter intake">
                  <div class="meter-header">
                    <span class="meter-label">INTAKE</span>
                    <span class="meter-value mono">{{ todayEntry.caloriesEaten }}</span>
                  </div>
                  <div class="meter-bar">
                    <div class="meter-fill" [style.width.%]="getBarWidth(todayEntry.caloriesEaten, 2000)"></div>
                  </div>
                  <span class="meter-max">/ 2000 KCAL</span>
                </div>
                <div class="meter burn">
                  <div class="meter-header">
                    <span class="meter-label">BURN</span>
                    <span class="meter-value mono">{{ todayEntry.caloriesBurnt }}</span>
                  </div>
                  <div class="meter-bar">
                    <div class="meter-fill" [style.width.%]="getBarWidth(todayEntry.caloriesBurnt, 1000)"></div>
                  </div>
                  <span class="meter-max">/ 1000 KCAL</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Charts -->
        <div class="charts-container">
          <div class="chart-panel card animate-fade-in" style="animation-delay: 0.15s">
            <div class="panel-header">
              <span class="panel-icon">◆</span>
              <span class="panel-title">FUEL TRENDS</span>
              <div class="chart-legend">
                <span class="legend-item intake"><span class="legend-dot"></span>INTAKE</span>
                <span class="legend-item burn"><span class="legend-dot"></span>BURN</span>
              </div>
            </div>
            <div class="chart-container">
              <canvas #trendChart></canvas>
            </div>
          </div>

          <div class="chart-panel card small animate-fade-in" style="animation-delay: 0.2s">
            <div class="panel-header">
              <span class="panel-icon">◆</span>
              <span class="panel-title">AVG DISTRIBUTION</span>
            </div>
            <div class="chart-container-small">
              <canvas #avgChart></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Log -->
      <div class="data-log card animate-fade-in" style="animation-delay: 0.25s">
        <div class="panel-header">
          <span class="panel-icon">◆</span>
          <span class="panel-title">FUEL LOG</span>
          <span class="entry-count">{{ calories.length }} RECORDS</span>
        </div>
        
        <div class="log-table">
          <div class="table-header">
            <span class="col-date">TIMESTAMP</span>
            <span class="col-intake">INTAKE</span>
            <span class="col-burn">BURN</span>
            <span class="col-net">NET</span>
            <span class="col-action">ACTION</span>
          </div>
          <div class="table-body">
            @for (entry of calories.slice().reverse(); track entry.date) {
              <tr class="table-row">
                <span class="col-date">
                  <span class="date-icon">◇</span>
                  {{ entry.date | date:'dd.MM.yyyy' }}
                </span>
                <span class="col-intake mono">
                  <span class="intake-indicator">▲</span>
                  {{ entry.caloriesEaten }} KCAL
                </span>
                <span class="col-burn mono">
                  <span class="burn-indicator">▼</span>
                  {{ entry.caloriesBurnt }} KCAL
                </span>
                <span class="col-net">
                  <span class="net-badge" [class.deficit]="getNet(entry) < 0" [class.surplus]="getNet(entry) > 0">
                    {{ getNet(entry) > 0 ? '+' : '' }}{{ getNet(entry) }}
                  </span>
                </span>
                <span class="col-action">
                  <button class="action-btn delete" (click)="deleteCalories(entry.date)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M6 6l12 12M6 18L18 6"/>
                    </svg>
                  </button>
                </span>
              </tr>
            }
            @empty {
              <div class="table-empty">
                <span class="empty-icon">⛽</span>
                <span class="empty-text">NO FUEL DATA RECORDED</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calorie-tracker {
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
      border-left: 3px solid var(--accent-primary);
    }

    .header-tag {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--accent-primary);
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

    /* Fuel Gauge Large */
    .fuel-gauge-large {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 40px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .gauge-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.15em;
      margin-bottom: 8px;
    }

    .gauge-display {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .gauge-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .gauge-display.deficit .gauge-value {
      color: var(--accent-green);
      text-shadow: 0 0 15px rgba(0, 255, 106, 0.5);
    }

    .gauge-display.surplus .gauge-value {
      color: var(--accent-primary);
      text-shadow: 0 0 15px var(--accent-primary-glow);
    }

    .gauge-unit {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--text-muted);
    }

    .gauge-bar {
      width: 200px;
      height: 6px;
      background: var(--bg-void);
      margin-top: 12px;
      position: relative;
    }

    .gauge-center {
      position: absolute;
      left: 50%;
      top: -2px;
      width: 2px;
      height: 10px;
      background: var(--text-muted);
      transform: translateX(-50%);
    }

    .gauge-fill {
      position: absolute;
      top: 0;
      height: 100%;
      transition: all 0.5s ease;
    }

    .gauge-fill.deficit {
      right: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 10px rgba(0, 255, 106, 0.5);
    }

    .gauge-fill.surplus {
      left: 50%;
      background: var(--accent-primary);
      box-shadow: 0 0 10px var(--accent-primary-glow);
    }

    .content-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
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

    .field-optional {
      margin-left: auto;
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: var(--text-muted);
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

    .dual-input {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-field.intake input {
      border-left: 3px solid var(--accent-primary);
    }

    .form-field.burn input {
      border-left: 3px solid var(--accent-blue);
    }

    .submit-btn {
      margin-top: 12px;
      padding: 16px 24px;
    }

    /* Today's Summary */
    .today-summary {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .summary-icon {
      color: var(--accent-primary);
      font-size: 10px;
    }

    .summary-title {
      font-family: 'Rajdhani', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
    }

    .summary-meters {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .meter {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meter-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }

    .meter-value {
      font-size: 16px;
      font-weight: 600;
    }

    .meter.intake .meter-value {
      color: var(--accent-primary);
    }

    .meter.burn .meter-value {
      color: var(--accent-blue);
    }

    .meter-bar {
      height: 8px;
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .meter-fill {
      height: 100%;
      transition: width 0.5s ease;
    }

    .meter.intake .meter-fill {
      background: linear-gradient(90deg, #ff6a00, #ff8533);
      box-shadow: 0 0 10px var(--accent-primary-glow);
    }

    .meter.burn .meter-fill {
      background: linear-gradient(90deg, #00a8ff, #33bbff);
      box-shadow: 0 0 10px rgba(0, 168, 255, 0.5);
    }

    .meter-max {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      text-align: right;
    }

    /* Charts */
    .charts-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chart-legend {
      display: flex;
      gap: 16px;
      margin-left: auto;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
    }

    .legend-dot {
      width: 8px;
      height: 8px;
    }

    .legend-item.intake .legend-dot {
      background: var(--accent-primary);
    }

    .legend-item.burn .legend-dot {
      background: var(--accent-blue);
    }

    .chart-container {
      height: 220px;
      position: relative;
    }

    .chart-container-small {
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
      grid-template-columns: 2fr 1.5fr 1.5fr 1fr 80px;
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
      grid-template-columns: 2fr 1.5fr 1.5fr 1fr 80px;
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

    .col-intake {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--accent-primary);
    }

    .intake-indicator {
      font-size: 10px;
    }

    .col-burn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--accent-blue);
    }

    .burn-indicator {
      font-size: 10px;
    }

    .net-badge {
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      padding: 4px 10px;
      background: var(--bg-secondary);
    }

    .net-badge.deficit {
      color: var(--accent-green);
      border-left: 2px solid var(--accent-green);
    }

    .net-badge.surplus {
      color: var(--accent-primary);
      border-left: 2px solid var(--accent-primary);
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
      gap: 12px;
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

    @media (max-width: 640px) {
      .table-header,
      .table-row {
        grid-template-columns: 1fr 1fr 80px;
      }

      .col-burn,
      .col-net {
        display: none;
      }
    }
  `]
})
export class CalorieTrackerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('avgChart') avgChartRef!: ElementRef<HTMLCanvasElement>;

  calories: CalorieEntry[] = [];
  newEntry = {
    date: new Date().toISOString().split('T')[0],
    caloriesEaten: null as number | null,
    caloriesBurnt: null as number | null
  };

  todayEntry: CalorieEntry | null = null;

  trendChart: Chart | null = null;
  avgChart: Chart | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadCalories();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.trendChart?.destroy();
    this.avgChart?.destroy();
  }

  loadCalories() {
    this.apiService.getCalories().subscribe(calories => {
      this.calories = calories;
      this.findTodayEntry();
      this.initCharts();
    });
  }

  findTodayEntry() {
    const today = new Date().toISOString().split('T')[0];
    this.todayEntry = this.calories.find(c => c.date === today) || null;
  }

  hasExistingEntry(): boolean {
    return this.calories.some(c => c.date === this.newEntry.date);
  }

  canSubmit(): boolean {
    if (!this.newEntry.date) return false;
    // Allow submit if at least one field has a value
    return this.newEntry.caloriesEaten !== null || this.newEntry.caloriesBurnt !== null;
  }

  addCalories() {
    if (!this.newEntry.date) return;
    // Allow partial submissions - at least one field should have data
    if (this.newEntry.caloriesEaten === null && this.newEntry.caloriesBurnt === null) return;

    const payload: any = { date: this.newEntry.date };
    
    // Only include fields that have values
    if (this.newEntry.caloriesEaten !== null) {
      payload.caloriesEaten = this.newEntry.caloriesEaten;
    }
    if (this.newEntry.caloriesBurnt !== null) {
      payload.caloriesBurnt = this.newEntry.caloriesBurnt;
    }

    this.apiService.addCalories(payload).subscribe(() => {
      this.newEntry.caloriesEaten = null;
      this.newEntry.caloriesBurnt = null;
      this.loadCalories();
    });
  }

  deleteCalories(date: string) {
    if (confirm('Delete this record?')) {
      this.apiService.deleteCalories(date).subscribe(() => {
        this.loadCalories();
      });
    }
  }

  getNet(entry: CalorieEntry): number {
    return Number(entry.caloriesEaten) - Number(entry.caloriesBurnt);
  }

  getNetToday(): number {
    if (!this.todayEntry) return 0;
    return Number(this.todayEntry.caloriesEaten) - Number(this.todayEntry.caloriesBurnt);
  }

  getGaugeWidth(): number {
    const net = this.getNetToday();
    // Scale to 50% max width
    return Math.min(Math.abs(net) / 2000 * 50, 50);
  }

  getBarWidth(value: number | string, max: number): number {
    return Math.min((Number(value) / max) * 100, 100);
  }

  initCharts() {
    setTimeout(() => {
      this.initTrendChart();
      this.initAvgChart();
    }, 100);
  }

  initTrendChart() {
    if (!this.trendChartRef?.nativeElement || this.calories.length === 0) return;

    this.trendChart?.destroy();

    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const last14 = this.calories.slice(-14);
    const labels = last14.map(c => {
      const d = new Date(c.date);
      return `${d.getDate()}.${d.getMonth() + 1}`;
    });
    const eaten = last14.map(c => Number(c.caloriesEaten));
    const burnt = last14.map(c => Number(c.caloriesBurnt));

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Intake',
            data: eaten,
            borderColor: '#ff6a00',
            backgroundColor: 'rgba(255, 106, 0, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#ff6a00'
          },
          {
            label: 'Burn',
            data: burnt,
            borderColor: '#00a8ff',
            backgroundColor: 'rgba(0, 168, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#00a8ff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
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
            grid: { color: 'rgba(255, 106, 0, 0.08)' },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 106, 0, 0.08)' },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          }
        }
      }
    });
  }

  initAvgChart() {
    if (!this.avgChartRef?.nativeElement || this.calories.length === 0) return;

    this.avgChart?.destroy();

    const ctx = this.avgChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const avgEaten = Math.round(this.calories.reduce((sum, c) => sum + Number(c.caloriesEaten), 0) / this.calories.length);
    const avgBurnt = Math.round(this.calories.reduce((sum, c) => sum + Number(c.caloriesBurnt), 0) / this.calories.length);

    this.avgChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['AVG INTAKE', 'AVG BURN'],
        datasets: [{
          data: [avgEaten, avgBurnt],
          backgroundColor: ['rgba(255, 106, 0, 0.8)', 'rgba(0, 168, 255, 0.8)'],
          borderColor: ['#ff6a00', '#00a8ff'],
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
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
}
