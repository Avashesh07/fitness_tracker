# FEBRUARY GOAL // Fitness Protocol 🎮⚔️

A gamified weight loss tracking application inspired by the Batman Arkham series UI. Track your daily weight, calories, and workouts with an immersive tactical HUD interface.

## Features

### 🎯 Command Center (Dashboard)
- Operator statistics with animated HUD displays
- Achievement system with XP rewards
- Real-time weight and calorie trend charts
- Activity log with tactical formatting

### ⚖️ Mass Tracking
- Log daily weight readings with baseline comparison
- Visual trajectory charts (7D/30D/90D/All)
- Delta calculations showing progress from baseline
- +100 XP per entry logged

### ⛽ Fuel Management  
- Track caloric intake and burn rates
- Net balance gauge with deficit/surplus indicators
- Fuel trend analysis charts
- +50 XP per entry logged

### ⚔️ Combat Training
- Log cardio and strength sessions
- Weekly operations calendar view
- Combat distribution analytics
- Streak tracking with fire indicator
- +150 XP per workout logged

### 🏆 Gamification
- XP system with level progression
- Unlockable achievements
- Streak bonuses
- Tactical UI feedback

## Tech Stack

- **Frontend**: Angular 17+ (Standalone Components)
- **Backend**: Node.js + Express
- **Charts**: Chart.js
- **Data**: Local CSV files
- **Fonts**: Orbitron, Rajdhani, Share Tech Mono

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### Running

**Terminal 1 - Backend (Port 3000):**
```bash
cd backend
pnpm start
```

**Terminal 2 - Frontend (Port 4200):**
```bash
cd frontend
pnpm start
```

Open **http://localhost:4200** in your browser.

## Project Structure

```
personal_tracker/
├── backend/
│   ├── server.js         # Express API
│   ├── package.json
│   └── data/             # CSV storage
│       ├── weight.csv
│       ├── calories.csv
│       └── workouts.csv
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── weight-tracker/
│   │   │   │   ├── calorie-tracker/
│   │   │   │   └── workout-tracker/
│   │   │   ├── services/
│   │   │   └── app.component.ts
│   │   ├── styles.css    # Arkham-inspired theme
│   │   └── index.html
│   └── package.json
│
└── README.md
```

## XP & Leveling System

| Action | XP Reward |
|--------|-----------|
| Log weight entry | +100 XP |
| Log calorie data | +50 XP |
| Complete workout | +150 XP |
| 5-day streak | +250 XP |

**Level Formula:** 1000 XP per level

## Achievements

- **FIRST BLOOD** - Log your first weight (+100 XP)
- **ENERGIZED** - Track 7 days of calories (+200 XP)
- **WARRIOR** - Complete 10 workouts (+300 XP)
- **ON FIRE** - Maintain a 5-day streak (+250 XP)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weight` | Get all weight entries |
| POST | `/api/weight` | Add/update weight |
| DELETE | `/api/weight/:date` | Delete weight entry |
| GET | `/api/calories` | Get all calorie entries |
| POST | `/api/calories` | Add/update calories |
| DELETE | `/api/calories/:date` | Delete calorie entry |
| GET | `/api/workouts` | Get all workouts |
| POST | `/api/workouts` | Add/update workout |
| DELETE | `/api/workouts/:date` | Delete workout |
| GET | `/api/stats` | Get aggregated stats |

## Theme Customization

The Arkham-inspired theme uses CSS variables in `frontend/src/styles.css`:

```css
:root {
  --accent-primary: #ff6a00;    /* Orange HUD color */
  --accent-blue: #00a8ff;       /* Secondary accent */
  --accent-red: #ff2d2d;        /* Warning/Combat */
  --bg-void: #050608;           /* Deep background */
  --level-gold: #ffd700;        /* XP/Level color */
}
```

## License

MIT - Built for fitness enthusiasts who want to feel like a tactical operator while tracking their gains.

---

**PROTOCOL STATUS: OPERATIONAL** ◆ **BUILD: 2025.02**
