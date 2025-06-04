import { db } from "@/db";
import { 
  pointsLedger, 
  userStats, 
  users, 
  workouts, 
  streaks,
  exerciseLibrary,
  comebackMechanics 
} from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export interface PointsCalculation {
  basePoints: number;
  consistencyBonus: number;
  progressBonus: number;
  buddyBonus: number;
  comebackMultiplier: number;
  totalPoints: number;
  breakdown: Record<string, number>;
}

export class PointsService {
  // Base points for different activities
  private static readonly BASE_WORKOUT_POINTS = 10;
  private static readonly PR_BONUS_POINTS = 25;
  private static readonly BUDDY_WORKOUT_BONUS = 15;
  private static readonly PHOTO_UPLOAD_BONUS = 5;
  
  // Consistency multipliers
  private static readonly CONSISTENCY_MULTIPLIERS = {
    7: 1.1,    // 7 day streak
    14: 1.25,  // 14 day streak
    30: 1.5,   // 30 day streak
    60: 1.75,  // 60 day streak
    100: 2.0,  // 100 day streak
    365: 3.0   // 365 day streak
  };

  // Calculate points for a workout
  static async calculateWorkoutPoints(
    userId: string,
    workoutId: string,
    workoutData: {
      pairingId?: string | null;
      exercises: any[];
      photoCount: number;
    }
  ): Promise<PointsCalculation> {
    // Get user's current streak
    const userStreak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });
    
    const currentStreak = userStreak?.currentStreak || 0;
    
    // Calculate base points
    let basePoints = this.BASE_WORKOUT_POINTS;
    const breakdown: Record<string, number> = {
      base: basePoints,
    };
    
    // Add buddy workout bonus
    if (workoutData.pairingId) {
      basePoints += this.BUDDY_WORKOUT_BONUS;
      breakdown.buddyWorkout = this.BUDDY_WORKOUT_BONUS;
    }
    
    // Add photo upload bonus
    if (workoutData.photoCount > 0) {
      const photoBonus = this.PHOTO_UPLOAD_BONUS * workoutData.photoCount;
      basePoints += photoBonus;
      breakdown.photoUpload = photoBonus;
    }
    
    // Calculate progress bonus (PRs)
    let progressBonus = 0;
    const prCount = await this.checkAndUpdatePRs(userId, workoutData.exercises);
    if (prCount > 0) {
      progressBonus = prCount * this.PR_BONUS_POINTS;
      breakdown.personalRecords = progressBonus;
    }
    
    // Calculate consistency multiplier
    let consistencyMultiplier = 1.0;
    for (const [days, multiplier] of Object.entries(this.CONSISTENCY_MULTIPLIERS)) {
      if (currentStreak >= parseInt(days)) {
        consistencyMultiplier = multiplier;
      }
    }
    
    const consistencyBonus = Math.round(basePoints * (consistencyMultiplier - 1));
    if (consistencyBonus > 0) {
      breakdown.consistencyBonus = consistencyBonus;
    }
    
    // Check for comeback mechanics
    const comebackMultiplier = await this.getActiveMultiplier(userId);
    
    // Calculate total points
    const subtotal = basePoints + progressBonus + consistencyBonus;
    const totalPoints = Math.round(subtotal * comebackMultiplier);
    
    if (comebackMultiplier > 1) {
      breakdown.comebackBonus = totalPoints - subtotal;
    }
    
    return {
      basePoints,
      consistencyBonus,
      progressBonus,
      buddyBonus: workoutData.pairingId ? this.BUDDY_WORKOUT_BONUS : 0,
      comebackMultiplier,
      totalPoints,
      breakdown,
    };
  }
  
  // Award points to a user
  static async awardPoints(
    userId: string,
    points: number,
    reason: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Add to points ledger
      await tx.insert(pointsLedger).values({
        userId,
        points,
        reason,
        metadata,
      });
      
      // Update user stats
      const stats = await tx.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
      });
      
      if (!stats) {
        // Create initial stats
        await tx.insert(userStats).values({
          userId,
          totalPoints: points,
          weeklyPoints: points,
          monthlyPoints: points,
          level: 1,
          lastWorkoutPoints: new Date(),
        });
      } else {
        // Update existing stats
        const newTotalPoints = (stats.totalPoints || 0) + points;
        const newLevel = this.calculateLevel(newTotalPoints);
        
        await tx
          .update(userStats)
          .set({
            totalPoints: newTotalPoints,
            weeklyPoints: sql`${userStats.weeklyPoints} + ${points}`,
            monthlyPoints: sql`${userStats.monthlyPoints} + ${points}`,
            level: newLevel,
            lastWorkoutPoints: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, userId));
      }
    });
  }
  
  // Check and update personal records
  private static async checkAndUpdatePRs(
    userId: string,
    exercises: any[]
  ): Promise<number> {
    let prCount = 0;
    
    for (const exercise of exercises) {
      if (!exercise.name || !exercise.sets || exercise.sets.length === 0) continue;
      
      // Find the best set (highest weight × reps)
      let bestVolume = 0;
      let bestSet: any = null;
      
      for (const set of exercise.sets) {
        const volume = (set.weight || 0) * (set.reps || 0);
        if (volume > bestVolume) {
          bestVolume = volume;
          bestSet = set;
        }
      }
      
      if (!bestSet) continue;
      
      // Check if this is a PR
      const existingPR = await db.query.exerciseLibrary.findFirst({
        where: and(
          eq(exerciseLibrary.userId, userId),
          eq(exerciseLibrary.exerciseName, exercise.name)
        ),
      });
      
      const currentPR = existingPR?.personalRecord as any;
      const isNewPR = !currentPR || 
        bestSet.weight > (currentPR.weight || 0) ||
        (bestSet.weight === currentPR.weight && bestSet.reps > (currentPR.reps || 0));
      
      if (isNewPR) {
        prCount++;
        
        if (existingPR) {
          await db
            .update(exerciseLibrary)
            .set({
              personalRecord: bestSet,
              lastPerformed: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(exerciseLibrary.id, existingPR.id));
        } else {
          await db.insert(exerciseLibrary).values({
            userId,
            exerciseName: exercise.name,
            category: exercise.category || 'other',
            personalRecord: bestSet,
            lastPerformed: new Date(),
          });
        }
      }
    }
    
    return prCount;
  }
  
  // Get active comeback multiplier
  private static async getActiveMultiplier(userId: string): Promise<number> {
    const activeMechanics = await db.query.comebackMechanics.findMany({
      where: and(
        eq(comebackMechanics.userId, userId),
        eq(comebackMechanics.bonusActive, true),
        gte(comebackMechanics.bonusExpiresAt, new Date())
      ),
    });
    
    // Return the highest active multiplier
    return activeMechanics.reduce((max, mechanic) => {
      const multiplier = parseFloat(mechanic.multiplier.toString());
      return multiplier > max ? multiplier : max;
    }, 1.0);
  }
  
  // Calculate user level based on total points
  private static calculateLevel(totalPoints: number): number {
    // Level progression: each level requires more points
    // Level 1: 0-99 points
    // Level 2: 100-299 points
    // Level 3: 300-599 points
    // Level 4: 600-999 points
    // etc.
    
    if (totalPoints < 100) return 1;
    if (totalPoints < 300) return 2;
    if (totalPoints < 600) return 3;
    if (totalPoints < 1000) return 4;
    if (totalPoints < 1500) return 5;
    if (totalPoints < 2100) return 6;
    if (totalPoints < 2800) return 7;
    if (totalPoints < 3600) return 8;
    if (totalPoints < 4500) return 9;
    if (totalPoints < 5500) return 10;
    
    // After level 10, each level requires 1000 more points
    return 10 + Math.floor((totalPoints - 5500) / 1000);
  }
  
  // Reset weekly points (called by cron job)
  static async resetWeeklyPoints(): Promise<void> {
    await db
      .update(userStats)
      .set({
        weeklyPoints: 0,
        updatedAt: new Date(),
      });
  }
  
  // Reset monthly points (called by cron job)
  static async resetMonthlyPoints(): Promise<void> {
    await db
      .update(userStats)
      .set({
        monthlyPoints: 0,
        updatedAt: new Date(),
      });
  }
}