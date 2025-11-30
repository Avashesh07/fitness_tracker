import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, WeightEntry } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-weight-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weight-tracker">
      <!-- Page Header -->
      <div class="page-header animate-fade-in">
        <div class="header-content">
          <span class="header-tag">◆ BIOMETRICS MODULE</span>
          <h1>MASS TRACKING</h1>
          <p class="header-desc">Monitor subject mass fluctuations and trajectory</p>
        </div>
        <div class="header-stats">
          <div class="stat-block">
            <span class="stat-label">BASELINE</span>
            <span class="stat-value mono">{{ startWeight || '--' }} KG</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-block">
            <span class="stat-label">CURRENT</span>
            <span class="stat-value mono highlight">{{ currentWeight || '--' }} KG</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-block">
            <span class="stat-label">DELTA</span>
            <span class="stat-value mono" [class.positive]="weightChange < 0" [class.negative]="weightChange > 0">
              {{ weightChange > 0 ? '+' : '' }}{{ formatNumber(weightChange) }} KG
            </span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Input Panel -->
        <div class="input-panel card animate-fade-in" style="animation-delay: 0.1s">
          <div class="panel-header">
            <span class="panel-icon">◆</span>
            <span class="panel-title">DATA INPUT</span>
          </div>
          
          <form (ngSubmit)="addWeight()" class="input-form">
            <div class="form-field">
              <label>
                <span class="field-label">DATE STAMP</span>
                <span class="field-required">*REQUIRED</span>
              </label>
              <input 
                type="date" 
                [(ngModel)]="newEntry.date" 
                name="date"
                required>
            </div>
            
            <div class="form-field">
              <label>
                <span class="field-label">MASS VALUE</span>
                <span class="field-unit">KG</span>
              </label>
              <input 
                type="number" 
                [(ngModel)]="newEntry.weight" 
                name="weight"
                step="0.1"
                placeholder="Enter mass reading"
                required>
            </div>

            <div class="update-hint" *ngIf="hasExistingEntry()">
              <span class="hint-icon">ℹ</span>
              <span class="hint-text">Entry exists for this date. Will be overwritten.</span>
            </div>

            <button type="submit" class="btn btn-primary submit-btn">
              <span class="btn-icon">◈</span>
              {{ hasExistingEntry() ? 'UPDATE DATA' : 'RECORD DATA' }}
            </button>
          </form>

          <!-- XP Reward Notice -->
          <div class="xp-notice">
            <span class="xp-icon">⚡</span>
            <span class="xp-text">+100 XP for each entry logged</span>
          </div>
        </div>

        <!-- Chart Panel -->
        <div class="chart-panel card animate-fade-in" style="animation-delay: 0.15s">
          <div class="panel-header">
            <span class="panel-icon">◆</span>
            <span class="panel-title">MASS TRAJECTORY</span>
            <div class="range-selector">
              <button 
                class="range-btn" 
                [class.active]="chartRange === 7"
                (click)="setChartRange(7)">7D</button>
              <button 
                class="range-btn" 
                [class.active]="chartRange === 30"
                (click)="setChartRange(30)">30D</button>
              <button 
                class="range-btn" 
                [class.active]="chartRange === 90"
                (click)="setChartRange(90)">90D</button>
              <button 
                class="range-btn" 
                [class.active]="chartRange === 0"
                (click)="setChartRange(0)">ALL</button>
            </div>
          </div>
          <div class="chart-container">
            <canvas #weightChart></canvas>
          </div>
        </div>
      </div>

      <!-- Data Log -->
      <div class="data-log card animate-fade-in" style="animation-delay: 0.2s">
        <div class="panel-header">
          <span class="panel-icon">◆</span>
          <span class="panel-title">DATA LOG</span>
          <span class="entry-count">{{ weights.length }} RECORDS</span>
        </div>
        
        <div class="log-table">
          <div class="table-header">
            <span class="col-date">TIMESTAMP</span>
            <span class="col-value">MASS</span>
            <span class="col-delta">DELTA</span>
            <span class="col-action">ACTION</span>
          </div>
          <div class="table-body">
            @for (entry of weights.slice().reverse(); track entry.date; let i = $index) {
              <div class="table-row">
                <span class="col-date">
                  <span class="date-icon">◇</span>
                  {{ entry.date | date:'dd.MM.yyyy' }}
                </span>
                <span class="col-value mono">{{ entry.weight }} KG</span>
                <span class="col-delta">
                  @if (getChange(weights.length - 1 - i) !== null) {
                    <span [class.positive]="getChange(weights.length - 1 - i)! < 0" [class.negative]="getChange(weights.length - 1 - i)! > 0">
                      {{ getChange(weights.length - 1 - i)! > 0 ? '▲' : '▼' }}
                      {{ formatNumber(Math.abs(getChange(weights.length - 1 - i)!)) }}
                    </span>
                  } @else {
                    <span class="neutral">BASELINE</span>
                  }
                </span>
                <span class="col-action">
                  <button class="action-btn delete" (click)="deleteWeight(entry.date)" title="Delete record">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M6 6l12 12M6 18L18 6"/>
                    </svg>
                  </button>
                </span>
              </div>
            }
            @empty {
              <div class="table-empty">
                <span class="empty-icon">📡</span>
                <span class="empty-text">NO DATA RECORDED</span>
                <span class="empty-hint">Begin logging to populate database</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .weight-tracker {
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

    .header-stats {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .stat-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }

    .stat-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-value.highlight {
      color: var(--accent-primary);
      text-shadow: 0 0 15px var(--accent-primary-glow);
    }

    .stat-value.positive {
      color: var(--accent-green);
    }

    .stat-value.negative {
      color: var(--accent-red);
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: var(--border-color);
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
      justify-content: space-between;
      align-items: center;
    }

    .field-label {
      font-family: 'Rajdhani', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: var(--text-secondary);
    }

    .field-required {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: var(--accent-red);
    }

    .field-unit {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--accent-primary);
    }

    .submit-btn {
      margin-top: 12px;
      padding: 16px 24px;
    }

    .btn-icon {
      font-size: 12px;
    }

    .xp-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-left: 2px solid var(--level-gold);
    }

    .xp-icon {
      font-size: 16px;
    }

    .xp-text {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--level-gold);
      letter-spacing: 0.05em;
    }

    /* Chart Panel */
    .range-selector {
      display: flex;
      gap: 4px;
      margin-left: auto;
    }

    .range-btn {
      padding: 6px 12px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--text-muted);
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .range-btn:hover {
      color: var(--text-primary);
      border-color: var(--accent-primary);
    }

    .range-btn.active {
      color: var(--bg-void);
      background: var(--accent-primary);
      border-color: var(--accent-primary);
    }

    .chart-container {
      height: 320px;
      position: relative;
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
      grid-template-columns: 2fr 1fr 1fr 80px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      border-bottom: 1px solid var(--border-color);
    }

    .table-body {
      max-height: 400px;
      overflow-y: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 80px;
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

    .col-value {
      font-size: 15px;
      color: var(--accent-primary);
    }

    .col-delta {
      font-family: 'Share Tech Mono', monospace;
      font-size: 13px;
    }

    .col-delta .positive {
      color: var(--accent-green);
    }

    .col-delta .negative {
      color: var(--accent-red);
    }

    .col-delta .neutral {
      color: var(--text-muted);
      font-size: 10px;
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
      color: var(--text-muted);
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

      .header-stats {
        width: 100%;
        justify-content: space-between;
      }
    }

    @media (max-width: 640px) {
      .header-stats {
        flex-wrap: wrap;
      }

      .stat-divider {
        display: none;
      }

      .table-header,
      .table-row {
        grid-template-columns: 1fr 1fr;
      }

      .col-delta,
      .col-action {
        display: none;
      }
    }
  `]
})
export class WeightTrackerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('weightChart') weightChartRef!: ElementRef<HTMLCanvasElement>;

  weights: WeightEntry[] = [];
  newEntry = {
    date: new Date().toISOString().split('T')[0],
    weight: null as number | null
  };

  startWeight: number | null = null;
  currentWeight: number | null = null;
  weightChange = 0;
  chartRange = 30;

  chart: Chart | null = null;
  Math = Math;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadWeights();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.chart?.destroy();
  }

  loadWeights() {
    this.apiService.getWeights().subscribe(weights => {
      this.weights = weights;
      this.calculateStats();
      this.initChart();
    });
  }

  calculateStats() {
    if (this.weights.length > 0) {
      this.startWeight = parseFloat(this.weights[0].weight as string);
      this.currentWeight = parseFloat(this.weights[this.weights.length - 1].weight as string);
      this.weightChange = this.currentWeight - this.startWeight;
    }
  }

  hasExistingEntry(): boolean {
    return this.weights.some(w => w.date === this.newEntry.date);
  }

  addWeight() {
    if (!this.newEntry.date || !this.newEntry.weight) return;

    this.apiService.addWeight({
      date: this.newEntry.date,
      weight: this.newEntry.weight
    }).subscribe(() => {
      this.newEntry.weight = null;
      this.loadWeights();
    });
  }

  deleteWeight(date: string) {
    if (confirm('Delete this record?')) {
      this.apiService.deleteWeight(date).subscribe(() => {
        this.loadWeights();
      });
    }
  }

  getChange(index: number): number | null {
    if (index === 0) return null;
    const current = parseFloat(this.weights[index].weight as string);
    const previous = parseFloat(this.weights[index - 1].weight as string);
    return current - previous;
  }

  formatNumber(num: number): string {
    return num.toFixed(1);
  }

  setChartRange(days: number) {
    this.chartRange = days;
    this.initChart();
  }

  initChart() {
    if (!this.weightChartRef?.nativeElement || this.weights.length === 0) return;

    this.chart?.destroy();

    const ctx = this.weightChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    let data = this.weights;
    if (this.chartRange > 0) {
      data = this.weights.slice(-this.chartRange);
    }

    const labels = data.map(w => {
      const d = new Date(w.date);
      return `${d.getDate()}.${d.getMonth() + 1}`;
    });
    const values = data.map(w => parseFloat(w.weight as string));

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(255, 106, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 106, 0, 0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Mass (KG)',
          data: values,
          borderColor: '#ff6a00',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#ff6a00',
          pointBorderColor: '#0a0c10',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#ff8533'
        }]
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
            cornerRadius: 0,
            titleFont: { family: 'Share Tech Mono' },
            bodyFont: { family: 'Rajdhani' },
            displayColors: false
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
}
