# RMU Government System

## Overview
A comprehensive Records Management Unit (RMU) system for Kenyan government state department of industry. Features Firebase authentication, strict role-based access control, government hierarchy enforcement, document management with Supabase cloud storage, and automated workflow routing.

## Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query
- **Backend**: Express.js with JWT authentication
- **Database**: Aiven PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with bcryptjs password hashing
- **Storage**: File system with secure token-based access
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
- **2025-01-30**: Enhanced UI with beautiful design, improved logo styling, and mobile-responsive hamburger menu
- **2025-01-30**: Added welcome landing page with professional government interface and system overview
- **2025-01-30**: Implemented glass morphism effects, improved color schemes, and smooth animations
- **2025-01-30**: Enhanced sidebar with role-based badges, better navigation, and mobile responsiveness
- **2025-01-30**: Updated header with modern search functionality, notifications, and user dropdown menu
- **2025-01-30**: Implemented universal login page with JWT authentication
- **2025-01-30**: Connected to Aiven PostgreSQL database with existing user data
- **2025-01-30**: Added role-based dashboard routing for government hierarchy
- **2025-01-30**: Configured bcrypt password authentication with existing users
- **2025-01-30**: Migrated from Firebase to JWT-based authentication system

## User Preferences
- Government-appropriate professional interface
- Secure document handling with cloud storage
- Role-specific functionality visibility
- Color-coded status tracking for easy workflow management