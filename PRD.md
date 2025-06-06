# Gym Buddy Accountability App - Development Roadmap

## High Priority → Low Priority Feature Todo List

### 🚀 **PHASE 1: Core Foundation (Week 1-2)**

_Get the basic habit loop working_

**P1 - Project Setup**

- [x] Initialize Next.js 15.3.3 project with TypeScript
- [x] Set up Tailwind CSS configuration
- [x] Set up Drizzle ORM with Supabase connection
- [ ] Deploy basic skeleton to Vercel
- [x] Use Shadcn
- [x] Use custom css variables for easy use (e.g. bg-card)
- [x] Fix authentication security (use getUser() instead of getSession())

**P1 - Authentication & Pairing**

- [x] Implement Supabase auth (email/password)
- [x] Fix user signup profile creation (use service role for RLS bypass)
- [x] Create partnership invitation system (unique codes)
- [x] Build user profile setup (name, starting weight/measurements)
- [x] Partnership dashboard showing both users

**P1 - Basic Workout Logging**

- [x] Simple workout entry form (date, exercises, reps, weight)
- [x] Photo upload for workout proof (Supabase storage)
- [x] Basic workout history list view
- [x] Delete/edit workout entries
- [x] Speech-to-text for workout notes (OpenAI Whisper API)

### 🎯 **PHASE 2: Competition & Streaks (Week 3-4)**

_Make it addictive through competition_

**P2 - Streak System**

- [x] Daily workout streak tracking
- [x] Streak visualization (calendar view)
- [x] Streak break detection and reset
- [x] Best streak records

**P2 - Head-to-Head Dashboard**

- [x] Side-by-side current streak comparison
- [x] Weekly workout count comparison
- [x] Simple leaderboard (who's ahead this week/month)
- [x] Real-time updates when partner logs workout

**P2 - Basic Notifications**

- [x] Push notifications when partner works out (toast notifications)
- [x] Daily reminder notifications
- [x] Streak milestone celebrations
- [x] Simple "your partner is ahead" alerts

### 📊 **PHASE 3: Progress Tracking (Week 5-6)**

_Relative progress system for different body types_

**P3 - Relative Progress System**

- [x] Percentage-based progress calculations (% improvement from baseline)
- [x] Weight progression charts (relative to starting weight)
- [x] Strength progression tracking (% increase in lifts) - ExerciseInput component integrated
- [x] Side-by-side progress comparison (both normalized) - PhotoComparison component with comparison mode

**P3 - Progress Visualization**

- [x] Progress photo comparison (before/current)
- [x] Interactive charts showing improvement curves
- [x] Achievement badges for milestones (10% stronger, etc.)
- [x] Progress summary reports

### 🤖 **PHASE 4: AI-Enhanced Features (Week 7-8)**

_Smart shame and motivation_

**P4 - AI Shame Engine (Anthropic API)**

- [x] Dynamic trash talk generation based on performance gaps
- [x] Personalized motivational messages using workout history
- [x] AI-generated shame messages when streaks break
- [x] Context-aware encouragement/roasting
- [x] Edge case handling for users with no workout history

**P4 - Smart Insights**

- [x] AI analysis of workout patterns and suggestions
- [x] Automated progress summaries
- [x] Weakness identification and recommendations
- [x] Personalized goal suggestions

### 🎮 **PHASE 5: Gamification & Polish (Week 9-10)**

_Add the fun psychological hooks_

**P5 - Advanced Gamification**

- [x] Point system based on consistency + progress
- [x] Challenge system (who can squat bodyweight first, etc.)
- [x] Seasonal competitions (monthly themes)
- [x] Comeback mechanics when one person is behind

**P5 - UI/UX Polish**

- [x] Animated celebrations for achievements - AchievementCelebration component with confetti
- [x] Better mobile responsive design
- [x] Dark mode implementation
- [x] Smooth page transitions and micro-interactions
- [x] Updated all pages to minimal, subtle design scheme (removed gradients, clean typography)
- [x] Updated color consistency in key components (leaderboard, points, calendar, stats, AI shame)
- [x] Implemented documentation-inspired design patterns (grouped sidebar, refined cards, consistent spacing)
- [x] Applied new typography scale and component patterns across dashboard, progress, workouts, and sidebar

### 💰 **PHASE 6: Stakes & Punishments (Week 11-12)**

_Real consequences for motivation_

**P6 - Low-Stakes Betting**

- [ ] Weekly/monthly mini-bet system ($5-20)
- [ ] Simple payment tracking (honor system initially)
- [ ] Bet history and settlement
- [ ] Automatic bet suggestions based on performance

**P6 - Punishment System**

- [ ] Custom punishment suggestions when losing
- [ ] Photo proof of completed punishments
- [ ] Punishment history and completion tracking
- [ ] Escalating consequences for continued failure

### 🔧 **PHASE 7: Advanced Features (Week 13+)**

_Nice-to-haves that enhance the experience_

**P7 - Advanced Tracking**

- [ ] Exercise library with form videos
- [ ] Workout templates and routines
- [ ] Rest day tracking and recovery metrics
- [ ] Integration with fitness wearables

**P7 - Social Features (Private)**

- [x] Private workout journal/notes
- [x] Partner messaging system
- [x] Shared goal setting
- [x] Anniversary celebrations (gym partnership milestones)

---

## Database Schema (Drizzle + Supabase)

```typescript
// Core tables needed from Phase 1
partnerships: id, user1_id, user2_id, created_at, active;
users: id, email, name, starting_weight, height, created_at;
workouts: id, user_id, date, exercises_json, photo_url, created_at;
streaks: user_id, current_streak, best_streak, last_workout_date;

// Added in Phase 3
progress_snapshots: user_id, date, weight, measurements_json, photo_url;

// Added in Phase 6
bets: partnership_id, amount, period, winner_id, settled;
punishments: bet_id, description, completed, proof_photo_url;
```

## Key Technical Decisions

- **Mobile-first responsive design** (most gym usage is mobile)
- **Real-time updates** via Supabase subscriptions
- **Photo storage** in Supabase buckets with automatic compression
- **Type-safe API** with tRPC for better DX
- **Progressive enhancement** - core features work without JS

This roadmap builds incrementally where each phase creates a usable app that gets progressively more engaging!
