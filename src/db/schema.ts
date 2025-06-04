import { pgTable, uuid, text, timestamp, jsonb, integer, date, boolean, unique, index, numeric, varchar, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { InferSelectModel } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  username: text('username').unique().notNull(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  timezone: text('timezone').default('UTC'),
  notificationPreferences: jsonb('notification_preferences').default({ email: true, push: true }),
  startingWeight: numeric('starting_weight', { precision: 5, scale: 2 }),
  height: numeric('height', { precision: 5, scale: 2 }),
  baselineMeasurements: jsonb('baseline_measurements').default({}),
  baselineDate: timestamp('baseline_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Pairings table
export const pairings = pgTable('pairings', {
  id: uuid('id').primaryKey().defaultRandom(),
  user1Id: uuid('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: uuid('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'active', 'ended'] }).notNull().default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniquePairing: unique().on(table.user1Id, table.user2Id),
  }
})

// Workouts table
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pairingId: uuid('pairing_id').references(() => pairings.id, { onDelete: 'set null' }),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  durationMinutes: integer('duration_minutes'),
  notes: text('notes'),
  exercises: jsonb('exercises').default([]),
  totalVolume: numeric('total_volume', { precision: 10, scale: 2 }),
  workoutType: varchar('workout_type', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdIdx: index('idx_workouts_user_id').on(table.userId),
    pairingIdIdx: index('idx_workouts_pairing_id').on(table.pairingId),
  }
})

// Photos table
export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  photoUrl: text('photo_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    workoutIdIdx: index('idx_photos_workout_id').on(table.workoutId),
  }
})

// Streaks table
export const streaks = pgTable('streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastWorkoutDate: date('last_workout_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').default({}),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdIdx: index('idx_notifications_user_id').on(table.userId),
  }
})

// Competitions table
export const competitions = pgTable('competitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairingId: uuid('pairing_id').notNull().references(() => pairings.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['weekly', 'monthly', 'custom'] }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  winnerId: uuid('winner_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    pairingIdIdx: index('idx_competitions_pairing_id').on(table.pairingId),
  }
})

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  workouts: many(workouts),
  photos: many(photos),
  notifications: many(notifications),
  pairingsAsUser1: many(pairings, { relationName: 'user1Pairings' }),
  pairingsAsUser2: many(pairings, { relationName: 'user2Pairings' }),
  streak: many(streaks),
  wonCompetitions: many(competitions),
  badges: many(userBadges),
  pointsLedger: many(pointsLedger),
  stats: one(userStats),
  challengeParticipations: many(challengeParticipants),
  seasonalCompetitionParticipations: many(seasonalCompetitionParticipants),
  comebackMechanics: many(comebackMechanics),
}))

export const pairingsRelations = relations(pairings, ({ one, many }) => ({
  user1: one(users, {
    fields: [pairings.user1Id],
    references: [users.id],
    relationName: 'user1Pairings',
  }),
  user2: one(users, {
    fields: [pairings.user2Id],
    references: [users.id],
    relationName: 'user2Pairings',
  }),
  workouts: many(workouts),
  competitions: many(competitions),
}))

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  pairing: one(pairings, {
    fields: [workouts.pairingId],
    references: [pairings.id],
  }),
  photos: many(photos),
}))

export const photosRelations = relations(photos, ({ one }) => ({
  workout: one(workouts, {
    fields: [photos.workoutId],
    references: [workouts.id],
  }),
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
}))

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const competitionsRelations = relations(competitions, ({ one }) => ({
  pairing: one(pairings, {
    fields: [competitions.pairingId],
    references: [pairings.id],
  }),
  winner: one(users, {
    fields: [competitions.winnerId],
    references: [users.id],
  }),
}))

// Progress tracking tables
export const progressSnapshots = pgTable('progress_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }),
  bodyFatPercentage: numeric('body_fat_percentage', { precision: 4, scale: 2 }),
  measurements: jsonb('measurements').default({}),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    userDateUnique: uniqueIndex('progress_snapshots_user_date_unique').on(table.userId, table.date),
  }
})

export const exerciseLibrary = pgTable('exercise_library', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseName: varchar('exercise_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }),
  personalRecord: jsonb('personal_record').default({}),
  lastPerformed: date('last_performed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userExerciseUnique: uniqueIndex('exercise_library_user_exercise_unique').on(table.userId, table.exerciseName),
  }
})

// Relations for progress tracking
export const progressSnapshotsRelations = relations(progressSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [progressSnapshots.userId],
    references: [users.id],
  }),
}))

export const exerciseLibraryRelations = relations(exerciseLibrary, ({ one }) => ({
  user: one(users, {
    fields: [exerciseLibrary.userId],
    references: [users.id],
  }),
}))

// Gamification tables

// Badge definitions table
export const badgeDefinitions = pgTable('badge_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').unique().notNull(),
  description: text('description').notNull(),
  category: varchar('category').notNull(),
  icon: varchar('icon').notNull(),
  criteria: jsonb('criteria').notNull(),
  color: varchar('color').notNull(),
  rarity: varchar('rarity').notNull().default('common'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// User badges table
export const userBadges = pgTable('user_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id').notNull().references(() => badgeDefinitions.id),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow(),
  progress: numeric('progress').default('100'),
  metadata: jsonb('metadata').default({}),
}, (table) => {
  return {
    userBadgeUnique: unique().on(table.userId, table.badgeId),
    userIdIdx: index('idx_user_badges_user_id').on(table.userId),
  }
})

// Points ledger table
export const pointsLedger = pgTable('points_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  reason: text('reason').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdIdx: index('idx_points_ledger_user_id').on(table.userId),
    createdAtIdx: index('idx_points_ledger_created_at').on(table.createdAt),
  }
})

// User stats table
export const userStats = pgTable('user_stats', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  totalPoints: integer('total_points').default(0),
  weeklyPoints: integer('weekly_points').default(0),
  monthlyPoints: integer('monthly_points').default(0),
  level: integer('level').default(1),
  consistencyMultiplier: numeric('consistency_multiplier').default('1.0'),
  lastWorkoutPoints: timestamp('last_workout_points', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Challenges table
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  challengeType: text('challenge_type', { 
    enum: ['bodyweight_lift', 'pr_race', 'consistency', 'volume', 'custom'] 
  }).notNull(),
  category: text('category', { 
    enum: ['strength', 'endurance', 'consistency', 'special'] 
  }).notNull(),
  icon: text('icon').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  requirements: jsonb('requirements').notNull(),
  pointsReward: integer('points_reward').notNull().default(100),
  comebackEnabled: boolean('comeback_enabled').default(true),
  maxParticipants: integer('max_participants'),
  createdBy: uuid('created_by'),
  visibility: text('visibility', { 
    enum: ['public', 'buddy_only', 'private'] 
  }).notNull().default('public'),
  status: text('status', { 
    enum: ['upcoming', 'active', 'completed', 'cancelled'] 
  }).notNull().default('upcoming'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    statusIdx: index('idx_challenges_status').on(table.status),
    datesIdx: index('idx_challenges_dates').on(table.startDate, table.endDate),
    categoryIdx: index('idx_challenges_category').on(table.category),
  }
})

// Challenge participants table
export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  progress: jsonb('progress').notNull().default({}),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  rank: integer('rank'),
  pointsEarned: integer('points_earned').default(0),
  comebackBonusApplied: boolean('comeback_bonus_applied').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniqueParticipant: unique().on(table.challengeId, table.userId),
    challengeIdx: index('idx_challenge_participants_challenge').on(table.challengeId),
    userIdx: index('idx_challenge_participants_user').on(table.userId),
    completedIdx: index('idx_challenge_participants_completed').on(table.completedAt),
  }
})

// Seasonal competitions table
export const seasonalCompetitions = pgTable('seasonal_competitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  theme: text('theme').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  scoringRules: jsonb('scoring_rules').notNull(),
  prizes: jsonb('prizes'),
  minParticipants: integer('min_participants').default(2),
  status: text('status', { 
    enum: ['upcoming', 'active', 'completed'] 
  }).notNull().default('upcoming'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    monthYearUnique: unique().on(table.month, table.year),
    statusIdx: index('idx_seasonal_competitions_status').on(table.status),
    datesIdx: index('idx_seasonal_competitions_dates').on(table.startDate, table.endDate),
    monthYearIdx: index('idx_seasonal_competitions_month_year').on(table.month, table.year),
  }
})

// Seasonal competition participants table
export const seasonalCompetitionParticipants = pgTable('seasonal_competition_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  competitionId: uuid('competition_id').notNull().references(() => seasonalCompetitions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pointsEarned: integer('points_earned').default(0),
  rank: integer('rank'),
  comebackMultiplier: numeric('comeback_multiplier').default('1.0'),
  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow(),
  stats: jsonb('stats').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniqueParticipant: unique().on(table.competitionId, table.userId),
    competitionIdx: index('idx_seasonal_participants_competition').on(table.competitionId),
    userIdx: index('idx_seasonal_participants_user').on(table.userId),
    pointsIdx: index('idx_seasonal_participants_points').on(table.pointsEarned),
  }
})

// Comeback mechanics table
export const comebackMechanics = pgTable('comeback_mechanics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  competitionType: text('competition_type', { 
    enum: ['challenge', 'seasonal', 'buddy'] 
  }).notNull(),
  competitionId: uuid('competition_id').notNull(),
  behindByPercentage: numeric('behind_by_percentage').notNull(),
  multiplier: numeric('multiplier').notNull().default('1.0'),
  lastCalculated: timestamp('last_calculated', { withTimezone: true }).defaultNow(),
  bonusActive: boolean('bonus_active').default(false),
  bonusExpiresAt: timestamp('bonus_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniqueUserCompetition: unique().on(table.userId, table.competitionType, table.competitionId),
    userIdx: index('idx_comeback_mechanics_user').on(table.userId),
    activeIdx: index('idx_comeback_mechanics_active').on(table.bonusActive),
    expiresIdx: index('idx_comeback_mechanics_expires').on(table.bonusExpiresAt),
  }
})

// Gamification relations
export const badgeDefinitionsRelations = relations(badgeDefinitions, ({ many }) => ({
  userBadges: many(userBadges),
}))

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badgeDefinitions, {
    fields: [userBadges.badgeId],
    references: [badgeDefinitions.id],
  }),
}))

export const pointsLedgerRelations = relations(pointsLedger, ({ one }) => ({
  user: one(users, {
    fields: [pointsLedger.userId],
    references: [users.id],
  }),
}))

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}))

export const challengesRelations = relations(challenges, ({ many }) => ({
  participants: many(challengeParticipants),
}))

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeParticipants.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [challengeParticipants.userId],
    references: [users.id],
  }),
}))

export const seasonalCompetitionsRelations = relations(seasonalCompetitions, ({ many }) => ({
  participants: many(seasonalCompetitionParticipants),
}))

export const seasonalCompetitionParticipantsRelations = relations(seasonalCompetitionParticipants, ({ one }) => ({
  competition: one(seasonalCompetitions, {
    fields: [seasonalCompetitionParticipants.competitionId],
    references: [seasonalCompetitions.id],
  }),
  user: one(users, {
    fields: [seasonalCompetitionParticipants.userId],
    references: [users.id],
  }),
}))

export const comebackMechanicsRelations = relations(comebackMechanics, ({ one }) => ({
  user: one(users, {
    fields: [comebackMechanics.userId],
    references: [users.id],
  }),
}))

// Type exports
export type User = InferSelectModel<typeof users>;
export type Workout = InferSelectModel<typeof workouts>;
export type ProgressSnapshot = InferSelectModel<typeof progressSnapshots>;
export type ExerciseRecord = InferSelectModel<typeof exerciseLibrary>;
export type BadgeDefinition = InferSelectModel<typeof badgeDefinitions>;
export type UserBadge = InferSelectModel<typeof userBadges>;
export type PointsLedger = InferSelectModel<typeof pointsLedger>;
export type UserStats = InferSelectModel<typeof userStats>;
export type Challenge = InferSelectModel<typeof challenges>;
export type ChallengeParticipant = InferSelectModel<typeof challengeParticipants>;
export type SeasonalCompetition = InferSelectModel<typeof seasonalCompetitions>;
export type SeasonalCompetitionParticipant = InferSelectModel<typeof seasonalCompetitionParticipants>;
export type ComebackMechanic = InferSelectModel<typeof comebackMechanics>;