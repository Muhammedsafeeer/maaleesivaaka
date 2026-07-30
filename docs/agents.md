# AGENTS.md

# School Function Judging & Live Score Management System

## Purpose

This document provides implementation guidelines for AI coding agents contributing to this project.

The primary goal is to build a production-quality, maintainable, scalable, and modern web application using Next.js and Supabase.

The AI agent should prioritize clean architecture over quickly producing code.

---

# Project Stack

## Frontend

* Next.js 16 (App Router)
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui

## Backend

* Next.js Server Actions
* Route Handlers

## Database

* Supabase PostgreSQL

## Authentication

* Supabase Auth

## Storage

* Supabase Storage

## Realtime

* Supabase Realtime

## Hosting

* Vercel

---

# Development Philosophy

The project must follow these principles:

* Feature-based architecture
* Modular code
* Reusable components
* Strong typing
* Server-first approach
* Minimal client state
* Security by default
* Performance first
* Accessibility
* Mobile-first UI

Never sacrifice maintainability for shorter code.

---

# Coding Standards

## TypeScript

Always use TypeScript.

Avoid `any`.

Prefer:

* interfaces
* utility types
* discriminated unions
* enums only when appropriate

Enable strict typing.

---

## Components

Components must be:

* Small
* Reusable
* Single responsibility

Avoid components larger than approximately 250 lines.

Split complex UI into smaller components.

---

## Naming

### Components

PascalCase

Example

StudentCard.tsx

ProgramTable.tsx

JudgeScoreDialog.tsx

---

### Hooks

useSomething.ts

Example

useStudents.ts

useRealtimeLeaderboard.ts

---

### Services

student.service.ts

judge.service.ts

program.service.ts

---

### Database Types

Singular

Student

Program

Judge

Result

---

# Folder Structure

```
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
```

Every feature should contain its own:

* components
* hooks
* services
* validation
* types

Avoid placing unrelated files together.

---

# State Management

Use the smallest tool that solves the problem.

Preferred order

1. React Server Components

2. Server Actions

3. TanStack Query

4. Zustand

Avoid global state unless truly shared.

Never duplicate server data in multiple places.

---

# Data Fetching

Prefer

Server Components

↓

Server Actions

↓

TanStack Query (client-side only when needed)

Avoid unnecessary client-side fetching.

---

# Forms

Use

React Hook Form

*

Zod validation

Validation must exist on:

* Client
* Server

---

# Styling

Use Tailwind CSS.

Use shadcn/ui components whenever possible.

Do not create duplicate UI components.

Keep spacing consistent.

Prefer utility classes over custom CSS.

---

# Authentication

Authentication must use Supabase Auth.

Roles

* admin
* judge

Never trust role information from the client.

Always verify permissions on the server.

---

# Authorization

Protect:

* Server Actions
* Route Handlers
* Database

Every mutation must verify permissions.

---

# Database Rules

Use PostgreSQL normalization.

Avoid duplicated data.

Use foreign keys.

Use indexes where appropriate.

Prefer UUID primary keys.

Use timestamps.

Every table should include

created_at

updated_at

---

# Row Level Security

Enable RLS on every table.

Policies should allow

Admin

* Full access

Judge

* Read assigned programs
* Write assigned scores

Audience

* Read only published results

Never disable RLS.

---

# Storage

Store only

* Student Photos
* Group Photos

Do not store files inside the database.

Store only URLs.

---

# Realtime

Use Supabase Realtime.

Realtime should update

* Leaderboard
* Results
* Current Program

Never poll the server every few seconds.

Use subscriptions instead.

---

# Business Logic

Business logic must never exist inside UI components.

Instead

Component

↓

Server Action

↓

Service

↓

Database

Business rules belong in services.

---

# Error Handling

Every async operation must

* handle errors
* return typed responses
* show user-friendly messages

Never expose raw database errors.

---

# Logging

Use structured logging.

Log

* authentication failures
* score submissions
* unexpected errors

Do not log passwords or sensitive information.

---

# Performance

Prefer

Server Components

Streaming

Lazy Loading

Dynamic Imports

Pagination

Image Optimization

Avoid unnecessary rerenders.

---

# Accessibility

Every form should include

* labels
* keyboard navigation
* focus management
* aria attributes

Use semantic HTML.

---

# Security

Never

* expose service keys
* trust client data
* expose database IDs unnecessarily
* bypass authentication

Always validate

* input
* permissions
* ownership

---

# Feature Implementation Order

Implement features in this order.

## Phase 1

Project Setup

Authentication

Database

Layouts

Navigation

---

## Phase 2

Main Groups

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

Result Calculation

Leaderboard

Realtime

---

## Phase 6

Public Dashboard

Optimization

Deployment

---

# Code Quality

Every pull request or generated code should satisfy:

* Type-safe
* No TypeScript errors
* No ESLint errors
* No duplicated logic
* No dead code
* No unused imports
* Modular architecture
* Responsive UI

---

# Definition of Done

A feature is complete only if it includes:

* UI
* Validation
* Database integration
* Error handling
* Loading states
* Empty states
* Responsive design
* Type safety
* Authorization
* Testing where appropriate

---

# AI Agent Instructions

Before implementing any feature:

1. Read the relevant documentation.
2. Understand the data model.
3. Reuse existing components before creating new ones.
4. Follow the project folder structure.
5. Keep business logic out of UI components.
6. Prefer Server Components over Client Components.
7. Use Server Actions for mutations whenever possible.
8. Write readable, maintainable code instead of clever code.
9. Avoid introducing unnecessary dependencies.
10. Keep the application production-ready at every stage.

The objective is to produce a clean, scalable codebase that another developer can understand and extend with minimal effort.
