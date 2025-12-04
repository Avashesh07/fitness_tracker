import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, WeightEntry, CalorieEntry, WorkoutEntry } from './api.service';
import { 
  XP_REWARDS, 
  DAILY_GOALS, 
  STREAK_CONFIG,
  REST_DAY_DISCIPLINE_CONFIG,
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

    // Rest Day Discipline bonus XP
    const restDayBonus = this.calculateRestDayDisciplineBonus(calories, workouts);
    if (restDayBonus.xp > 0) {
      breakdown.push({ 
        source: 'Rest Day Discipline', 
        xp: restDayBonus.xp, 
        count: restDayBonus.qualifyingDays 
      });
      totalXP += restDayBonus.xp;
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
   * Uses reduced deficit threshold on rest days (no exercise)
   */
  private calculateStreakBonus(calories: CalorieEntry[], workouts: WorkoutEntry[]): number {
    // Calculate deficit streak
    const sortedCalories = [...calories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Create a map of dates to rest day status
    const restDayMap = new Map<string, boolean>();
    workouts.forEach(w => {
      const dateStr = new Date(w.date).toISOString().split('T')[0];
      const hasCardio = w.cardio === 'true' || w.cardio === true;
      const hasStrength = w.strength === 'true' || w.strength === true;
      const isExplicitRestDay = w.restDay === 'true' || w.restDay === true;
      // Rest day = explicitly marked OR no exercise logged
      restDayMap.set(dateStr, isExplicitRestDay || (!hasCardio && !hasStrength));
    });

    let deficitStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deficitGoal = DAILY_GOALS.find(g => g.type === 'calorie_deficit');
    const normalThreshold = typeof deficitGoal?.target === 'number' ? deficitGoal.target : 500;
    const restDayThreshold = REST_DAY_DISCIPLINE_CONFIG.restDayDeficitThreshold;

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

        const dateStr = entry.date;
        const isRestDay = restDayMap.get(dateStr) ?? true; // Default to rest day if no workout logged
        
        // Use reduced threshold on rest days
        const threshold = isRestDay ? restDayThreshold : normalThreshold;
        
        if (net <= -threshold) {
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
   * Calculate Rest Day Discipline Bonus
   * Awards XP for maintaining calorie deficit on rest days (no exercise)
   * Checks rolling 7-day windows where user has 1-2 rest days with deficit
   */
  private calculateRestDayDisciplineBonus(
    calories: CalorieEntry[], 
    workouts: WorkoutEntry[]
  ): { xp: number; qualifyingDays: number; perfectWeeks: number } {
    if (calories.length === 0) {
      return { xp: 0, qualifyingDays: 0, perfectWeeks: 0 };
    }

    // Create a map of dates to workout status
    // hasExercise = true means cardio or strength was done
    // isRestDay = true means explicitly logged as rest day
    const workoutDates = new Map<string, { hasExercise: boolean; isRestDay: boolean }>();
    workouts.forEach(w => {
      const dateStr = new Date(w.date).toISOString().split('T')[0];
      const hasCardio = w.cardio === 'true' || w.cardio === true;
      const hasStrength = w.strength === 'true' || w.strength === true;
      const isRestDay = w.restDay === 'true' || w.restDay === true;
      workoutDates.set(dateStr, { 
        hasExercise: hasCardio || hasStrength,
        isRestDay: isRestDay
      });
    });

    // Create a map of dates to calorie deficit status
    const calorieDeficitDates = new Map<string, boolean>();
    const deficitGoal = DAILY_GOALS.find(g => g.type === 'calorie_deficit');
    const deficitThreshold = typeof deficitGoal?.target === 'number' ? deficitGoal.target : 500;

    calories.forEach(c => {
      const dateStr = new Date(c.date).toISOString().split('T')[0];
      const eaten = Number(c.caloriesEaten) || 0;
      const burnt = Number(c.caloriesBurnt) || 0;
      const net = eaten - burnt;
      calorieDeficitDates.set(dateStr, net <= -deficitThreshold);
    });

    // Get all unique dates from both calories and workouts
    const allDates = new Set<string>();
    calories.forEach(c => allDates.add(new Date(c.date).toISOString().split('T')[0]));
    workouts.forEach(w => allDates.add(new Date(w.date).toISOString().split('T')[0]));

    // Sort dates
    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length === 0) {
      return { xp: 0, qualifyingDays: 0, perfectWeeks: 0 };
    }

    let totalXP = 0;
    let totalQualifyingDays = 0;
    let perfectWeeks = 0;
    const processedWeeks = new Set<string>();

    // Process each date as a potential end of a 7-day window
    sortedDates.forEach(endDateStr => {
      const endDate = new Date(endDateStr);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - (REST_DAY_DISCIPLINE_CONFIG.rollingWindowDays - 1));
      const startDateStr = startDate.toISOString().split('T')[0];

      // Create a unique key for this week window to avoid double counting
      const weekKey = `${startDateStr}_${endDateStr}`;
      if (processedWeeks.has(weekKey)) {
        return;
      }

      // Get all dates in this 7-day window
      const windowDates: string[] = [];
      for (let i = 0; i < REST_DAY_DISCIPLINE_CONFIG.rollingWindowDays; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        windowDates.push(d.toISOString().split('T')[0]);
      }

      // Count rest days with deficit in this window
      let restDaysWithDeficit = 0;
      let exerciseDays = 0;
      let daysWithData = 0;

      windowDates.forEach(dateStr => {
        const workoutInfo = workoutDates.get(dateStr);
        const hasExercise = workoutInfo?.hasExercise || false;
        const isExplicitRestDay = workoutInfo?.isRestDay || false;
        const hasDeficit = calorieDeficitDates.get(dateStr);

        // Only count days where we have calorie data
        if (hasDeficit !== undefined) {
          daysWithData++;
          if (hasExercise) {
            exerciseDays++;
          } else if (hasDeficit) {
            // Rest day (no exercise OR explicitly logged as rest day) with deficit maintained!
            // Explicit rest days are prioritized
            restDaysWithDeficit++;
          } else if (isExplicitRestDay) {
            // Explicitly logged rest day but no deficit - don't count
          }
        } else if (isExplicitRestDay) {
          // Explicit rest day logged but no calorie data - still counts as a rest day
          daysWithData++;
        }
      });

      // Only process if we have enough data in this window
      if (daysWithData >= 5) { // At least 5 days of data in the week
        // Check if rest days are within the allowed range (1-2)
        if (restDaysWithDeficit >= REST_DAY_DISCIPLINE_CONFIG.minRestDays && 
            restDaysWithDeficit <= REST_DAY_DISCIPLINE_CONFIG.maxRestDays) {
          
          // Mark this week as processed
          processedWeeks.add(weekKey);

          // Award bonus for each qualifying rest day
          const weekXP = restDaysWithDeficit * REST_DAY_DISCIPLINE_CONFIG.baseBonus * 
                         REST_DAY_DISCIPLINE_CONFIG.multiplier;
          
          totalXP += weekXP;
          totalQualifyingDays += restDaysWithDeficit;

          // Check for perfect week (all rest days had deficit)
          const totalRestDays = daysWithData - exerciseDays;
          if (totalRestDays > 0 && restDaysWithDeficit === totalRestDays && 
              totalRestDays <= REST_DAY_DISCIPLINE_CONFIG.maxRestDays) {
            totalXP += REST_DAY_DISCIPLINE_CONFIG.perfectWeekBonus;
            perfectWeeks++;
          }
        }
      }
    });

    return { 
      xp: Math.round(totalXP), 
      qualifyingDays: totalQualifyingDays, 
      perfectWeeks 
    };
  }

  /**
   * Calculate arena information
   * Uses reduced deficit threshold on rest days to maintain streak
   */
  async calculateArenaInfo(): Promise<ArenaInfo> {
    const [calories, workouts] = await Promise.all([
      firstValueFrom(this.apiService.getCalories()).catch(() => []),
      firstValueFrom(this.apiService.getWorkouts()).catch(() => [])
    ]);
    
    // Calculate deficit streak
    const sortedCalories = [...calories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Create a map of dates to rest day status
    const restDayMap = new Map<string, boolean>();
    workouts.forEach(w => {
      const dateStr = new Date(w.date).toISOString().split('T')[0];
      const hasCardio = w.cardio === 'true' || w.cardio === true;
      const hasStrength = w.strength === 'true' || w.strength === true;
      const isExplicitRestDay = w.restDay === 'true' || w.restDay === true;
      // Rest day = explicitly marked OR no exercise logged
      restDayMap.set(dateStr, isExplicitRestDay || (!hasCardio && !hasStrength));
    });

    let deficitStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deficitGoal = DAILY_GOALS.find(g => g.type === 'calorie_deficit');
    const normalThreshold = typeof deficitGoal?.target === 'number' ? deficitGoal.target : 500;
    const restDayThreshold = REST_DAY_DISCIPLINE_CONFIG.restDayDeficitThreshold;

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

        const dateStr = entry.date;
        const isRestDay = restDayMap.get(dateStr) ?? true; // Default to rest day if no workout logged
        
        // Use reduced threshold on rest days
        const threshold = isRestDay ? restDayThreshold : normalThreshold;

        if (net <= -threshold) {
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

