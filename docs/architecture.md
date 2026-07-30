# ARCHITECTURE.md

# School Function Judging & Live Score Management System

## 1. Architecture Overview

## Purpose

This document defines the technical architecture of the School Function Judging & Live Score Management System.

The goal is to create a scalable, secure, real-time web application using:

* Next.js
* Supabase
* PostgreSQL
* Supabase Realtime
* Vercel

The architecture follows modern SaaS application patterns:

* Frontend application layer
* Business logic layer
* Data access layer
* Real-time event layer
* Authentication and authorization layer

---

# 2. High-Level System Architecture

```
                         USERS

        ┌──────────────┬──────────────┬──────────────┐
        │              │              │              │
      Admin          Judge        Audience

        │              │              │
        └──────────────┴──────────────┘

                       HTTPS

                         │

                         ▼


              NEXT.JS APPLICATION
                  (Vercel)

        ┌──────────────────────────┐
        │                          │
        │  App Router              │
        │  Server Components       │
        │  Client Components       │
        │  Server Actions          │
        │  Route Handlers          │
        │  Middleware              │
        │                          │
        └────────────┬─────────────┘

                     │

       ┌─────────────┼─────────────┐
       │             │             │

       ▼             ▼             ▼


 Supabase Auth   PostgreSQL    Supabase Storage

                    │

                    ▼

            Supabase Realtime

                    │

                    ▼

        Live Dashboard Updates
```

---

# 3. Architecture Layers

The application follows a layered architecture.

```
Presentation Layer

        ↓

Application Layer

        ↓

Business Logic Layer

        ↓

Data Access Layer

        ↓

Database
```

---

# 4. Presentation Layer

Responsible for:

* UI rendering
* User interaction
* Form handling
* Displaying data

Technology:

* Next.js
* React
* Tailwind CSS
* shadcn/ui

Structure:

```
app/

├── admin/
├── judge/
├── audience/
├── login/
└── components/
```

---

# 5. Application Layer

Responsible for:

* Routing
* Authentication checks
* Server actions
* API endpoints

Example flow:

```
User Action

↓

Server Action

↓

Validation

↓

Business Service

↓

Database
```

---

# 6. Business Logic Layer

All business rules should exist here.

Examples:

* Score calculation
* Ranking calculation
* Group points calculation
* Permission checks

Structure:

```
services/

├── student.service.ts
├── program.service.ts
├── judge.service.ts
├── scoring.service.ts
├── result.service.ts
└── leaderboard.service.ts
```

Example:

```
Judge submits score

↓

Scoring Service

↓

Calculate Average

↓

Generate Ranking

↓

Update Result

↓

Update Group Points
```

---

# 7. Data Access Layer

Responsible for database communication.

Technology:

* Supabase Client
* PostgreSQL

Structure:

```
lib/

└── supabase/

      client.ts
      server.ts
      queries.ts
```

Responsibilities:

* Database queries
* Authentication requests
* Storage operations

---

# 8. Authentication Architecture

## Authentication Provider

Supabase Auth

## User Flow

```
User

↓

Login Page

↓

Supabase Auth

↓

JWT Session

↓

Middleware

↓

Role Verification

↓

Dashboard
```

---

# 9. Authorization Architecture

Role-based access control.

Roles:

## Admin

Permissions:

```
CREATE
READ
UPDATE
DELETE
```

Resources:

* Students
* Programs
* Groups
* Judges
* Results

---

## Judge

Permissions:

```
READ assigned programs

CREATE scores

UPDATE own scores
```

Cannot:

* Manage users
* Modify programs
* Modify students

---

## Audience

Permissions:

```
READ published results
```

---

# 10. Database Architecture

## Entity Relationship

```
MAIN_GROUPS

      │

      │ 1:N

      ▼

STUDENTS

      │

      │ N:M

      ▼

PROGRAM_STUDENTS

      │

      ▼

PROGRAMS


PROGRAMS

      │

      │ N:M

      ▼

PROGRAM_JUDGES


PROGRAM_JUDGES

      │

      ▼

JUDGE_SCORES


JUDGE_SCORES

      │

      ▼

RESULTS


RESULTS

      │

      ▼

GROUP_LEADERBOARD
```

---

# 11. Database Tables

## profiles

Stores users.

```
id
name
email
role
created_at
updated_at
```

---

## main_groups

Stores participating groups.

```
id
name
photo_url
created_at
updated_at
```

---

## students

Stores student information.

```
id
roll_number
name
photo_url
class
gender
category
group_id
created_at
updated_at
```

---

## programs

Stores competitions.

```
id
name
stage_type
category
status
created_at
updated_at
```

---

## program_students

Student participation mapping.

```
id

program_id

student_id

created_at
```

---

## program_judges

Judge assignment.

```
id

program_id

judge_id

created_at
```

---

## judge_scores

Stores submitted scores.

```
id

program_id

student_id

judge_id

score

submitted_at
```

---

## results

Stores calculated results.

```
id

program_id

student_id

average_score

position

created_at
```

---

# 12. Realtime Architecture

Supabase Realtime is responsible for live updates.

## Score Update Flow

```
Judge Device

      |

      ▼

Submit Score

      |

      ▼

PostgreSQL

      |

      ▼

Database Event

      |

      ▼

Supabase Realtime

      |

 ┌────┴───────────┐

 ▼                ▼

Admin UI      Audience UI

```

---

# 13. Realtime Events

Events:

```
score_created

result_updated

leaderboard_updated

program_started

program_completed
```

---

# 14. Frontend Architecture

## Feature Based Structure

```
features/


students/

    components/
    hooks/
    services/
    types/


programs/

    components/
    hooks/
    services/


leaderboard/

    components/
    hooks/
```

Each feature owns:

* Components
* Hooks
* Types
* Business helpers

---

# 15. Component Architecture

Example:

```
LeaderboardPage


    LeaderboardContainer


          GroupCard

          RankingBadge

          ScoreDisplay
```

Components should:

* Have one responsibility
* Be reusable
* Avoid business logic

---

# 16. Score Calculation Architecture

Input:

```
Judge Scores
```

Process:

```
Collect Scores

↓

Calculate Average

↓

Sort Students

↓

Assign Position

↓

Generate Points

↓

Update Group Score
```

Output:

```
Final Results

Group Ranking
```

---

# 17. Error Handling Architecture

All operations should follow:

```
Request

↓

Validation

↓

Business Logic

↓

Database

↓

Response
```

Errors should:

* Be logged
* Return safe messages
* Never expose sensitive information

---

# 18. Security Architecture

Security layers:

## Application Security

* Authentication
* Authorization
* Input validation

## Database Security

* Row Level Security
* Foreign keys
* Constraints

## Storage Security

* Protected buckets
* File validation

---

# 19. Deployment Architecture

```
Developer

    |

    ▼

GitHub Repository

    |

    ▼

Vercel Deployment

    |

    ▼

Next.js Application


              |

              ▼

          Supabase

     ┌───────────────┐
     │ Auth          │
     │ Database      │
     │ Storage       │
     │ Realtime      │
     └───────────────┘
```

---

# 20. Environment Configuration

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY
```

Never expose service role keys in the frontend.

---

# 21. Scalability Strategy

Future improvements:

## Multi Event Support

Add:

```
events table
```

Every program belongs to an event.

---

## Multiple Schools

Add:

```
organizations table
```

Support multi-tenancy.

---

## Advanced Scoring

Add:

```
criteria table

score_items table
```

---

## Reporting

Add:

* PDF reports
* Excel export
* Analytics dashboard

---

# 22. Architecture Principles

The system must follow:

1. Keep UI and business logic separate.

2. Database rules should protect data.

3. Prefer server-side operations.

4. Avoid unnecessary client state.

5. Build reusable modules.

6. Keep features independent.

7. Design for future expansion.

8. Optimize for real-time performance.

9. Validate all user input.

10. Security must be implemented from the beginning.

---

# 23. Final Architecture Decision

The final architecture is:

```
Next.js 16

        +

Supabase

        +

PostgreSQL

        +

Supabase Realtime

        +

Vercel
```

This provides:

* Modern full-stack architecture
* Low operational cost
* Real-time capabilities
* Secure authentication
* Scalable database design
* Production-ready deployment workflow
