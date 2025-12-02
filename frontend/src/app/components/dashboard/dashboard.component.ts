import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Stats, WeightEntry, CalorieEntry, WorkoutEntry } from '../../services/api.service';
import { XPService, XPBreakdown, ArenaInfo } from '../../services/xp.service';
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

      <!-- Level & Arena Progression -->
      <div class="progression-section animate-fade-in" style="animation-delay: 0.05s">
        <!-- Level Display -->
        <div class="level-card">
          <div class="level-badge-large" [style.background]="'linear-gradient(135deg, ' + (xpData?.level?.color || '#808080') + ', ' + (xpData?.level?.color || '#808080') + 'dd)'">
            <div class="level-number">{{ xpData?.level?.level || 1 }}</div>
            <div class="level-title">{{ xpData?.level?.title || 'ROOKIE' }}</div>
          </div>
          <div class="level-info">
            <div class="level-description">{{ xpData?.level?.description || 'Just starting out' }}</div>
            <div class="xp-bar-container">
              <div class="xp-bar-fill" [style.width.%]="xpData?.xpProgress?.progress || 0"></div>
              <div class="xp-bar-text">
                <span class="xp-current mono">{{ xpData?.xpProgress?.current || 0 }}</span>
                <span class="xp-separator">/</span>
                <span class="xp-next mono">{{ xpData?.xpProgress?.next || 0 }}</span>
              </div>
            </div>
            <div class="xp-total">
              <span class="xp-label">TOTAL XP:</span>
              <span class="xp-value mono">{{ xpData?.totalXP || 0 | number }}</span>
            </div>
            @if (xpData && xpData.xpProgress.xpNeeded > 0) {
              <div class="xp-needed">
                <span class="needed-label">XP TO NEXT LEVEL:</span>
                <span class="needed-value mono">{{ xpData.xpProgress.xpNeeded }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Arena Display -->
        <div class="arena-card">
          <div class="arena-badge-large" [style.border-color]="arenaData?.current?.color || '#808080'">
            <div class="arena-icon">{{ arenaData?.current?.icon || '🏋️' }}</div>
            <div class="arena-name">{{ arenaData?.current?.name || 'TRAINING GROUNDS' }}</div>
          </div>
          <div class="arena-info">
            <div class="arena-description">{{ arenaData?.current?.description || 'Beginner arena' }}</div>
            <div class="arena-stats">
              <div class="arena-stat">
                <span class="stat-label">DEFICIT STREAK</span>
                <span class="stat-value mono highlight">{{ arenaData?.deficitStreak || 0 }}</span>
                <span class="stat-unit">DAYS</span>
              </div>
              @if (arenaData?.next) {
                <div class="arena-stat">
                  <span class="stat-label">NEXT ARENA</span>
                  <span class="stat-value">{{ arenaData?.next?.name }}</span>
                  <span class="stat-unit">{{ arenaData?.daysUntilNext }} DAYS</span>
                </div>
              } @else {
                <div class="arena-stat">
                  <span class="stat-label">STATUS</span>
                  <span class="stat-value highlight">MAX ARENA</span>
                  <span class="stat-unit">ACHIEVED</span>
                </div>
              }
            </div>
            @if (arenaData?.next) {
              <div class="arena-progress">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="getArenaProgress()"></div>
                </div>
                <div class="progress-text">
                  {{ arenaData?.daysUntilNext }} more day{{ arenaData?.daysUntilNext !== 1 ? 's' : '' }} until {{ arenaData?.next?.name }}
                </div>
              </div>
            }
          </div>
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

      <!-- Estimated Weight Loss Section -->
      <div class="weight-loss-section animate-fade-in" style="animation-delay: 0.18s">
        <div class="section-header">
          <span class="section-icon">◈</span>
          <span class="section-title">ESTIMATED WEIGHT LOSS FROM DEFICIT</span>
          <span class="section-line"></span>
        </div>
        
        <div class="weight-loss-stats">
          <div class="wl-stat">
            <span class="wl-label">TOTAL DEFICIT</span>
            <span class="wl-value mono" [class.positive]="totalDeficit < 0" [class.negative]="totalDeficit > 0">
              {{ totalDeficit > 0 ? '+' : '' }}{{ totalDeficit | number:'1.0-0' }} KCAL
            </span>
          </div>
          <div class="wl-stat highlight">
            <span class="wl-label">ESTIMATED CHANGE</span>
            <span class="wl-value mono" [class.positive]="estimatedWeightChange < 0" [class.negative]="estimatedWeightChange > 0">
              {{ estimatedWeightChange > 0 ? '+' : '' }}{{ formatNumber(estimatedWeightChange) }} KG
            </span>
          </div>
          <div class="wl-stat">
            <span class="wl-label">AVG DAILY DEFICIT</span>
            <span class="wl-value mono" [class.positive]="avgDailyDeficit < 0" [class.negative]="avgDailyDeficit > 0">
              {{ avgDailyDeficit > 0 ? '+' : '' }}{{ avgDailyDeficit | number:'1.0-0' }} KCAL
            </span>
          </div>
          <div class="wl-stat">
            <span class="wl-label">PROJECTED/WEEK</span>
            <span class="wl-value mono" [class.positive]="projectedWeeklyChange < 0" [class.negative]="projectedWeeklyChange > 0">
              {{ projectedWeeklyChange > 0 ? '+' : '' }}{{ formatNumber(projectedWeeklyChange) }} KG
            </span>
          </div>
        </div>

        <div class="chart-panel full-width">
          <div class="panel-header">
            <span class="panel-icon">◆</span>
            <span class="panel-title">CUMULATIVE WEIGHT CHANGE</span>
            <span class="panel-badge">FROM CALORIE DATA</span>
          </div>
          <div class="chart-container-large">
            <canvas #estimatedLossChart></canvas>
          </div>
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

    /* Progression Section - Level & Arena */
    .progression-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .level-card,
    .arena-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      padding: 24px;
      display: flex;
      gap: 20px;
      position: relative;
      overflow: hidden;
    }

    .level-card::before,
    .arena-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
    }

    .level-badge-large {
      width: 120px;
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      box-shadow: 0 0 30px rgba(255, 106, 0, 0.3);
      position: relative;
      flex-shrink: 0;
    }

    .level-badge-large::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 12px;
      padding: 2px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .level-number {
      font-family: 'Orbitron', sans-serif;
      font-size: 48px;
      font-weight: 900;
      color: var(--bg-void);
      line-height: 1;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .level-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: var(--bg-void);
      letter-spacing: 0.15em;
      margin-top: 4px;
    }

    .level-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .level-description {
      font-size: 13px;
      color: var(--text-secondary);
      font-style: italic;
    }

    .xp-bar-container {
      position: relative;
      height: 24px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .xp-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff6a00, #ffaa00, #ff6a00);
      background-size: 200% 100%;
      animation: xpShimmer 2s linear infinite;
      box-shadow: 0 0 15px rgba(255, 106, 0, 0.5);
      transition: width 0.5s ease;
    }

    @keyframes xpShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .xp-bar-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--bg-void);
      font-weight: 700;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .xp-separator {
      opacity: 0.7;
    }

    .xp-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--bg-secondary);
      border-left: 2px solid var(--accent-primary);
    }

    .xp-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }

    .xp-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--accent-primary);
    }

    .xp-needed {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--text-secondary);
    }

    .needed-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.1em;
    }

    .needed-value {
      font-size: 13px;
      color: var(--accent-primary);
    }

    /* Arena Card */
    .arena-badge-large {
      width: 120px;
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 3px solid;
      border-radius: 12px;
      background: var(--bg-secondary);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      position: relative;
      flex-shrink: 0;
    }

    .arena-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    .arena-name {
      font-family: 'Orbitron', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-align: center;
      line-height: 1.2;
    }

    .arena-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .arena-description {
      font-size: 13px;
      color: var(--text-secondary);
      font-style: italic;
    }

    .arena-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .arena-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .stat-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }

    .stat-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      text-align: center;
    }

    .stat-value.highlight {
      color: var(--accent-primary);
      text-shadow: 0 0 10px var(--accent-primary-glow);
    }

    .stat-unit {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .arena-progress {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .progress-bar {
      height: 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-blue));
      box-shadow: 0 0 10px var(--accent-primary-glow);
      transition: width 0.5s ease;
    }

    .progress-text {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
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

    /* Weight Loss Section */
    .weight-loss-section {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      padding: 24px;
      position: relative;
    }

    .weight-loss-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-green), var(--accent-primary), var(--accent-green));
    }

    .weight-loss-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .wl-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .wl-stat.highlight {
      background: var(--accent-primary-faint);
      border-color: var(--accent-primary);
    }

    .wl-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .wl-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .wl-value.positive {
      color: var(--accent-green);
      text-shadow: 0 0 10px rgba(0, 255, 106, 0.5);
    }

    .wl-value.negative {
      color: var(--accent-red);
      text-shadow: 0 0 10px rgba(255, 45, 45, 0.5);
    }

    .chart-panel.full-width {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      padding: 20px;
    }

    .chart-container-large {
      height: 300px;
      position: relative;
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

      .weight-loss-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .progression-section {
        grid-template-columns: 1fr;
      }

      .level-card,
      .arena-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .weight-loss-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .progression-section {
        grid-template-columns: 1fr;
      }

      .level-badge-large,
      .arena-badge-large {
        width: 100px;
        height: 100px;
      }

      .level-number {
        font-size: 36px;
      }

      .arena-icon {
        font-size: 36px;
      }

      .arena-stats {
        grid-template-columns: 1fr;
      }

      .mission-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .chart-container-large {
        height: 250px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('weightChart') weightChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('calorieChart') calorieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('estimatedLossChart') estimatedLossChartRef!: ElementRef<HTMLCanvasElement>;

  stats: Stats | null = null;
  weights: WeightEntry[] = [];
  calories: CalorieEntry[] = [];
  workouts: WorkoutEntry[] = [];
  recentActivities: any[] = [];

  weightChart: Chart | null = null;
  calorieChart: Chart | null = null;
  estimatedLossChart: Chart | null = null;

  // Estimated weight loss calculations
  totalDeficit = 0;
  estimatedWeightChange = 0;
  avgDailyDeficit = 0;
  projectedWeeklyChange = 0;

  // XP & Arena data
  xpData: XPBreakdown | null = null;
  arenaData: ArenaInfo | null = null;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private xpService: XPService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.weightChart?.destroy();
    this.calorieChart?.destroy();
    this.estimatedLossChart?.destroy();
  }

  loadData() {
    this.apiService.getStats().subscribe(stats => {
      this.stats = stats;
    });

    this.apiService.getWeights().subscribe(weights => {
      this.weights = weights;
      this.initWeightChart();
      this.updateRecentActivities();
    });

    this.apiService.getCalories().subscribe(calories => {
      this.calories = calories;
      this.calculateEstimatedWeightLoss();
      this.initCalorieChart();
      this.initEstimatedLossChart();
      this.updateRecentActivities();
      this.loadXPData();
      this.loadArenaData();
    });

    this.apiService.getWorkouts().subscribe(workouts => {
      this.workouts = workouts;
      this.updateRecentActivities();
    });
  }

  async loadXPData() {
    try {
      this.xpData = await this.xpService.calculateTotalXP();
    } catch (error) {
      console.error('Error loading XP data:', error);
    }
  }

  async loadArenaData() {
    try {
      this.arenaData = await this.xpService.calculateArenaInfo();
    } catch (error) {
      console.error('Error loading arena data:', error);
    }
  }

  getArenaProgress(): number {
    if (!this.arenaData?.next) return 100;
    const current = this.arenaData.current.requiredDays;
    const next = this.arenaData.next.requiredDays;
    const progress = this.arenaData.deficitStreak;
    return ((progress - current) / (next - current)) * 100;
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

  calculateEstimatedWeightLoss() {
    if (this.calories.length === 0) {
      this.totalDeficit = 0;
      this.estimatedWeightChange = 0;
      this.avgDailyDeficit = 0;
      this.projectedWeeklyChange = 0;
      return;
    }

    // Calculate total net calories (eaten - burnt) for all days
    // Negative = deficit (weight loss), Positive = surplus (weight gain)
    this.totalDeficit = this.calories.reduce((sum, c) => {
      const eaten = Number(c.caloriesEaten) || 0;
      const burnt = Number(c.caloriesBurnt) || 0;
      return sum + (eaten - burnt);
    }, 0);

    // 7700 kcal ≈ 1kg of fat (using 7000 for simplicity)
    this.estimatedWeightChange = this.totalDeficit / 7000;

    // Average daily deficit
    this.avgDailyDeficit = this.totalDeficit / this.calories.length;

    // Projected weekly change based on average
    this.projectedWeeklyChange = (this.avgDailyDeficit * 7) / 7000;
  }

  initEstimatedLossChart() {
    if (!this.estimatedLossChartRef?.nativeElement || this.calories.length === 0) return;

    this.estimatedLossChart?.destroy();

    const ctx = this.estimatedLossChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Sort calories by date
    const sortedCalories = [...this.calories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels: string[] = [];
    const dailyDeficit: number[] = [];
    const cumulativeChange: number[] = [];
    let cumulative = 0;

    sortedCalories.forEach(c => {
      const d = new Date(c.date);
      labels.push(`${d.getDate()}.${d.getMonth() + 1}`);
      
      const eaten = Number(c.caloriesEaten) || 0;
      const burnt = Number(c.caloriesBurnt) || 0;
      const netDeficit = eaten - burnt;
      
      dailyDeficit.push(netDeficit);
      cumulative += netDeficit / 7000; // Convert to kg
      cumulativeChange.push(parseFloat(cumulative.toFixed(3)));
    });

    // Create gradient for cumulative line
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 255, 106, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 106, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 45, 45, 0)');
    gradient.addColorStop(1, 'rgba(255, 45, 45, 0.3)');

    this.estimatedLossChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cumulative Weight Change (kg)',
            data: cumulativeChange,
            borderColor: cumulativeChange[cumulativeChange.length - 1] <= 0 ? '#00ff6a' : '#ff2d2d',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: (context) => {
              const value = context.raw as number;
              return value <= 0 ? '#00ff6a' : '#ff2d2d';
            },
            pointBorderColor: '#0a0c10',
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            yAxisID: 'y'
          },
          {
            label: 'Daily Net (kcal)',
            data: dailyDeficit,
            borderColor: 'rgba(255, 106, 0, 0.6)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: '#ff6a00',
            yAxisID: 'y1'
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
            cornerRadius: 0,
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 0) {
                  const val = context.raw as number;
                  return `Est. Change: ${val > 0 ? '+' : ''}${val.toFixed(3)} kg`;
                } else {
                  const val = context.raw as number;
                  return `Daily Net: ${val > 0 ? '+' : ''}${val.toFixed(0)} kcal`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 106, 0, 0.08)' },
            ticks: { color: '#4a5568', font: { family: 'Share Tech Mono', size: 10 } }
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(0, 255, 106, 0.1)' },
            ticks: { 
              color: '#00ff6a', 
              font: { family: 'Share Tech Mono', size: 10 },
              callback: function(value) {
                return value + ' kg';
              }
            },
            title: {
              display: true,
              text: 'CUMULATIVE KG',
              color: '#4a5568',
              font: { family: 'Share Tech Mono', size: 9 }
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { display: false },
            ticks: { 
              color: '#ff6a00', 
              font: { family: 'Share Tech Mono', size: 10 },
              callback: function(value) {
                return value + ' kcal';
              }
            },
            title: {
              display: true,
              text: 'DAILY NET',
              color: '#4a5568',
              font: { family: 'Share Tech Mono', size: 9 }
            }
          }
        }
      }
    });
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
