import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Stats, WeightEntry, CalorieEntry, WorkoutEntry } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <!-- Mission Header -->
      <div class="mission-header animate-fade-in">
        <div class="mission-title">
          <span class="mission-tag">◆ ACTIVE MISSION</span>
          <h1>COMMAND CENTER</h1>
        </div>
        <div class="mission-status">
          <span class="status-text">PROTOCOL STATUS:</span>
          <span class="status-value status-active">OPERATIONAL</span>
        </div>
      </div>

      <!-- Operator Stats -->
      <div class="operator-section animate-fade-in" style="animation-delay: 0.1s">
        <div class="section-header">
          <span class="section-icon">◈</span>
          <span class="section-title">OPERATOR STATISTICS</span>
          <span class="section-line"></span>
        </div>

        <div class="stats-grid">
          <!-- Weight Module -->
          <div class="stat-module">
            <div class="module-header">
              <span class="module-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2v20M2 12h20"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
              </span>
              <span class="module-title">MASS INDEX</span>
            </div>
            <div class="module-value">
              <span class="value-main mono">{{ stats?.currentWeight || '--' }}</span>
              <span class="value-unit">KG</span>
            </div>
            <div class="module-delta" [class.positive]="(stats?.weightLost || 0) > 0" [class.negative]="(stats?.weightLost || 0) < 0">
              <span class="delta-icon">{{ (stats?.weightLost || 0) > 0 ? '▼' : '▲' }}</span>
              <span class="delta-value">{{ formatNumber(Math.abs(stats?.weightLost || 0)) }} KG</span>
              <span class="delta-label">FROM BASELINE</span>
            </div>
            <div class="module-bar">
              <div class="bar-fill" [style.width.%]="getWeightProgress()"></div>
            </div>
          </div>

          <!-- Fuel Module -->
          <div class="stat-module">
            <div class="module-header">
              <span class="module-icon fuel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2C12.5 7 9.5 9.5 9.5 13.5C9.5 16 11 18 12 18C13 18 14.5 16 14.5 13.5C14.5 9.5 11.5 7 12 2Z"/>
                </svg>
              </span>
              <span class="module-title">FUEL INTAKE</span>
            </div>
            <div class="module-value">
              <span class="value-main mono">{{ stats?.avgCaloriesEaten || 0 }}</span>
              <span class="value-unit">KCAL/DAY</span>
            </div>
            <div class="module-secondary">
              <span class="secondary-label">BURN RATE:</span>
              <span class="secondary-value">{{ stats?.avgCaloriesBurnt || 0 }} KCAL</span>
            </div>
            <div class="fuel-gauge">
              <div class="gauge-segment" [class.active]="(stats?.avgCaloriesEaten || 0) > 0"></div>
              <div class="gauge-segment" [class.active]="(stats?.avgCaloriesEaten || 0) > 500"></div>
              <div class="gauge-segment" [class.active]="(stats?.avgCaloriesEaten || 0) > 1000"></div>
              <div class="gauge-segment" [class.active]="(stats?.avgCaloriesEaten || 0) > 1500"></div>
              <div class="gauge-segment" [class.active]="(stats?.avgCaloriesEaten || 0) > 2000"></div>
            </div>
          </div>

          <!-- Combat Module -->
          <div class="stat-module">
            <div class="module-header">
              <span class="module-icon combat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M6 4v16M18 4v16M6 12h12M4 8h4M4 16h4M16 8h4M16 16h4"/>
                </svg>
              </span>
              <span class="module-title">COMBAT SESSIONS</span>
            </div>
            <div class="module-value">
              <span class="value-main mono">{{ stats?.totalWorkouts || 0 }}</span>
              <span class="value-unit">TOTAL</span>
            </div>
            <div class="combat-breakdown">
              <div class="combat-type">
                <span class="type-icon">⚡</span>
                <span class="type-value">{{ stats?.cardioSessions || 0 }}</span>
                <span class="type-label">CARDIO</span>
              </div>
              <div class="combat-type">
                <span class="type-icon">💪</span>
                <span class="type-value">{{ stats?.strengthSessions || 0 }}</span>
                <span class="type-label">STRENGTH</span>
              </div>
            </div>
          </div>

          <!-- Days Module -->
          <div class="stat-module">
            <div class="module-header">
              <span class="module-icon days">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </span>
              <span class="module-title">DAYS TRACKED</span>
            </div>
            <div class="module-value">
              <span class="value-main mono">{{ stats?.totalEntries || 0 }}</span>
              <span class="value-unit">DAYS</span>
            </div>
            <div class="streak-indicator">
              <span class="streak-flame">🔥</span>
              <span class="streak-text">KEEP THE STREAK ALIVE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements Section -->
      <div class="achievements-section animate-fade-in" style="animation-delay: 0.15s">
        <div class="section-header">
          <span class="section-icon">◈</span>
          <span class="section-title">ACHIEVEMENTS UNLOCKED</span>
          <span class="section-line"></span>
        </div>
        <div class="achievements-grid">
          @for (achievement of achievements; track achievement.id) {
            <div class="achievement-card" [class.unlocked]="achievement.unlocked">
              <div class="achievement-icon">{{ achievement.icon }}</div>
              <div class="achievement-info">
                <span class="achievement-name">{{ achievement.name }}</span>
                <span class="achievement-desc">{{ achievement.description }}</span>
              </div>
              <div class="achievement-xp" *ngIf="achievement.unlocked">+{{ achievement.xp }} XP</div>
              <div class="achievement-lock" *ngIf="!achievement.unlocked">🔒</div>
            </div>
          }
        </div>
      </div>

      <!-- Intel Charts -->
      <div class="charts-section">
        <div class="chart-panel animate-fade-in" style="animation-delay: 0.2s">
          <div class="panel-header">
            <span class="panel-icon">◆</span>
            <span class="panel-title">MASS TRAJECTORY</span>
            <span class="panel-badge">30 DAY SCAN</span>
          </div>
          <div class="chart-container">
            <canvas #weightChart></canvas>
          </div>
        </div>

        <div class="chart-panel animate-fade-in" style="animation-delay: 0.25s">
          <div class="panel-header">
            <span class="panel-icon">◆</span>
            <span class="panel-title">FUEL ANALYSIS</span>
            <span class="panel-badge">INTAKE VS BURN</span>
          </div>
          <div class="chart-container">
            <canvas #calorieChart></canvas>
          </div>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="activity-section animate-fade-in" style="animation-delay: 0.3s">
        <div class="section-header">
          <span class="section-icon">◈</span>
          <span class="section-title">RECENT ACTIVITY LOG</span>
          <span class="section-line"></span>
        </div>
        <div class="activity-log">
          @for (activity of recentActivities; track activity.date; let i = $index) {
            <div class="log-entry" [style.animation-delay]="(0.3 + i * 0.05) + 's'">
              <div class="log-timestamp mono">{{ activity.date | date:'HH:mm' }}</div>
              <div class="log-icon" [ngClass]="activity.type">
                @switch (activity.type) {
                  @case ('weight') { <span>⚖</span> }
                  @case ('calories') { <span>🔥</span> }
                  @case ('workout') { <span>⚔</span> }
                }
              </div>
              <div class="log-details">
                <span class="log-action">{{ activity.title }}</span>
                <span class="log-date">{{ activity.date | date:'dd.MM.yyyy' }}</span>
              </div>
              <div class="log-value mono">{{ activity.value }}</div>
            </div>
          }
          @empty {
            <div class="log-empty">
              <span class="empty-icon">📡</span>
              <span class="empty-text">NO DATA RECORDED. BEGIN PROTOCOL.</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 28px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Mission Header */
    .mission-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: linear-gradient(90deg, var(--bg-panel) 0%, transparent 100%);
      border-left: 3px solid var(--accent-primary);
    }

    .mission-tag {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--accent-primary);
      letter-spacing: 0.2em;
    }

    .mission-header h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 0.15em;
      margin-top: 4px;
      background: linear-gradient(180deg, var(--text-primary) 0%, var(--text-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mission-status {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
    }

    .status-text {
      color: var(--text-muted);
    }

    .status-value {
      padding: 4px 12px;
      background: var(--accent-primary-faint);
      border: 1px solid var(--accent-primary);
      color: var(--accent-primary);
      letter-spacing: 0.15em;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .section-icon {
      color: var(--accent-primary);
      font-size: 12px;
    }

    .section-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.2em;
      color: var(--text-secondary);
    }

    .section-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--border-color), transparent);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-module {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      padding: 20px;
      position: relative;
      transition: all var(--transition-normal);
    }

    .stat-module::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--accent-primary);
      opacity: 0.5;
    }

    .stat-module:hover {
      border-color: var(--accent-primary);
      box-shadow: var(--shadow-orange);
    }

    .module-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .module-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
    }

    .module-icon.fuel { color: #ff6a00; }
    .module-icon.combat { color: #ff2d2d; }
    .module-icon.days { color: #00a8ff; }

    .module-icon svg {
      width: 24px;
      height: 24px;
    }

    .module-title {
      font-family: 'Rajdhani', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: var(--text-secondary);
    }

    .module-value {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
    }

    .value-main {
      font-family: 'Orbitron', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--accent-primary);
      text-shadow: 0 0 20px var(--accent-primary-glow);
    }

    .value-unit {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }

    .module-delta {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-secondary);
      margin-bottom: 12px;
    }

    .module-delta.positive {
      border-left: 2px solid var(--accent-green);
    }

    .module-delta.negative {
      border-left: 2px solid var(--accent-red);
    }

    .delta-icon {
      font-size: 12px;
    }

    .module-delta.positive .delta-icon,
    .module-delta.positive .delta-value {
      color: var(--accent-green);
    }

    .module-delta.negative .delta-icon,
    .module-delta.negative .delta-value {
      color: var(--accent-red);
    }

    .delta-value {
      font-family: 'Share Tech Mono', monospace;
      font-size: 14px;
      font-weight: 600;
    }

    .delta-label {
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }

    .module-bar {
      height: 4px;
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .module-bar .bar-fill {
      height: 100%;
      background: var(--accent-primary);
      box-shadow: 0 0 10px var(--accent-primary);
      transition: width 0.5s ease;
    }

    .module-secondary {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 12px;
    }

    .secondary-label {
      color: var(--text-muted);
    }

    .secondary-value {
      font-family: 'Share Tech Mono', monospace;
      color: var(--accent-blue);
    }

    .fuel-gauge {
      display: flex;
      gap: 4px;
    }

    .gauge-segment {
      flex: 1;
      height: 8px;
      background: var(--bg-secondary);
      transition: all var(--transition-normal);
    }

    .gauge-segment.active {
      background: linear-gradient(180deg, #ff6a00, #ff4400);
      box-shadow: 0 0 8px rgba(255, 106, 0, 0.5);
    }

    .combat-breakdown {
      display: flex;
      gap: 16px;
    }

    .combat-type {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: var(--bg-secondary);
    }

    .type-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }

    .type-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .type-label {
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }

    .streak-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--bg-secondary);
      border-left: 2px solid var(--accent-primary);
    }

    .streak-flame {
      font-size: 20px;
      animation: pulse 1s ease infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .streak-text {
      font-size: 11px;
      color: var(--accent-primary);
      letter-spacing: 0.1em;
    }

    /* Achievements */
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .achievement-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      transition: all var(--transition-normal);
      opacity: 0.4;
    }

    .achievement-card.unlocked {
      opacity: 1;
      border-color: var(--accent-primary);
      background: var(--accent-primary-faint);
    }

    .achievement-icon {
      font-size: 24px;
    }

    .achievement-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .achievement-name {
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .achievement-desc {
      font-size: 10px;
      color: var(--text-muted);
    }

    .achievement-xp {
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      color: var(--level-gold);
    }

    .achievement-lock {
      font-size: 16px;
      opacity: 0.5;
    }

    /* Charts */
    .charts-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .chart-panel {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      padding: 20px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
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

    .panel-badge {
      margin-left: auto;
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      padding: 4px 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .chart-container {
      height: 240px;
      position: relative;
    }

    /* Activity Log */
    .activity-log {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .log-entry {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-left: 2px solid var(--border-color);
      transition: all var(--transition-fast);
      animation: fadeIn 0.3s ease forwards;
    }

    .log-entry:hover {
      background: var(--bg-card);
      border-left-color: var(--accent-primary);
    }

    .log-timestamp {
      font-size: 12px;
      color: var(--text-muted);
      min-width: 60px;
    }

    .log-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .log-icon.weight { color: var(--accent-primary); }
    .log-icon.calories { color: #ff6a00; }
    .log-icon.workout { color: var(--accent-red); }

    .log-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .log-action {
      font-weight: 500;
      font-size: 14px;
    }

    .log-date {
      font-size: 11px;
      color: var(--text-muted);
    }

    .log-value {
      font-size: 14px;
      color: var(--accent-primary);
    }

    .log-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 32px;
      opacity: 0.5;
    }

    .empty-text {
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .achievements-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .achievements-grid {
        grid-template-columns: 1fr;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .mission-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('weightChart') weightChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('calorieChart') calorieChartRef!: ElementRef<HTMLCanvasElement>;

  stats: Stats | null = null;
  weights: WeightEntry[] = [];
  calories: CalorieEntry[] = [];
  workouts: WorkoutEntry[] = [];
  recentActivities: any[] = [];
  achievements: any[] = [];

  weightChart: Chart | null = null;
  calorieChart: Chart | null = null;

  Math = Math;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.initAchievements();
    this.loadData();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.weightChart?.destroy();
    this.calorieChart?.destroy();
  }

  initAchievements() {
    this.achievements = [
      { id: 1, icon: '🎯', name: 'FIRST BLOOD', description: 'Log your first weight', xp: 100, unlocked: false },
      { id: 2, icon: '⚡', name: 'ENERGIZED', description: 'Track 7 days of calories', xp: 200, unlocked: false },
      { id: 3, icon: '💪', name: 'WARRIOR', description: 'Complete 10 workouts', xp: 300, unlocked: false },
      { id: 4, icon: '🔥', name: 'ON FIRE', description: '5 day streak', xp: 250, unlocked: false },
    ];
  }

  loadData() {
    this.apiService.getStats().subscribe(stats => {
      this.stats = stats;
      this.updateAchievements();
    });

    this.apiService.getWeights().subscribe(weights => {
      this.weights = weights;
      this.initWeightChart();
      this.updateRecentActivities();
    });

    this.apiService.getCalories().subscribe(calories => {
      this.calories = calories;
      this.initCalorieChart();
      this.updateRecentActivities();
    });

    this.apiService.getWorkouts().subscribe(workouts => {
      this.workouts = workouts;
      this.updateRecentActivities();
    });
  }

  updateAchievements() {
    if (!this.stats) return;
    
    // First Blood - first weight entry
    this.achievements[0].unlocked = this.stats.totalEntries > 0;
    
    // Energized - 7 days of calories
    this.achievements[1].unlocked = this.stats.avgCaloriesEaten > 0;
    
    // Warrior - 10 workouts
    this.achievements[2].unlocked = this.stats.totalWorkouts >= 10;
    
    // On Fire - streak (simplified check)
    this.achievements[3].unlocked = this.stats.totalWorkouts >= 5;
  }

  formatNumber(num: number): string {
    return num.toFixed(1);
  }

  getWeightProgress(): number {
    if (!this.stats?.startWeight || !this.stats?.currentWeight) return 0;
    // Assuming a 10kg weight loss goal
    const goalLoss = 10;
    const actualLoss = this.stats.startWeight - this.stats.currentWeight;
    return Math.min(Math.max((actualLoss / goalLoss) * 100, 0), 100);
  }

  updateRecentActivities() {
    const activities: any[] = [];

    this.weights.slice(-5).forEach(w => {
      activities.push({
        type: 'weight',
        title: 'Mass recorded',
        date: w.date,
        value: `${w.weight} KG`
      });
    });

    this.calories.slice(-5).forEach(c => {
      activities.push({
        type: 'calories',
        title: 'Fuel logged',
        date: c.date,
        value: `${c.caloriesEaten} KCAL`
      });
    });

    this.workouts.slice(-5).forEach(w => {
      const types = [];
      if (w.cardio === 'true' || w.cardio === true) types.push('Cardio');
      if (w.strength === 'true' || w.strength === true) types.push('Strength');
      if (types.length > 0) {
        activities.push({
          type: 'workout',
          title: `Combat: ${types.join(' + ')}`,
          date: w.date,
          value: 'COMPLETE'
        });
      }
    });

    this.recentActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }

  initWeightChart() {
    if (!this.weightChartRef?.nativeElement || this.weights.length === 0) return;

    this.weightChart?.destroy();

    const ctx = this.weightChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const last30 = this.weights.slice(-30);
    const labels = last30.map(w => {
      const d = new Date(w.date);
      return `${d.getDate()}.${d.getMonth() + 1}`;
    });
    const data = last30.map(w => parseFloat(w.weight as string));

    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(255, 106, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 106, 0, 0)');

    this.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Mass (KG)',
          data,
          borderColor: '#ff6a00',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#ff6a00',
          pointBorderColor: '#0a0c10',
          pointBorderWidth: 2,
          pointHoverRadius: 6
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
            cornerRadius: 0,
            titleFont: { family: 'Share Tech Mono' },
            bodyFont: { family: 'Rajdhani' }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 106, 0, 0.1)' },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 106, 0, 0.1)' },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          }
        }
      }
    });
  }

  initCalorieChart() {
    if (!this.calorieChartRef?.nativeElement || this.calories.length === 0) return;

    this.calorieChart?.destroy();

    const ctx = this.calorieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const last14 = this.calories.slice(-14);
    const labels = last14.map(c => {
      const d = new Date(c.date);
      return `${d.getDate()}.${d.getMonth() + 1}`;
    });
    const eaten = last14.map(c => parseFloat(c.caloriesEaten as string));
    const burnt = last14.map(c => parseFloat(c.caloriesBurnt as string));

    this.calorieChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Intake',
            data: eaten,
            backgroundColor: 'rgba(255, 106, 0, 0.8)',
            borderColor: '#ff6a00',
            borderWidth: 1,
            borderRadius: 0
          },
          {
            label: 'Burn',
            data: burnt,
            backgroundColor: 'rgba(0, 168, 255, 0.8)',
            borderColor: '#00a8ff',
            borderWidth: 1,
            borderRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#8090a0',
              boxWidth: 12,
              padding: 16,
              font: { family: 'Rajdhani', size: 11 }
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
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 106, 0, 0.1)' },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          }
        }
      }
    });
  }
}
