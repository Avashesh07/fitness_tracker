import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { WeightTrackerComponent } from './components/weight-tracker/weight-tracker.component';
import { CalorieTrackerComponent } from './components/calorie-tracker/calorie-tracker.component';
import { WorkoutTrackerComponent } from './components/workout-tracker/workout-tracker.component';
import { ApiService, Stats } from './services/api.service';
import { XPService } from './services/xp.service';
import { calculateLevel, getXPProgress } from './config/game-config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    WeightTrackerComponent,
    CalorieTrackerComponent,
    WorkoutTrackerComponent
  ],
  template: `
    <div class="app-container hex-pattern">
      <!-- Animated corner brackets -->
      <div class="corner-bracket top-left"></div>
      <div class="corner-bracket top-right"></div>
      <div class="corner-bracket bottom-left"></div>
      <div class="corner-bracket bottom-right"></div>
      
      <!-- Header / Command Bar -->
      <header class="command-bar">
        <div class="logo-section">
          <div class="logo-text">
            <span class="logo-title">FEBRUARY GOAL</span>
            <span class="logo-subtitle">// FITNESS PROTOCOL v2.1</span>
          </div>
        </div>

        <nav class="nav-bar">
          <button 
            class="nav-item" 
            [class.active]="activeTab === 'dashboard'"
            (click)="activeTab = 'dashboard'">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <span class="nav-label">COMMAND</span>
            <span class="nav-hotkey">[F1]</span>
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab === 'weight'"
            (click)="activeTab = 'weight'">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18"/>
              </svg>
            </div>
            <span class="nav-label">MASS</span>
            <span class="nav-hotkey">[F2]</span>
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab === 'calories'"
            (click)="activeTab = 'calories'">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2C12.5 7 9.5 9.5 9.5 13.5C9.5 16 11 18 12 18C13 18 14.5 16 14.5 13.5C14.5 9.5 11.5 7 12 2Z"/>
                <path d="M12 18V22"/>
              </svg>
            </div>
            <span class="nav-label">FUEL</span>
            <span class="nav-hotkey">[F3]</span>
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab === 'workouts'"
            (click)="activeTab = 'workouts'">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 4v16M18 4v16M6 12h12M4 8h4M4 16h4M16 8h4M16 16h4"/>
              </svg>
            </div>
            <span class="nav-label">COMBAT</span>
            <span class="nav-hotkey">[F4]</span>
          </button>
        </nav>

        <div class="status-section">
          <div class="xp-display">
            <div class="xp-info">
              <span class="xp-label">OPERATOR XP</span>
              <span class="xp-value">{{ totalXP | number }}</span>
            </div>
            <div class="xp-bar-container">
              <div class="xp-bar-fill" [style.width.%]="xpProgress"></div>
            </div>
            <span class="xp-level">LVL {{ currentLevel }}</span>
          </div>
          <div class="datetime-display">
            <span class="time">{{ currentTime }}</span>
            <span class="date">{{ today | date:'dd.MM.yyyy' }}</span>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="main-content grid-overlay">
        @if (activeTab === 'dashboard') {
          <app-dashboard />
        }
        @if (activeTab === 'weight') {
          <app-weight-tracker />
        }
        @if (activeTab === 'calories') {
          <app-calorie-tracker />
        }
        @if (activeTab === 'workouts') {
          <app-workout-tracker />
        }
      </main>

      <!-- Status Footer -->
      <footer class="status-footer">
        <div class="footer-left">
          <span class="status-indicator active"></span>
          <span>SYSTEM ONLINE</span>
        </div>
        <div class="footer-center">
          <span class="data-stream">◄ DATA SYNC ACTIVE ►</span>
        </div>
        <div class="footer-right">
          <span>PROTOCOL: ACTIVE</span>
          <span class="separator">|</span>
          <span>BUILD: 2025.02</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Corner brackets */
    .corner-bracket {
      position: fixed;
      width: 40px;
      height: 40px;
      border: 2px solid var(--accent-primary);
      z-index: 100;
      opacity: 0.6;
    }

    .corner-bracket.top-left {
      top: 10px;
      left: 10px;
      border-right: none;
      border-bottom: none;
    }

    .corner-bracket.top-right {
      top: 10px;
      right: 10px;
      border-left: none;
      border-bottom: none;
    }

    .corner-bracket.bottom-left {
      bottom: 10px;
      left: 10px;
      border-right: none;
      border-top: none;
    }

    .corner-bracket.bottom-right {
      bottom: 10px;
      right: 10px;
      border-left: none;
      border-top: none;
    }

    /* Command Bar (Header) */
    .command-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: linear-gradient(180deg, rgba(20, 24, 32, 0.98) 0%, rgba(10, 12, 16, 0.95) 100%);
      border-bottom: 2px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }

    .command-bar::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
    }

    /* Logo Section */
    .logo-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
      filter: drop-shadow(0 0 10px var(--accent-primary-glow));
      animation: pulse-glow 3s ease infinite;
    }

    .logo-icon svg {
      width: 40px;
      height: 40px;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .logo-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: var(--accent-primary);
      text-shadow: 0 0 20px var(--accent-primary-glow);
    }

    .logo-subtitle {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 0.2em;
    }

    /* Navigation */
    .nav-bar {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 24px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
      font-family: inherit;
    }

    .nav-item::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--accent-primary);
      transform: scaleX(0);
      transition: transform var(--transition-normal);
    }

    .nav-item:hover {
      background: rgba(255, 106, 0, 0.05);
    }

    .nav-item:hover::before {
      transform: scaleX(0.5);
    }

    .nav-item.active {
      background: var(--accent-primary-faint);
    }

    .nav-item.active::before {
      transform: scaleX(1);
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      color: var(--text-secondary);
      transition: all var(--transition-normal);
    }

    .nav-item:hover .nav-icon,
    .nav-item.active .nav-icon {
      color: var(--accent-primary);
      filter: drop-shadow(0 0 6px var(--accent-primary-glow));
    }

    .nav-icon svg {
      width: 100%;
      height: 100%;
    }

    .nav-label {
      font-family: 'Rajdhani', sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: var(--text-secondary);
      transition: color var(--transition-normal);
    }

    .nav-item:hover .nav-label,
    .nav-item.active .nav-label {
      color: var(--text-primary);
    }

    .nav-hotkey {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: var(--text-muted);
      opacity: 0;
      transition: opacity var(--transition-normal);
    }

    .nav-item:hover .nav-hotkey {
      opacity: 1;
    }

    /* Status Section */
    .status-section {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .xp-display {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .xp-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .xp-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }

    .xp-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--accent-primary);
    }

    .xp-display .xp-bar-container {
      width: 120px;
      height: 6px;
    }

    .xp-level {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--level-gold);
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }

    .datetime-display {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-family: 'Share Tech Mono', monospace;
    }

    .datetime-display .time {
      font-size: 18px;
      color: var(--text-primary);
    }

    .datetime-display .date {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Main Content */
    .main-content {
      flex: 1;
      padding: 24px 32px;
      position: relative;
      z-index: 1;
    }

    /* Status Footer */
    .status-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 24px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--text-muted);
    }

    .footer-left, .footer-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 10px rgba(0, 255, 106, 0.5);
      animation: blink 2s ease infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .footer-center .data-stream {
      color: var(--accent-primary);
      letter-spacing: 0.3em;
      animation: dataFlicker 3s ease infinite;
    }

    @keyframes dataFlicker {
      0%, 100% { opacity: 1; }
      92% { opacity: 1; }
      93% { opacity: 0.3; }
      94% { opacity: 1; }
      95% { opacity: 0.5; }
      96% { opacity: 1; }
    }

    .separator {
      color: var(--border-color);
    }

    @media (max-width: 1200px) {
      .command-bar {
        flex-wrap: wrap;
        gap: 16px;
        padding: 16px;
      }

      .nav-bar {
        order: 3;
        width: 100%;
        justify-content: center;
      }

      .status-section {
        order: 2;
      }

      .xp-display {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .nav-label {
        display: none;
      }

      .nav-item {
        padding: 12px 16px;
      }

      .logo-subtitle {
        display: none;
      }

      .main-content {
        padding: 16px;
      }

      .corner-bracket {
        display: none;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  activeTab: 'dashboard' | 'weight' | 'calories' | 'workouts' = 'dashboard';
  today = new Date();
  currentTime = '';
  
  // Gamification
  totalXP = 0;
  currentLevel = 1;
  xpProgress = 0;

  constructor(
    private apiService: ApiService,
    private xpService: XPService
  ) {}

  ngOnInit() {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
    this.loadXPData();
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  async loadXPData() {
    try {
      const xpData = await this.xpService.calculateTotalXP();
      this.totalXP = xpData.totalXP;
      this.currentLevel = xpData.level.level;
      this.xpProgress = xpData.xpProgress.progress;
    } catch (error) {
      console.error('Error loading XP:', error);
      // Fallback to simple calculation
      this.apiService.getStats().subscribe(stats => {
        this.totalXP = (stats.totalEntries * 100) + 
                       (stats.avgCaloriesEaten > 0 ? stats.totalEntries * 50 : 0) +
                       (stats.totalWorkouts * 150);
        const level = calculateLevel(this.totalXP);
        this.currentLevel = level.level;
        const progress = getXPProgress(this.totalXP, level);
        this.xpProgress = progress.progress;
      });
    }
  }
}
