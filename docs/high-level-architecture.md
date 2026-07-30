                    ┌─────────────────────────┐
                    │        Users            │
                    │─────────────────────────│
                    │ Admin                   │
                    │ Judges                  │
                    │ Public Audience         │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS
                                 ▼
        ┌──────────────────────────────────────────────┐
        │                Next.js (Vercel)              │
        │──────────────────────────────────────────────│
        │ App Router                                  │
        │ Authentication Middleware                   │
        │ Server Components                           │
        │ Client Components                           │
        │ Server Actions                              │
        │ API Routes (if required)                    │
        └───────────────┬──────────────────────────────┘
                        │
        ┌───────────────┼──────────────────────┐
        │               │                      │
        ▼               ▼                      ▼
 Supabase Auth    Supabase Database     Supabase Storage
                     PostgreSQL          Photos & Logos
                        │
                        ▼
              Supabase Realtime
                        │
                        ▼
      Live Leaderboard / Live Results / Live Scores