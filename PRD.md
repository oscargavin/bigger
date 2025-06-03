# Gym Buddy Accountability App - Development Roadmap

## High Priority → Low Priority Feature Todo List

### 🚀 **PHASE 1: Core Foundation (Week 1-2)**

_Get the basic habit loop working_

**P1 - Project Setup**

- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Tailwind CSS configuration
- [ ] Set up Drizzle ORM with Supabase connection
- [ ] Deploy basic skeleton to Vercel

**P1 - Authentication & Pairing**

- [ ] Implement Supabase auth (email/password)
- [ ] Create partnership invitation system (unique codes)
- [ ] Build user profile setup (name, starting weight/measurements)
- [ ] Partnership dashboard showing both users

**P1 - Basic Workout Logging**

- [ ] Simple workout entry form (date, exercises, reps, weight)
- [ ] Photo upload for workout proof (Supabase storage)
- [ ] Basic workout history list view
- [ ] Delete/edit workout entries

### 🎯 **PHASE 2: Competition & Streaks (Week 3-4)**

_Make it addictive through competition_

**P2 - Streak System**

- [ ] Daily workout streak tracking
- [ ] Streak visualization (calendar view)
- [ ] Streak break detection and reset
- [ ] Best streak records

**P2 - Head-to-Head Dashboard**

- [ ] Side-by-side current streak comparison
- [ ] Weekly workout count comparison
- [ ] Simple leaderboard (who's ahead this week/month)
- [ ] Real-time updates when partner logs workout

**P2 - Basic Notifications**

- [ ] Push notifications when partner works out
- [ ] Daily reminder notifications
- [ ] Streak milestone celebrations
- [ ] Simple "your partner is ahead" alerts

### 📊 **PHASE 3: Progress Tracking (Week 5-6)**

_Relative progress system for different body types_

**P3 - Relative Progress System**

- [ ] Percentage-based progress calculations (% improvement from baseline)
- [ ] Weight progression charts (relative to starting weight)
- [ ] Strength progression tracking (% increase in lifts)
- [ ] Side-by-side progress comparison (both normalized)

**P3 - Progress Visualization**

- [ ] Progress photo comparison (before/current)
- [ ] Interactive charts showing improvement curves
- [ ] Achievement badges for milestones (10% stronger, etc.)
- [ ] Progress summary reports

### 🤖 **PHASE 4: AI-Enhanced Features (Week 7-8)**

_Smart shame and motivation_

**P4 - AI Shame Engine (Anthropic API)**

- [ ] Dynamic trash talk generation based on performance gaps
- [ ] Personalized motivational messages using workout history
- [ ] AI-generated shame messages when streaks break
- [ ] Context-aware encouragement/roasting

**P4 - Smart Insights**

- [ ] AI analysis of workout patterns and suggestions
- [ ] Automated progress summaries
- [ ] Weakness identification and recommendations
- [ ] Personalized goal suggestions

### 🎮 **PHASE 5: Gamification & Polish (Week 9-10)**

_Add the fun psychological hooks_

**P5 - Advanced Gamification**

- [ ] Point system based on consistency + progress
- [ ] Challenge system (who can squat bodyweight first, etc.)
- [ ] Seasonal competitions (monthly themes)
- [ ] Comeback mechanics when one person is behind

**P5 - UI/UX Polish**

- [ ] Animated celebrations for achievements
- [ ] Better mobile responsive design
- [ ] Dark mode implementation
- [ ] Smooth page transitions and micro-interactions

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

- [ ] Private workout journal/notes
- [ ] Partner messaging system
- [ ] Shared goal setting
- [ ] Anniversary celebrations (gym partnership milestones)

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
