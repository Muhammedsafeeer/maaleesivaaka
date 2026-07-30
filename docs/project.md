# Project.md

# School Function Judging & Live Score Management System

## 1. Project Overview

### Project Name

**School Function Judging & Live Score Management System**

### Objective

Develop a modern web-based application for managing school arts festivals, competitions, and cultural events.

The application enables administrators to manage students, programs, judges, and scoring while providing judges with a simple scoring interface and displaying live results and leaderboards to the audience.

The application should prioritize:

* Simplicity
* Speed
* Real-time updates
* Clean architecture
* Scalability
* Mobile responsiveness

---

# 2. Technology Stack

## Frontend

* Next.js 16 (App Router)
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* TanStack Query
* React Hook Form
* Zod
* Zustand

## Backend

Use Next.js Server Actions and Route Handlers.

No separate Express server.

---

## Database

Supabase PostgreSQL

---

## Authentication

Supabase Auth

Roles:

* Admin
* Judge

---

## File Storage

Supabase Storage

Store:

* Student Photos
* Main Group Photos

---

## Hosting

* Vercel
* Supabase

---

## Realtime

Supabase Realtime

Used for:

* Live Leaderboard
* Live Results
* Live Score Updates

---

# 3. User Roles

## Admin

Can:

* Manage Students
* Manage Programs
* Manage Main Groups
* Manage Judges
* Assign Students
* Assign Judges
* Publish Results
* View Dashboard

---

## Judge

Can:

* Login
* View Assigned Programs
* Submit Scores
* View Submitted Scores

Cannot:

* Edit Students
* Edit Programs
* Edit Groups

---

## Audience

No Login Required

Can View:

* Live Leaderboard
* Current Program
* Latest Results

---

# 4. Core Modules

## Authentication

* Login
* Logout
* Session Management
* Role Protection

---

## Dashboard

### Admin Dashboard

Display

* Total Students
* Total Programs
* Total Groups
* Total Judges
* Completed Programs
* Pending Programs
* Leaderboard

---

### Judge Dashboard

Display

* Assigned Programs
* Pending Programs
* Completed Programs

---

### Audience Dashboard

Display

* Current Program
* Live Leaderboard
* Latest Results

Automatically updates using Supabase Realtime.

---

## Main Groups

Each group contains:

* Name
* Photo
* Total Points

Examples

* Red House
* Blue House
* Green House
* Yellow House

---

## Students

Fields

* Roll Number
* Name
* Photo
* Class
* Gender
* Category
* Main Group

---

## Programs

Fields

* Program Name
* Stage Type
* Category
* Status

Stage Types

* On Stage
* Off Stage

Categories

* Kids
* Junior
* Senior

---

## Student Assignment

Assign students to programs.

Validation:

Student category must match program category.

---

## Judge Assignment

Assign one or more judges to programs.

Each judge only sees assigned programs.

---

## Score Submission

Judges submit a total score (0–100) for each student.

Future versions may support configurable judging criteria.

---

## Result Calculation

The system calculates:

* Average Score
* Final Rank
* Position

Top positions:

* 1st
* 2nd
* 3rd

---

## Group Leaderboard

Default Points

* 1st = 5
* 2nd = 3
* 3rd = 1

These values should be configurable later.

---

# 5. Functional Requirements

## Student Management

* Create Student
* Edit Student
* Delete Student
* Search Student
* Filter Students

---

## Program Management

* Create Program
* Edit Program
* Delete Program
* Search Program

---

## Group Management

* Create Group
* Edit Group
* Delete Group

---

## Judge Management

* Create Judge
* Edit Judge
* Delete Judge

---

## Assignment

Admin can

* Assign Students
* Remove Students
* Assign Judges
* Remove Judges

---

## Results

Automatically generated after all judges submit scores.

---

## Live Dashboard

Automatically updates

* Scores
* Results
* Leaderboard

No browser refresh required.

---

# 6. Non-Functional Requirements

Performance

* Fast page loading
* Server-side rendering where appropriate

Security

* Authentication
* Authorization
* Protected Routes
* Row Level Security

Scalability

Support

* Hundreds of Students
* Hundreds of Programs
* Multiple Judges

Responsiveness

Support

* Desktop
* Tablet
* Mobile
* TV Display

---

# 7. Database Overview

Tables

profiles

main_groups

students

programs

program_students

program_judges

judge_scores

results

---

# 8. Realtime Workflow

Judge submits score

↓

Score stored in Database

↓

Result recalculated

↓

Leaderboard updated

↓

Supabase Realtime broadcasts change

↓

Admin Dashboard updates

↓

Audience Dashboard updates

↓

Judge Dashboard updates

No manual refresh required.

---

# 9. Folder Structure

src/

app/

components/

features/

hooks/

lib/

services/

types/

utils/

middleware.ts

---

# 10. Development Phases

## Phase 1

Authentication

Database

Layout

---

## Phase 2

Groups

Students

Programs

---

## Phase 3

Student Assignment

Judge Assignment

---

## Phase 4

Judge Dashboard

Score Submission

---

## Phase 5

Automatic Results

Leaderboard

Realtime

---

## Phase 6

Testing

Deployment

Optimization

---

# 11. Future Enhancements

* Dynamic Judging Criteria
* Excel Import
* PDF Reports
* Certificates
* QR Code Check-in
* Multi-school Support
* AI Reports
* Event Analytics
* Notifications
* Offline Support

---

# 12. Success Criteria

The project is considered successful when:

* Admin can manage the complete event.
* Judges can submit scores from any device.
* Results are calculated automatically.
* Leaderboards update in real time.
* Audience can view live scores without refreshing.
* The application is responsive, secure, and production-ready.
