# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PRD update

Update the PRD.md todo list any time something is completed from it

## Project Overview

This is a Gym Buddy Accountability App built with Next.js 15.3.3 using the App Router. The app pairs users for accountability, enables photo logging of gym workouts, and provides competitive elements.

## Design System

### Core Design Philosophy

**MINIMAL & REFINED** - Clean, subtle design with strategic use of color. No gradients, but thoughtful color variations for depth and hierarchy. Focus on typography, spacing, and micro-interactions.

### Design Principles

1. **Subtle Color Layering** - Use neutral color variations to create depth without harsh contrasts
2. **Purposeful Color** - Icons and accents use color meaningfully, not decoratively
3. **Breathing Room** - Generous whitespace and padding for visual comfort
4. **Consistent Rhythm** - Predictable spacing scale (4, 8, 12, 16, 24, 32, 48px)
5. **Soft Boundaries** - Subtle borders and shadows instead of hard lines
6. **Information Hierarchy** - Clear visual hierarchy through typography scale and weight variations
7. **Contextual Navigation** - Persistent sidebar with collapsible sections for easy navigation
8. **Semantic Icons** - Minimal icon usage, only where it adds clear meaning (trophy for achievements, star for premium)

### Color Palette

#### Neutral Scale
- **Light Mode**:
  - Background: #FFFFFF
  - Surface: #FAFAFA
  - Surface Raised: #F5F5F5
  - Border: rgba(0, 0, 0, 0.06)
  - Border Strong: rgba(0, 0, 0, 0.12)
  
- **Dark Mode**:
  - Background: #09090B
  - Surface: #0F0F12
  - Surface Raised: #18181B
  - Border: rgba(255, 255, 255, 0.06)
  - Border Strong: rgba(255, 255, 255, 0.12)

#### Semantic Colors
- **Primary**: #3B82F6 (Blue) - Primary actions, links
- **Success**: #10B981 (Emerald) - Achievements, positive states
- **Warning**: #F59E0B (Amber) - Competitions, alerts
- **Social**: #8B5CF6 (Violet) - Buddy features, social elements
- **Destructive**: #EF4444 (Red) - Errors, destructive actions

### Component Patterns

#### Surfaces & Cards
1. **Surface Default**: Base background color
2. **Surface Subtle**: Slightly elevated (surface color)
3. **Surface Raised**: Cards and containers (surface raised color)
4. **Interactive Surface**: Hover states add subtle shadow lift
5. **Content Cards**: White/dark cards with subtle borders, generous padding (24-32px)
6. **Feature Cards**: Icon + heading + description pattern for clear scanning

#### Sidebar & Navigation
- Subtle background differentiation (5% opacity shift)
- Active states use primary color with low opacity background (10% primary)
- Icons use muted colors, brighten on hover/active
- 2px indicator for active items on left edge
- Grouped sections with subtle headers (uppercase, smaller text)
- Expandable/collapsible sections for complex navigation
- Sticky positioning for constant access

#### Data Display
- Stats cards use colored icons with neutral backgrounds
- Metrics use bold typography, not color, for emphasis
- Progress bars use semantic colors with muted tracks
- Charts use a refined color palette with 80% opacity

### Typography Scale

- **Display**: 2.5rem (40px) - Page titles
- **Heading 1**: 2rem (32px) - Section headers
- **Heading 2**: 1.5rem (24px) - Card titles
- **Heading 3**: 1.25rem (20px) - Subsections
- **Body Large**: 1.125rem (18px) - Important text
- **Body**: 1rem (16px) - Default
- **Small**: 0.875rem (14px) - Secondary text
- **Caption**: 0.75rem (12px) - Minimal text

#### Typography Principles
- **High Contrast Weights**: Use 400 (regular) and 600-700 (semibold/bold) for clear hierarchy
- **Line Height**: 1.5 for body text, 1.2 for headings
- **Letter Spacing**: Slightly tighter for headings (-0.02em), default for body
- **Font Stack**: System fonts for fast loading and native feel

### Spacing & Layout

- **Page Padding**: 24px (mobile), 32px (desktop)
- **Section Spacing**: 48px between major sections
- **Card Padding**: 20px (mobile), 24px (desktop)
- **Element Spacing**: 16px between related items
- **Inline Spacing**: 8px for tight groupings

### Interactive Elements

#### Buttons
- **Primary**: Solid primary color, subtle shadow
- **Secondary**: Outlined with hover fill
- **Ghost**: No border, subtle hover background
- **Sizes**: Small (32px), Default (40px), Large (48px)
- **Icon Buttons**: 40px square with rounded corners, subtle hover background
- **Text Links**: Primary color with underline on hover, smooth transition

#### Form Elements
- **Inputs**: 44px height, subtle border, focus ring
- **Labels**: Small text, 8px margin bottom
- **Help Text**: Muted color, 4px margin top

#### Icons
- **Size**: 20px default, 16px small, 24px large
- **Color**: Match semantic meaning or muted default
- **Containers**: 40px circles with 10% opacity backgrounds

### Motion & Transitions

- **Duration**: 200ms for micro-interactions
- **Easing**: ease-out for natural feel
- **Properties**: transform, opacity, box-shadow
- **No motion** for color changes (instant)

### Documentation-Inspired Patterns

Based on world-class documentation design:

#### Content Organization
- **Progressive Disclosure**: Start with overview, reveal details on demand
- **Scannable Structure**: Clear headings, bullet points, short paragraphs
- **Visual Breaks**: Use cards and spacing to separate concepts
- **Inline Help**: Contextual tooltips for complex features

#### Visual Language
- **Semantic Colors**: Green for success/go, amber for warnings, blue for information
- **Monospace for Code**: Clear distinction between UI text and code/data
- **Status Indicators**: Pills/badges for states (active, pending, completed)
- **Illustration Style**: Simple geometric shapes, limited color palette

#### Responsive Behavior
- **Mobile Navigation**: Hamburger menu with full-screen overlay
- **Content Reflow**: Single column on mobile, multi-column on desktop
- **Touch Targets**: Minimum 44px for all interactive elements
- **Readable Line Length**: Max 80 characters for body text

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

## Common Build Error Patterns & Solutions

### React/JSX Issues
1. **Unescaped Entities**: Always escape apostrophes and quotes in JSX
   - Use `&apos;` or `&rsquo;` for apostrophes (')
   - Use `&quot;`, `&ldquo;`, or `&rdquo;` for quotes (")
   - Example: `Don't` → `Don&apos;t`, `"text"` → `&ldquo;text&rdquo;`

2. **useEffect Dependencies**: Always include all dependencies
   - Use `useMemo` for derived values that are used as dependencies
   - Include all functions and values referenced inside useEffect

### TypeScript Type Issues
1. **Type Assertions**: When TypeScript can't infer types correctly
   - Use `as any` temporarily for complex union types
   - Better: Add proper type annotations to functions and variables
   - Example: `data.context as any` when context has multiple shapes

2. **Literal Types**: Be specific with string literal unions
   - Return type should match exact literal values, not generic `string`
   - Example: `'active' | 'inactive'` not `string`

3. **Null/Undefined Handling**: Always check for null/undefined
   - Use optional chaining: `value?.property`
   - Provide defaults: `value || defaultValue`
   - Type guards: `if (value) { ... }`

### Drizzle ORM Patterns
1. **Query Operators**: Import from 'drizzle-orm', not db instance
   - ✅ `import { eq, or, not, lt } from 'drizzle-orm'`
   - ❌ `ctx.db.or()`, `ctx.db.not()`, `ctx.db.lt()`

2. **Schema Types**: Match exact enum values from schema
   - Check schema definition for exact enum values
   - Use proper type for numeric fields (string vs number)

### Component Library Patterns
1. **shadcn/ui Variants**: Check available variants before using
   - Badge: only has 'default', 'secondary', 'destructive', 'outline'
   - No 'success' variant - use className for custom styling

2. **Type-safe Props**: Always check component prop types
   - Use TypeScript to verify prop types match component expectations
