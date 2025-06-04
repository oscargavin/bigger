import { createClient } from '@supabase/supabase-js'

export interface PointsCalculation {
  basePoints: number;
  consistencyBonus: number;
  progressBonus: number;
  buddyBonus: number;
  comebackMultiplier: number;
  totalPoints: number;
  breakdown: Record<string, number>;
}

export class PointsServiceSupabase {
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
    supabase: any,
    userId: string,
    workoutId: string,
    workoutData: {
      pairingId?: string | null;
      exercises: any[];
      photoCount: number;
    }
  ): Promise<PointsCalculation> {
    // Get user's current streak
    const { data: userStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    const currentStreak = userStreak?.current_streak || 0
    
    // Calculate base points
    let basePoints = this.BASE_WORKOUT_POINTS
    const breakdown: Record<string, number> = {
      base: basePoints,
    }
    
    // Add buddy workout bonus
    if (workoutData.pairingId) {
      basePoints += this.BUDDY_WORKOUT_BONUS
      breakdown.buddyWorkout = this.BUDDY_WORKOUT_BONUS
    }
    
    // Add photo upload bonus
    if (workoutData.photoCount > 0) {
      const photoBonus = this.PHOTO_UPLOAD_BONUS * workoutData.photoCount
      basePoints += photoBonus
      breakdown.photoUpload = photoBonus
    }
    
    // Calculate progress bonus (PRs)
    let progressBonus = 0
    const prCount = await this.checkAndUpdatePRs(supabase, userId, workoutData.exercises)
    if (prCount > 0) {
      progressBonus = prCount * this.PR_BONUS_POINTS
      breakdown.personalRecords = progressBonus
    }
    
    // Calculate consistency multiplier
    let consistencyMultiplier = 1.0
    for (const [days, multiplier] of Object.entries(this.CONSISTENCY_MULTIPLIERS)) {
      if (currentStreak >= parseInt(days)) {
        consistencyMultiplier = multiplier
      }
    }
    
    const consistencyBonus = Math.round(basePoints * (consistencyMultiplier - 1))
    if (consistencyBonus > 0) {
      breakdown.consistencyBonus = consistencyBonus
    }
    
    // Check for comeback mechanics
    const comebackMultiplier = await this.getActiveMultiplier(supabase, userId)
    
    // Calculate total points
    const subtotal = basePoints + progressBonus + consistencyBonus
    const totalPoints = Math.round(subtotal * comebackMultiplier)
    
    if (comebackMultiplier > 1) {
      breakdown.comebackBonus = totalPoints - subtotal
    }
    
    return {
      basePoints,
      consistencyBonus,
      progressBonus,
      buddyBonus: workoutData.pairingId ? this.BUDDY_WORKOUT_BONUS : 0,
      comebackMultiplier,
      totalPoints,
      breakdown,
    }
  }
  
  // Award points to a user
  static async awardPoints(
    supabase: any,
    userId: string,
    points: number,
    reason: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Add to points ledger
    const { error: ledgerError } = await supabase
      .from('points_ledger')
      .insert({
        user_id: userId,
        points,
        reason,
        metadata,
      })
    
    if (ledgerError) throw ledgerError
    
    // Get current user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!stats) {
      // Create initial stats
      const { error } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_points: points,
          weekly_points: points,
          monthly_points: points,
          level: 1,
          last_workout_points: new Date().toISOString(),
        })
      if (error) throw error
    } else {
      // Update existing stats
      const newTotalPoints = (stats.total_points || 0) + points
      const newLevel = this.calculateLevel(newTotalPoints)
      
      const { error } = await supabase
        .from('user_stats')
        .update({
          total_points: newTotalPoints,
          weekly_points: (stats.weekly_points || 0) + points,
          monthly_points: (stats.monthly_points || 0) + points,
          level: newLevel,
          last_workout_points: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
      
      if (error) throw error
    }
  }
  
  // Check and update personal records
  private static async checkAndUpdatePRs(
    supabase: any,
    userId: string,
    exercises: any[]
  ): Promise<number> {
    let prCount = 0
    
    for (const exercise of exercises) {
      if (!exercise.name || !exercise.sets || exercise.sets.length === 0) continue
      
      // Find the best set (highest weight × reps)
      let bestVolume = 0
      let bestSet: any = null
      
      for (const set of exercise.sets) {
        const volume = (set.weight || 0) * (set.reps || 0)
        if (volume > bestVolume) {
          bestVolume = volume
          bestSet = set
        }
      }
      
      if (!bestSet) continue
      
      // Check if this is a PR
      const { data: existingPR } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exercise.name)
        .single()
      
      const currentPR = existingPR?.personal_record
      const isNewPR = !currentPR || 
        bestSet.weight > (currentPR.weight || 0) ||
        (bestSet.weight === currentPR.weight && bestSet.reps > (currentPR.reps || 0))
      
      if (isNewPR) {
        prCount++
        
        if (existingPR) {
          await supabase
            .from('exercise_library')
            .update({
              personal_record: bestSet,
              last_performed: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPR.id)
        } else {
          await supabase
            .from('exercise_library')
            .insert({
              user_id: userId,
              exercise_name: exercise.name,
              category: exercise.category || 'other',
              personal_record: bestSet,
              last_performed: new Date().toISOString().split('T')[0],
            })
        }
      }
    }
    
    return prCount
  }
  
  // Get active comeback multiplier
  private static async getActiveMultiplier(supabase: any, userId: string): Promise<number> {
    const { data: activeMechanics } = await supabase
      .from('comeback_mechanics')
      .select('*')
      .eq('user_id', userId)
      .eq('bonus_active', true)
      .gte('bonus_expires_at', new Date().toISOString())
    
    if (!activeMechanics || activeMechanics.length === 0) return 1.0
    
    // Return the highest active multiplier
    return activeMechanics.reduce((max: number, mechanic: any) => {
      const multiplier = parseFloat(mechanic.multiplier)
      return multiplier > max ? multiplier : max
    }, 1.0)
  }
  
  // Calculate user level based on total points
  private static calculateLevel(totalPoints: number): number {
    // Level progression: each level requires more points
    // Level 1: 0-99 points
    // Level 2: 100-299 points
    // Level 3: 300-599 points
    // Level 4: 600-999 points
    // etc.
    
    if (totalPoints < 100) return 1
    if (totalPoints < 300) return 2
    if (totalPoints < 600) return 3
    if (totalPoints < 1000) return 4
    if (totalPoints < 1500) return 5
    if (totalPoints < 2100) return 6
    if (totalPoints < 2800) return 7
    if (totalPoints < 3600) return 8
    if (totalPoints < 4500) return 9
    if (totalPoints < 5500) return 10
    
    // After level 10, each level requires 1000 more points
    return 10 + Math.floor((totalPoints - 5500) / 1000)
  }
}