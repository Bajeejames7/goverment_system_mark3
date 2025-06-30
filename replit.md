# RMU Government System

## Overview
A comprehensive Records Management Unit (RMU) system for Kenyan government state department of industry. Features Firebase authentication, strict role-based access control, government hierarchy enforcement, document management with Supabase cloud storage, and automated workflow routing.

## Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query
- **Backend**: Express.js with Firebase Admin SDK
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Auth with custom claims
- **Storage**: Supabase cloud storage for documents
- **UI**: Tailwind CSS with shadcn/ui components

## Government Hierarchy
- **Secretary** (Industrialization) → **Principal Secretary** → **Department Heads** → **Officers**
- **Departments**: Admin, Finance, Accounts, ICT, Communications, HRM, Legal, Internal Audit, Procurement, Planning
- **Position Levels**: Secretary, PS, AD, DFS, CHEM_MIN, MIP, ENG, KIN

## Key Features
- Role-based access control (only ICT admin and Registry head can add users)
- Single-role constraints (only one PS, one Secretary, etc.)
- Document workflow: Registry → PS → Department Officers
- Letter status tracking with color codes (gray→blue→yellow→green)
- PS action buttons: TNA, File Away, Post Response, FYI
- Document archiving when users complete work
- Chatbot assistant (MIRA) with draggable interface
- Light/dark theme support

## Recent Changes
- **2025-01-26**: Fixed authentication system with proper Firebase user context
- **2025-01-26**: Implemented role-based dashboard filtering
- **2025-01-26**: Added letter archiving system for completed work
- **2025-01-26**: Enhanced user management with hierarchy constraints
- **2025-01-26**: Fixed firebase-admin dependency installation

## User Preferences
- Government-appropriate professional interface
- Secure document handling with cloud storage
- Role-specific functionality visibility
- Color-coded status tracking for easy workflow management