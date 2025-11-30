import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, WeightEntry, CalorieEntry, WorkoutEntry } from './api.service';
import { 
  XP_REWARDS, 
  DAILY_GOALS, 
  STREAK_CONFIG,
  calculateLevel,
  calculateArena,
  getXPProgress,
  getNextArena,
  LevelThreshold,
  ArenaStage
} from '../config/game-config';

export interface XPBreakdown {
  totalXP: number;
  level: LevelThreshold;
  xpProgress: {
    current: number;
    next: number;
    progress: number;
    xpNeeded: number;
  };
  breakdown: {
    source: string;
    xp: number;
    count: number;
  }[];
}

export interface ArenaInfo {
  current: ArenaStage;
  next: ArenaStage | null;
  deficitStreak: number;
  daysUntilNext: number;
}

@Injectable({
  providedIn: 'root'
})
export class XPService {
  constructor(private apiService: ApiService) {}

  /**
   * Calculate total XP from all tracked data
   */
  async calculateTotalXP(): Promise<XPBreakdown> {
    const [weights, calories, workouts] = await Promise.all([
      firstValueFrom(this.apiService.getWeights()).catch(() => []),
      firstValueFrom(this.apiService.getCalories()).catch(() => []),
      firstValueFrom(this.apiService.getWorkouts()).catch(() => [])
    ]);

    const breakdown: { source: string; xp: number; count: number }[] = [];
    let totalXP = 0;

    // Weight logging XP
    const weightXP = weights.length * XP_REWARDS.find(r => r.action === 'weight_log')!.baseXP;
    if (weightXP > 0) {
      breakdown.push({ source: 'Weight Logging', xp: weightXP, count: weights.length });
      totalXP += weightXP;
    }

    // Calorie logging XP
    const calorieXP = calories.length * XP_REWARDS.find(r => r.action === 'calorie_log')!.baseXP;
    if (calorieXP > 0) {
      breakdown.push({ source: 'Calorie Logging', xp: calorieXP, count: calories.length });
      totalXP += calorieXP;
    }

    // Workout XP
    let cardioCount = 0;
    let strengthCount = 0;
    let bothCount = 0;

    workouts.forEach(w => {
      const hasCardio = w.cardio === 'true' || w.cardio === true;
      const hasStrength = w.strength === 'true' || w.strength === true;
      
      if (hasCardio && hasStrength) {
        bothCount++;
      } else if (hasCardio) {
        cardioCount++;
      } else if (hasStrength) {
        strengthCount++;
      }
    });

    const cardioXP = cardioCount * XP_REWARDS.find(r => r.action === 'workout_cardio')!.baseXP;
    const strengthXP = strengthCount * XP_REWARDS.find(r => r.action === 'workout_strength')!.baseXP;
    const bothXP = bothCount * XP_REWARDS.find(r => r.action === 'workout_both')!.baseXP;

    if (cardioXP > 0) {
      breakdown.push({ source: 'Cardio Sessions', xp: cardioXP, count: cardioCount });
      totalXP += cardioXP;
    }
    if (strengthXP > 0) {
      breakdown.push({ source: 'Strength Sessions', xp: strengthXP, count: strengthCount });
      totalXP += strengthXP;
    }
    if (bothXP > 0) {
      breakdown.push({ source: 'Dual Workouts', xp: bothXP, count: bothCount });
      totalXP += bothXP;
    }

    // Daily goals XP
    const goalsXP = this.calculateDailyGoalsXP(calories, workouts, weights);
    if (goalsXP > 0) {
      breakdown.push({ source: 'Daily Goals', xp: goalsXP, count: 0 });
      totalXP += goalsXP;
    }

    // Streak bonus XP
    const streakXP = this.calculateStreakBonus(calories, workouts);
    if (streakXP > 0) {
      breakdown.push({ source: 'Streak Bonuses', xp: streakXP, count: 0 });
      totalXP += streakXP;
    }

    const level = calculateLevel(totalXP);
    const xpProgress = getXPProgress(totalXP, level);

    return {
      totalXP,
      level,
      xpProgress,
      breakdown
    };
  }

  /**
   * Calculate XP from daily goals
   */
  private calculateDailyGoalsXP(
    calories: CalorieEntry[],
    workouts: WorkoutEntry[],
    weights: WeightEntry[]
  ): number {
    let goalsXP = 0;

    calories.forEach(c => {
      const eaten = Number(c.caloriesEaten) || 0;
      const burnt = Number(c.caloriesBurnt) || 0;
      const net = eaten - burnt;

      // Calorie deficit goal
      const deficitGoal = DAILY_GOALS.find(g => g.type === 'calorie_deficit');
      if (deficitGoal) {
        if (typeof deficitGoal.target === 'boolean') {
          // Boolean target - just check if there's any deficit
          if (deficitGoal.target && net < 0) {
            goalsXP += deficitGoal.xpReward;
          }
        } else {
          // Numeric target - check threshold
          if (net <= -deficitGoal.target) {
            goalsXP += deficitGoal.xpReward;
          }
        }
      }

      // Calorie burn goal
      const burnGoal = DAILY_GOALS.find(g => g.type === 'calorie_burn');
      if (burnGoal) {
        if (typeof burnGoal.target === 'boolean') {
          // Boolean target - just check if calories were burnt
          if (burnGoal.target && burnt > 0) {
            goalsXP += burnGoal.xpReward;
          }
        } else {
          // Numeric target - check threshold
          if (burnt >= burnGoal.target) {
            goalsXP += burnGoal.xpReward;
          }
        }
      }
    });

    workouts.forEach(w => {
      const cardioMinutes = Number(w.cardioMinutes) || 0;
      const strengthMinutes = Number(w.strengthMinutes) || 0;

      // Cardio duration goal
      const cardioGoal = DAILY_GOALS.find(g => g.type === 'cardio');
      if (cardioGoal) {
        if (typeof cardioGoal.target === 'boolean') {
          // Boolean target - just check if cardio was done
          if (cardioGoal.target && cardioMinutes > 0) {
            goalsXP += cardioGoal.xpReward;
          }
        } else {
          // Numeric target - check duration threshold
          if (cardioMinutes >= cardioGoal.target) {
            goalsXP += cardioGoal.xpReward;
          }
        }
      }

      // Strength goal (can be boolean or numeric)
      const strengthGoal = DAILY_GOALS.find(g => g.type === 'strength');
      if (strengthGoal) {
        const hasStrength = w.strength === 'true' || w.strength === true;
        if (typeof strengthGoal.target === 'boolean') {
          // Boolean target - just check if strength was done (any duration)
          if (strengthGoal.target && hasStrength) {
            goalsXP += strengthGoal.xpReward;
          }
        } else {
          // Numeric target - check duration threshold
          if (strengthMinutes >= strengthGoal.target) {
            goalsXP += strengthGoal.xpReward;
          }
        }
      }
    });

    // Weight logging goal (already counted in base XP, but can add bonus)
    // This is handled separately

    return goalsXP;
  }

  /**
   * Calculate streak bonus XP
   */
  private calculateStreakBonus(calories: CalorieEntry[], workouts: WorkoutEntry[]): number {
    // Calculate deficit streak
    const sortedCalories = [...calories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let deficitStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = sortedCalories.length - 1; i >= 0; i--) {
      const entry = sortedCalories[i];
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - (sortedCalories.length - 1 - i));

      if (entryDate.getTime() === expectedDate.getTime()) {
        const eaten = Number(entry.caloriesEaten) || 0;
        const burnt = Number(entry.caloriesBurnt) || 0;
        const net = eaten - burnt;

        const deficitGoal = DAILY_GOALS.find(g => g.type === 'calorie_deficit');
        if (deficitGoal && net <= -deficitGoal.target) {
          deficitStreak++;
        } else {
          break; // Streak broken
        }
      } else {
        break; // Gap in dates
      }
    }

    // Calculate streak bonus
    let streakXP = 0;
    if (deficitStreak > 0) {
      const multiplier = Math.min(
        1 + (deficitStreak - 1) * (STREAK_CONFIG.multiplier - 1),
        STREAK_CONFIG.maxMultiplier
      );
      streakXP = deficitStreak * STREAK_CONFIG.baseBonus * multiplier;

      // Milestone bonuses
      STREAK_CONFIG.milestoneDays.forEach(milestone => {
        if (deficitStreak >= milestone) {
          streakXP += STREAK_CONFIG.milestoneBonus;
        }
      });
    }

    return Math.round(streakXP);
  }

  /**
   * Calculate arena information
   */
  async calculateArenaInfo(): Promise<ArenaInfo> {
    const calories = await firstValueFrom(this.apiService.getCalories()).catch(() => []);
    
    // Calculate deficit streak
    const sortedCalories = [...calories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let deficitStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deficitGoal = DAILY_GOALS.find(g => g.type === 'calorie_deficit');

    for (let i = sortedCalories.length - 1; i >= 0; i--) {
      const entry = sortedCalories[i];
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - (sortedCalories.length - 1 - i));

      if (entryDate.getTime() === expectedDate.getTime()) {
        const eaten = Number(entry.caloriesEaten) || 0;
        const burnt = Number(entry.caloriesBurnt) || 0;
        const net = eaten - burnt;

        if (deficitGoal && net <= -deficitGoal.target) {
          deficitStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    const currentArena = calculateArena(deficitStreak);
    const nextArena = getNextArena(currentArena);
    const daysUntilNext = nextArena ? Math.max(0, nextArena.requiredDays - deficitStreak) : 0;

    return {
      current: currentArena,
      next: nextArena,
      deficitStreak,
      daysUntilNext
    };
  }
}

