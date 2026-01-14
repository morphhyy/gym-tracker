# GymForge Architecture

## Overview

GymForge is a full-stack workout tracking application built with a modern serverless architecture.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 16 (App Router) + React 19 + TypeScript            │
│  - Server-side rendering for fast initial loads              │
│  - Client components for interactive features                │
│  - Tailwind CSS for styling                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Authentication                           │
│                         Clerk                                │
│  - JWT-based authentication                                  │
│  - Social login support                                      │
│  - User management                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ JWT validation
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│                        Convex                                │
│  - Serverless functions (queries & mutations)                │
│  - Real-time subscriptions                                   │
│  - Built-in database                                         │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

1. User clicks "Sign In" on landing page
2. Clerk modal/page handles authentication
3. On success, Clerk provides a JWT
4. JWT is automatically included in Convex requests
5. Convex validates JWT using Clerk's public keys
6. User identity is available in all Convex functions

## Data Model

### Entity Relationships

```
users (1) ──────────────── (N) plans
                               │
plans (1) ──────────────── (N) planDays
                               │
planDays (1) ────────────── (N) planExercises
                               │
exercises (1) ──┬──────────── (N) planExercises
                │
                └──────────── (N) sessionSets
                               │
sessions (1) ────────────── (N) sessionSets
                               │
users (1) ──────────────── (N) sessions
```

### Tables

#### users
| Field | Type | Description |
|-------|------|-------------|
| clerkUserId | string | Clerk's user identifier |
| email | string | User's email |
| displayName | string? | Optional display name |
| units | "kg" \| "lb" | Preferred weight units |
| goals | string? | Fitness goals |
| createdAt | number | Timestamp |

#### exercises
| Field | Type | Description |
|-------|------|-------------|
| name | string | Exercise name |
| muscleGroup | string? | Target muscle group |
| equipment | string? | Required equipment |
| isGlobal | boolean | If globally available |
| userId | string? | Owner if custom |
| createdAt | number | Timestamp |

#### plans
| Field | Type | Description |
|-------|------|-------------|
| userId | string | Owner's Clerk ID |
| name | string | Plan name |
| active | boolean | If currently active |
| planVersion | number | Version number |
| createdAt | number | Timestamp |

#### planDays
| Field | Type | Description |
|-------|------|-------------|
| planId | Id<"plans"> | Parent plan |
| weekday | number | 0-6 (Mon-Sun) |
| name | string? | Optional label |
| createdAt | number | Timestamp |

#### planExercises
| Field | Type | Description |
|-------|------|-------------|
| planDayId | Id<"planDays"> | Parent day |
| exerciseId | Id<"exercises"> | Exercise reference |
| order | number | Display order |
| sets | array | Set configurations |
| createdAt | number | Timestamp |

#### sessions
| Field | Type | Description |
|-------|------|-------------|
| userId | string | Owner's Clerk ID |
| date | string | ISO date (YYYY-MM-DD) |
| planId | Id<"plans">? | Plan used |
| weekday | number? | Day of week |
| completedAt | number? | Completion timestamp |
| notes | string? | Session notes |
| createdAt | number | Timestamp |

#### sessionSets
| Field | Type | Description |
|-------|------|-------------|
| sessionId | Id<"sessions"> | Parent session |
| exerciseId | Id<"exercises"> | Exercise performed |
| setIndex | number | Set number (0-based) |
| repsActual | number | Reps completed |
| weight | number | Weight used |
| rpe | number? | Rate of Perceived Exertion |
| createdAt | number | Timestamp |

## API Design

### Queries (Read Operations)

| Function | Description |
|----------|-------------|
| `users.getCurrentUser` | Get current user's profile |
| `exercises.getAllExercises` | List all available exercises |
| `plans.getActivePlan` | Get user's active workout plan |
| `plans.getTodayTemplate` | Get today's planned workout |
| `sessions.getSessionByDate` | Get session for a specific date |
| `progress.getExerciseHistory` | Get progress data for an exercise |
| `progress.getWeeklySummary` | Get weekly statistics |

### Mutations (Write Operations)

| Function | Description |
|----------|-------------|
| `users.upsertProfile` | Create/update user profile |
| `exercises.createExercise` | Add a custom exercise |
| `plans.createPlan` | Create a new workout plan |
| `plans.setActivePlan` | Set a plan as active |
| `sessions.getOrCreateSession` | Start a workout session |
| `sessions.logSet` | Log a completed set |
| `sessions.completeSession` | Mark session as done |

## Frontend Architecture

### Route Structure

```
app/
├── (public routes)
│   ├── page.tsx              # Landing page
│   ├── sign-in/[[...]]       # Clerk sign-in
│   └── sign-up/[[...]]       # Clerk sign-up
│
└── (app)/ (authenticated)
    ├── layout.tsx            # App shell with nav
    ├── dashboard/page.tsx    # Home dashboard
    ├── plan/page.tsx         # Plan editor
    ├── log/page.tsx          # Workout logger
    ├── progress/page.tsx     # Progress overview
    ├── progress/[id]/page.tsx # Exercise detail
    └── profile/page.tsx      # User profile
```

### State Management

- **Server State**: Managed by Convex React hooks
  - `useQuery()` for reading data
  - `useMutation()` for writes
  - Automatic real-time updates

- **Local State**: React useState for UI state
  - Form inputs
  - Modal visibility
  - Temporary data before save

### Component Patterns

1. **Page Components**: Server-rendered shells that load data
2. **Client Components**: Interactive UI with "use client" directive
3. **Shared Components**: Reusable UI in `/app/components`

## Performance Considerations

### Database Queries

- All queries are indexed on `userId` for fast lookups
- Date-based queries use compound indexes
- Progress queries are range-bounded to limit data

### Frontend

- Server components for initial render
- Client components only where interactivity needed
- Optimistic updates for logging sets

## Security

### Authorization

Every Convex function enforces user ownership:

```typescript
const userId = await requireAuth(ctx);
// All queries filter by userId
// All mutations verify ownership before changes
```

### Data Isolation

- Users can only read/write their own data
- Global exercises are read-only
- Custom exercises are user-scoped
