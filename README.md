# GymForge

A modern workout tracking application built with Next.js, Clerk authentication, and Convex backend. Track your gym progress, build custom workout plans, and visualize your strength gains over time.

## Features

- **Weekly Workout Planning**: Create custom workout schedules with exercises, sets, and rep targets
- **Set-by-Set Logging**: Track every set with weight and reps during your workouts
- **Progress Visualization**: Charts showing top sets, volume, and estimated 1RM over time
- **Smart Suggestions**: Rules-based feedback on when to progress or deload
- **Mobile-First Design**: Fully responsive UI that works great at the gym
- **Secure Authentication**: User accounts powered by Clerk

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (serverless database + functions)
- **Auth**: Clerk
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Clerk account (https://clerk.com)
- A Convex account (https://convex.dev)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd gym-plan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Clerk:
   - Create a new application at https://dashboard.clerk.com
   - Copy your publishable key and secret key

4. Set up Convex:
   - Run `npx convex dev` to create a new Convex project
   - This will generate your Convex URL

5. Create a `.env.local` file with your credentials:
   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Convex
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

6. Configure Clerk in Convex:
   - In your Convex dashboard, go to Settings > Authentication
   - Add Clerk as an auth provider using your Clerk domain

7. Seed the exercise database:
   - Once the app is running, the exercise catalog will be seeded automatically on first use

### Development

Run the development server (starts both Next.js and Convex):

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1
npm run dev:next

# Terminal 2
npm run dev:convex
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Testing

```bash
# Unit tests
npm run test

# E2E tests (requires the app to be running)
npm run test:e2e
```

## Project Structure

```
gym-plan/
├── app/                    # Next.js App Router
│   ├── (app)/              # Authenticated routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── plan/           # Workout plan editor
│   │   ├── log/            # Workout logging
│   │   ├── progress/       # Progress charts
│   │   └── profile/        # User profile
│   ├── components/         # Shared React components
│   ├── lib/                # Utility functions
│   ├── sign-in/            # Clerk sign-in page
│   └── sign-up/            # Clerk sign-up page
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema
│   ├── auth.ts             # Auth helpers
│   ├── users.ts            # User functions
│   ├── exercises.ts        # Exercise functions
│   ├── plans.ts            # Plan functions
│   ├── sessions.ts         # Session functions
│   └── progress.ts         # Progress & analytics
├── docs/                   # Documentation
└── tests/                  # Test files
```

## Data Model

- **users**: User profiles with preferences
- **exercises**: Global and custom exercise catalog
- **plans**: Weekly workout plans
- **planDays**: Days within a plan (Mon-Sun)
- **planExercises**: Exercises assigned to each day
- **sessions**: Logged workout sessions
- **sessionSets**: Individual sets logged

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel settings
4. Deploy

### Convex (Backend)

```bash
npm run convex:deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
