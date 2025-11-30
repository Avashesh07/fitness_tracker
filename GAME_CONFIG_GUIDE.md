# 🎮 Game Configuration Guide

This guide explains how to modify the gamification system in **FEBRUARY GOAL**.

## 📁 Configuration File Location

All game mechanics are defined in: `frontend/src/app/config/game-config.ts`

## 🎯 XP Rewards System

### Modify XP Rewards

Edit the `XP_REWARDS` array to change how much XP each action gives:

```typescript
{
  action: 'weight_log',
  description: 'Log daily weight',
  baseXP: 50  // ← Change this number
}
```

**Available Actions:**
- `weight_log` - Logging weight
- `calorie_log` - Logging calories
- `workout_cardio` - Cardio sessions
- `workout_strength` - Strength training
- `workout_both` - Both cardio + strength (bonus!)
- `calorie_deficit_goal` - Meeting daily deficit goal
- `calorie_burn_goal` - Meeting burn goal
- `cardio_duration_goal` - Meeting cardio duration
- `strength_duration_goal` - Meeting strength duration
- `streak_bonus` - Consecutive day bonuses

### Add Multipliers

Some actions support multipliers for streaks:
```typescript
{
  action: 'workout_cardio',
  baseXP: 75,
  multiplier: 1.2  // 20% bonus for consecutive days
}
```

## 📊 Level System

### Modify Level Thresholds

Edit `LEVEL_THRESHOLDS` to change XP requirements:

```typescript
{
  level: 5,
  xpRequired: 3500,  // ← Change XP needed
  title: 'ELITE',     // ← Change level name
  description: 'Top performer',  // ← Change description
  color: '#ff6a00'    // ← Change badge color
}
```

**Add New Levels:**
Just add more entries to the array. The system automatically handles progression.

**Current Levels:**
1. ROOKIE (0 XP)
2. TRAINEE (500 XP)
3. OPERATOR (1000 XP)
4. VETERAN (2000 XP)
5. ELITE (3500 XP)
6. MASTER (5500 XP)
7. LEGEND (8000 XP)
8. CHAMPION (11000 XP)
9. TITAN (15000 XP)
10. ULTIMATE (20000 XP)

## 🏟️ Arena/Stage System

### Modify Arenas

Edit `ARENA_STAGES` to change arena requirements:

```typescript
{
  id: 5,
  name: 'GOLD ARENA',           // ← Arena name
  description: '21 days...',    // ← Description
  requiredDays: 21,              // ← Days needed (consecutive deficit)
  color: '#ffd700',             // ← Border color
  icon: '👑',                   // ← Emoji icon
  unlockMessage: 'Gold Arena!'  // ← Message when unlocked
}
```

**Arenas are based on:** Consecutive days meeting the calorie deficit goal (default: 500 kcal deficit)

**Add New Arenas:**
Add entries with higher `requiredDays` values.

## 🎯 Daily Goals

### Modify Goal Targets

Edit `DAILY_GOALS` to change what counts as "meeting a goal":

```typescript
{
  type: 'calorie_deficit',
  target: 500,        // ← Change target (500 kcal deficit)
  xpReward: 100,      // ← Change XP reward
  description: 'Maintain 500 kcal deficit'
}
```

**Goal Types:**
- `calorie_deficit` - Net calories (eaten - burnt) must be ≤ -target
- `calorie_burn` - Calories burnt must be ≥ target
- `cardio` - Cardio minutes must be ≥ target
- `strength` - Strength minutes must be ≥ target
- `weight_log` - Just log weight (target = 1)

## 🔥 Streak Configuration

Edit `STREAK_CONFIG`:

```typescript
STREAK_CONFIG = {
  baseBonus: 25,        // Base XP per day in streak
  multiplier: 1.1,      // 10% increase per day
  maxMultiplier: 2.0,    // Cap at 2x
  milestoneDays: [3, 7, 14, 21, 30, 60, 90],  // Streak milestones
  milestoneBonus: 100    // Bonus XP at milestones
}
```

## 💡 Quick Tips

1. **Balance XP**: Make sure harder actions give more XP
2. **Level Progression**: Space levels out exponentially (500, 1000, 2000, 3500...)
3. **Arena Difficulty**: Increase days required exponentially (3, 7, 14, 21, 30...)
4. **Goal Targets**: Set realistic daily goals based on your fitness level
5. **Streaks**: Reward consistency with multipliers and milestones

## 🔧 Example: Adding a New Level

```typescript
{
  level: 11,
  xpRequired: 25000,
  title: 'GOD',
  description: 'Transcendent fitness',
  color: '#ff00ff'
}
```

## 🔧 Example: Adding a New Arena

```typescript
{
  id: 9,
  name: 'MYTHIC ARENA',
  description: '90 days of consistent deficit',
  requiredDays: 90,
  color: '#ff00ff',
  icon: '🌟',
  unlockMessage: 'MYTHIC ARENA ACHIEVED!'
}
```

## 📝 Notes

- All changes take effect immediately after saving
- XP is calculated retroactively from existing data
- Arenas reset if you break your deficit streak
- Level progression is permanent (doesn't reset)

---

**Happy Gamifying! 🎮💪**

