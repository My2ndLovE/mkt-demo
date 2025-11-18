# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-Level Agent Lottery Sandbox System - a comprehensive web-based lottery practice management system for Malaysian and Singapore lottery games (3D, 4D, 5D, 6D) with unlimited agent hierarchy, configurable commission rates, weekly betting limits, and automated result synchronization.

### Current State

- **Demo App**: Static Astro-based lottery practice demo in `demo/` directory
  - Mobile-first UI with Traditional Chinese (繁體中文)
  - 11 pages covering betting, query, results, winnings, accounts, guide, and profile
  - Static demo with mock data for demonstration purposes

- **Production Planning**: Specifications and planning documents in `specs/001-lottery-sandbox/`
  - Full-stack system using Azure services, React Router 7, NestJS
  - See `specs/001-lottery-sandbox/spec.md` for complete feature specification

## Tech Stack

### Demo Application (Current - Static)
- **Framework**: Astro 4.16.0 (Static Site Generation)
- **CSS**: Tailwind CSS 3.4.1
- **JavaScript**: Alpine.js 3.14.1
- **Deployment**: Cloudflare Pages

### Production System (Planned)
- **Frontend**: React 19, React Router 7 SSR, TanStack Query v5, Zustand v5, shadcn/ui, Tailwind CSS v4
- **Backend**: NestJS v10, Prisma v5, Passport.js, Azure Functions SDK
- **Database**: Azure SQL Database with Prisma ORM
- **Testing**: Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- **Platform**: Node.js v20 LTS, TypeScript 5.x

## Development Commands

### Demo Application
```bash
# Working directory: demo/
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:4321
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build
```

### Deployment
The demo is configured for Cloudflare Pages deployment:
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18
- See `demo/CLOUDFLARE_DEPLOYMENT.md` for detailed deployment instructions

## Architecture & Code Structure

### Demo Application Structure
```
demo/
├── src/
│   ├── pages/          # Astro pages (file-based routing)
│   │   ├── index.astro         # Home/dashboard
│   │   ├── betting.astro       # Full betting grid
│   │   ├── simple.astro        # Text input betting
│   │   ├── query.astro         # Search/query bets
│   │   ├── cancel.astro        # Cancel pending bets
│   │   ├── total.astro         # Statistics/totals
│   │   ├── winnings.astro      # Winning bets
│   │   ├── results.astro       # Calendar results
│   │   ├── accounts.astro      # Transaction history
│   │   ├── guide.astro         # Instructions
│   │   ├── profile.astro       # User settings
│   │   └── quotation.astro     # Quotation page
│   ├── components/     # Reusable Astro components
│   │   ├── Keypad.astro        # Numeric keypad for betting
│   │   └── MenuCard.astro      # Menu card component
│   ├── layouts/        # Page layouts
│   │   └── Layout.astro        # Base layout with header/navigation
│   ├── data/           # Mock data for demo
│   │   ├── mockBets.js         # Sample betting data
│   │   └── mockResults.js      # Sample draw results
│   └── styles/         # Global styles
│       └── global.css          # Tailwind utilities + custom styles
```

### Design System
- **Colors**:
  - Primary: Blue gradient (`primary-500` to `primary-700`)
  - Accent: Orange (`accent-400` to `accent-500`)
- **Typography**: Noto Sans TC (Traditional Chinese optimized)
- **Animations**: slide-up, slide-down, fade-in, scale-in (300ms ease-out)
- **Components**: Custom utility classes in `global.css` (btn, card, input, keypad-btn, chip)
- **Mobile Optimization**:
  - Safe area insets for notched devices (`.safe-top`, `.safe-bottom`)
  - Touch-optimized tap targets (minimum 44x44px)
  - Active state scaling for tactile feedback

### State Management
- **Alpine.js**: Used for interactive components (keypad, forms, toggles)
- **Mock Data**: All data is static in `src/data/` for demo purposes

### Build Configuration
- **Astro Config** (`astro.config.mjs`):
  - Static output mode
  - Inline stylesheets for performance
  - Terser minification with console/debugger removal
- **Tailwind Config** (`tailwind.config.mjs`):
  - Custom color scales (primary, accent)
  - Custom animations and keyframes
  - Chinese font stack (Noto Sans TC)

## SpecKit Workflow

This project uses SpecKit for feature development. Always follow the workflow:

1. `/speckit.specify` - Create feature specification (outputs `spec.md`)
2. `/speckit.plan` - Generate implementation plan (outputs `plan.md` with architecture/design)
3. `/speckit.tasks` - Create actionable task breakdown (outputs `tasks.md`)
4. `/speckit.implement` - Execute implementation based on tasks

Current feature specifications are in `specs/001-lottery-sandbox/`.

## Project Constitution

All code must adhere to the project constitution defined in `.specify/constitution.md`. Key principles:

### 1. Type Safety & Code Quality (CRITICAL)
- 100% TypeScript coverage with strict mode
- No `any` types (use `unknown` with type guards if needed)
- Validation at all boundaries (Zod for frontend, class-validator for backend)
- Zero ESLint warnings required
- Minimum 80% test coverage; 100% for critical logic (commission calculations, quota management, bet validation)

### 2. User Experience & Accessibility (CRITICAL)
- Mobile-first design (375px minimum width)
- Touch optimization: 44x44px minimum tap targets
- Performance targets:
  - Page Load < 2s (p95)
  - Time to Interactive < 3s
  - API Response < 200ms (p95)
- WCAG 2.1 AA compliance
- Color contrast ≥ 4.5:1
- Semantic HTML + keyboard navigation

### 3. Security & Data Integrity (CRITICAL)
- JWT authentication (15min access, 7day refresh tokens)
- Password hashing with bcrypt (cost factor 12)
- Rate limiting (5 attempts/15min)
- RBAC with NestJS guards on all endpoints
- Row-level security for data isolation
- Parameterized queries (Prisma)
- Audit logging for financial operations

## Important Notes

### Mobile-First Design
- **100% mobile users** - all interfaces must be optimized for mobile devices
- Test on iOS Safari and Android Chrome
- Use bottom sheets, swipe gestures, and large touch targets
- Optimize for one-handed operation

### Performance Optimization
- Astro inlines stylesheets for faster initial paint
- Google Fonts preconnected and DNS prefetched
- Terser removes console logs and debuggers in production
- Animations respect `prefers-reduced-motion`

### Internationalization
- Current demo uses Traditional Chinese (zh-TW)
- All text hardcoded in demo; production will use localization resources
- Never use hardcoded strings in production code (follow global CLAUDE.md instructions)

### Animation & UX
- Custom animations prevent flash on load (FOUC)
- Safe area insets handle notched devices (iPhone X+)
- Active states provide tactile feedback
- Loading states required for all async operations

## Key Files to Review

- `demo/src/layouts/Layout.astro` - Base layout pattern with header/navigation
- `demo/src/styles/global.css` - Design system and utility classes
- `demo/tailwind.config.mjs` - Theme configuration and animations
- `specs/001-lottery-sandbox/spec.md` - Feature specification for production system
- `specs/001-lottery-sandbox/plan.md` - Implementation plan and architecture
- `.specify/constitution.md` - Project principles and standards (first 80 lines cover critical requirements)
