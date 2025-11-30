/**
 * FEBRUARY GOAL - Game Configuration
 * 
 * This file contains all game mechanics, XP rewards, level thresholds, and arena definitions.
 * Modify these values to adjust game balance and progression.
 */

export interface XPReward {
  action: string;
  description: string;
  baseXP: number;
  multiplier?: number; // Optional multiplier for streaks/bonuses
}

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
  description: string;
  color: string; // Hex color for level badge
}

export interface ArenaStage {
  id: number;
  name: string;
  description: string;
  requiredDays: number; // Consecutive days with calorie deficit goal met
  color: string;
  icon: string;
  unlockMessage: string;
}

export interface DailyGoal {
  type: 'calorie_deficit' | 'calorie_burn' | 'cardio' | 'strength' | 'weight_log';
  target: number | boolean; // Can be a numeric threshold or boolean (just completion)
  xpReward: number;
  description: string;
}

/**
 * XP REWARDS CONFIGURATION
 * Base XP awarded for each action
 */
export const XP_REWARDS: XPReward[] = [
  {
    action: 'weight_log',
    description: 'Log daily weight',
    baseXP: 50
  },
  {
    action: 'calorie_log',
    description: 'Log calories (eaten or burnt)',
    baseXP: 25
  },
  {
    action: 'workout_cardio',
    description: 'Complete cardio session',
    baseXP: 75,
    multiplier: 1.2 // 20% bonus for consecutive days
  },
  {
    action: 'workout_strength',
    description: 'Complete strength training',
    baseXP: 75,
    multiplier: 1.2
  },
  {
    action: 'workout_both',
    description: 'Complete both cardio and strength',
    baseXP: 150, // Bonus for doing both
    multiplier: 1.3
  },
  {
    action: 'calorie_deficit_goal',
    description: 'Meet daily calorie deficit goal',
    baseXP: 100
  },
  {
    action: 'calorie_burn_goal',
    description: 'Meet daily calorie burn goal',
    baseXP: 80
  },
  {
    action: 'cardio_duration_goal',
    description: 'Meet cardio duration goal',
    baseXP: 60
  },
  {
    action: 'strength_duration_goal',
    description: 'Meet strength duration goal',
    baseXP: 60
  },
  {
    action: 'streak_bonus',
    description: 'Consecutive day bonus',
    baseXP: 25, // Per day in streak
    multiplier: 1.1 // Increases with streak length
  }
];

/**
 * LEVEL PROGRESSION CONFIGURATION
 * XP thresholds for each level
 */
export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0, title: 'ROOKIE', description: 'Just starting out', color: '#808080' },
  { level: 2, xpRequired: 500, title: 'TRAINEE', description: 'Learning the ropes', color: '#9d4edd' },
  { level: 3, xpRequired: 1000, title: 'OPERATOR', description: 'Getting serious', color: '#00a8ff' },
  { level: 4, xpRequired: 2000, title: 'VETERAN', description: 'Proven dedication', color: '#00ff6a' },
  { level: 5, xpRequired: 3500, title: 'ELITE', description: 'Top performer', color: '#ff6a00' },
  { level: 6, xpRequired: 5500, title: 'MASTER', description: 'Fitness master', color: '#ffd700' },
  { level: 7, xpRequired: 8000, title: 'LEGEND', description: 'Legendary status', color: '#ff2d2d' },
  { level: 8, xpRequired: 11000, title: 'CHAMPION', description: 'Champion level', color: '#ff00ff' },
  { level: 9, xpRequired: 15000, title: 'TITAN', description: 'Titan of fitness', color: '#00ffff' },
  { level: 10, xpRequired: 20000, title: 'ULTIMATE', description: 'Ultimate warrior', color: '#ffffff' },
];

/**
 * ARENA/STAGE CONFIGURATION
 * Based on consecutive days meeting calorie deficit goal
 */
export const ARENA_STAGES: ArenaStage[] = [
  {
    id: 1,
    name: 'TRAINING GROUNDS',
    description: 'Beginner arena - Start your journey',
    requiredDays: 0,
    color: '#808080',
    icon: '🏋️',
    unlockMessage: 'Welcome to the Training Grounds!'
  },
  {
    id: 2,
    name: 'IRON ARENA',
    description: '3 days of consistent deficit',
    requiredDays: 3,
    color: '#4a5568',
    icon: '⚔️',
    unlockMessage: 'You\'ve entered the Iron Arena!'
  },
  {
    id: 3,
    name: 'BRONZE ARENA',
    description: '7 days of consistent deficit',
    requiredDays: 7,
    color: '#cd7f32',
    icon: '🛡️',
    unlockMessage: 'Bronze Arena unlocked!'
  },
  {
    id: 4,
    name: 'SILVER ARENA',
    description: '14 days of consistent deficit',
    requiredDays: 14,
    color: '#c0c0c0',
    icon: '⚡',
    unlockMessage: 'Silver Arena achieved!'
  },
  {
    id: 5,
    name: 'GOLD ARENA',
    description: '21 days of consistent deficit',
    requiredDays: 21,
    color: '#ffd700',
    icon: '👑',
    unlockMessage: 'Gold Arena conquered!'
  },
  {
    id: 6,
    name: 'PLATINUM ARENA',
    description: '30 days of consistent deficit',
    requiredDays: 30,
    color: '#e5e4e2',
    icon: '💎',
    unlockMessage: 'Platinum Arena mastered!'
  },
  {
    id: 7,
    name: 'DIAMOND ARENA',
    description: '45 days of consistent deficit',
    requiredDays: 45,
    color: '#00ffff',
    icon: '✨',
    unlockMessage: 'Diamond Arena reached!'
  },
  {
    id: 8,
    name: 'LEGENDARY ARENA',
    description: '60 days of consistent deficit',
    requiredDays: 60,
    color: '#ff2d2d',
    icon: '🔥',
    unlockMessage: 'LEGENDARY ARENA UNLOCKED!'
  }
];

/**
 * DAILY GOALS CONFIGURATION
 * Goals that award XP when met
 */
export const DAILY_GOALS: DailyGoal[] = [
  {
    type: 'calorie_deficit',
    target: 500, // 500 kcal deficit
    xpReward: 100,
    description: 'Maintain 500 kcal deficit'
  },
  {
    type: 'calorie_burn',
    target: 3500, // Burn 3500+ kcal
    xpReward: 80,
    description: 'Burn 500+ calories'
  },
  {
    type: 'cardio',
    target: 60, // 60 minutes cardio
    xpReward: 60,
    description: '60+ minutes cardio'
  },
  {
    type: 'strength',
    target: true, // Boolean - just complete strength training (any duration)
    xpReward: 60,
    description: 'Complete strength training'
  },
  {
    type: 'weight_log',
    target: 1, // Just log weight
    xpReward: 50,
    description: 'Log your weight'
  }
];

/**
 * STREAK CONFIGURATION
 */
export const STREAK_CONFIG = {
  baseBonus: 25, // Base XP per day in streak
  multiplier: 1.1, // 10% increase per day
  maxMultiplier: 2.0, // Cap at 2x
  milestoneDays: [3, 7, 14, 21, 30, 60, 90], // Streak milestones
  milestoneBonus: 100 // Bonus XP at milestones
};

/**
 * CALCULATE LEVEL FROM TOTAL XP
 */
export function calculateLevel(totalXP: number): LevelThreshold {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xpRequired) {
      return LEVEL_THRESHOLDS[i];
    }
  }
  return LEVEL_THRESHOLDS[0];
}

/**
 * CALCULATE XP PROGRESS TO NEXT LEVEL
 */
export function getXPProgress(currentXP: number, currentLevel: LevelThreshold): {
  current: number;
  next: number;
  progress: number;
  xpNeeded: number;
} {
  const nextLevelIndex = LEVEL_THRESHOLDS.findIndex(l => l.level === currentLevel.level + 1);
  
  if (nextLevelIndex === -1) {
    // Max level reached
    return {
      current: currentXP,
      next: currentXP,
      progress: 100,
      xpNeeded: 0
    };
  }

  const nextLevel = LEVEL_THRESHOLDS[nextLevelIndex];
  const xpInCurrentLevel = currentXP - currentLevel.xpRequired;
  const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired;
  const progress = (xpInCurrentLevel / xpNeededForNext) * 100;

  return {
    current: xpInCurrentLevel,
    next: xpNeededForNext,
    progress: Math.min(progress, 100),
    xpNeeded: nextLevel.xpRequired - currentXP
  };
}

/**
 * CALCULATE ARENA FROM DEFICIT STREAK
 */
export function calculateArena(deficitStreakDays: number): ArenaStage {
  for (let i = ARENA_STAGES.length - 1; i >= 0; i--) {
    if (deficitStreakDays >= ARENA_STAGES[i].requiredDays) {
      return ARENA_STAGES[i];
    }
  }
  return ARENA_STAGES[0];
}

/**
 * GET NEXT ARENA INFO
 */
export function getNextArena(currentArena: ArenaStage): ArenaStage | null {
  const nextIndex = ARENA_STAGES.findIndex(a => a.id === currentArena.id + 1);
  return nextIndex >= 0 ? ARENA_STAGES[nextIndex] : null;
}

