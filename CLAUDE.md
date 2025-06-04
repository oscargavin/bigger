# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PRD update

Update the PRD.md todo list any time something is completed from it

## Project Overview

This is a Gym Buddy Accountability App built with Next.js 15.3.3 using the App Router. The app pairs users for accountability, enables photo logging of gym workouts, and provides competitive elements.

## Design System

### Visual Hierarchy

Modern design with high contrast and clear visual separation between UI elements. The design emphasizes depth through multiple surface levels, shadows, and strategic use of color.

### Color Scheme

- **Light Mode**: Pure white backgrounds with deep black text for maximum contrast
- **Dark Mode**: True black backgrounds with bright white text
- **Brand Colors**: Blue (#3B82F6) as primary, with complementary violet, emerald, amber accents
- **Surface Levels**:
  - Base: Default background
  - Raised: Slightly elevated cards
  - Overlay: Interactive sections
  - High: Highest elevation elements

### Card Design Pattern

Three distinct card styles for visual hierarchy:

1. **card-elevated**: Stats and metrics cards

   - Subtle gradient overlay matching the metric color
   - Colored icon containers with ring borders
   - Gradient text for numbers
   - Hover lift animation
   - Shadow-md for depth

2. **card-interactive**: Action cards and forms

   - Stronger borders (2px)
   - Shadow-lg for prominence
   - Clear CTAs with gradient buttons
   - More padding and spacing

3. **card-glass**: Large content sections
   - Glass morphism effect
   - Backdrop blur
   - Semi-transparent backgrounds
   - Shadow-xl for maximum depth

### Typography & Icons

- Gradient text for important metrics
- Colored icon backgrounds that match the data category:
  - Emerald: Success/Streaks
  - Brand Blue: Primary actions
  - Violet: Social/Buddy features
  - Amber: Competitions/Challenges

### Interaction States

- Hover effects with elevation changes
- Smooth transitions (200ms)
- Focus states with ring highlights
- Active states with gradient backgrounds

## Commands

- `npm run dev` - Development server (Note: User typically has localhost:3000 already running)
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run start` - Production server

## MCPs

- always use supabase mcp for database changes (migrations etc)
- always use context7 mcp for docs if necessary

## Tech Stack & Architecture

### Current Setup

- **Framework**: Next.js 15.3.3 with App Router
- **UI**: React 19.0.0
- **Styling**: Tailwind CSS v4 (using new PostCSS plugin)
- **Language**: TypeScript with strict mode
- **Path Alias**: `@/*` maps to `./src/*`

### Planned Integration (Phase 1)

- **Database**: Supabase with Drizzle ORM
- **UI Components**: Shadcn UI
- **API**: tRPC for type-safe endpoints
- **Real-time**: Supabase subscriptions

## Development Phases

The PRD outlines 7 phases. Currently starting Phase 1:

1. **Core Foundation**: Auth, user pairing, basic workout logging
2. **Competition & Streaks**: Leaderboards, streak tracking
3. **Progress Tracking**: Visual progress, analytics
4. **AI Features**: Using Anthropic API for insights
5. **Gamification**: Achievement system
6. **Stakes**: Punishment mechanisms
7. **Advanced**: Group challenges, trainer integration

## Key Development Patterns

- Mobile-first responsive design
- Real-time updates via Supabase
- Photo compression for workout images
- Progressive enhancement approach
- Custom CSS variables for theming (Tailwind v4)

## Database Schema (Phase 1)

Planned tables: users, pairings, workouts, photos, streaks, notifications, competitions
