# Product Requirements Document (PRD)
## Multi-Level Agent Lottery Sandbox System

**Version:** 1.0
**Date:** 2025-11-17
**Status:** Brainstorm / Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Core Features](#core-features)
4. [Technical Architecture](#technical-architecture)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Feature Breakdown](#feature-breakdown)
7. [Development Roadmap](#development-roadmap)

---

## Executive Summary

### Vision
Create a unified, all-in-one lottery sandbox platform that combines all betting methods (4D, 5D, 6D, Lotto games) from Malaysia and Singapore service providers with a sophisticated multi-level agent system, quota management, and comprehensive backoffice administration.

### Key Objectives
- **Unified Platform:** Single interface for all lottery providers (Magnum, Sports Toto, Damacai, Singapore Pools)
- **Multi-Level Agent System:** Hierarchical agent structure with upline/downline management
- **Quota-Based System:** No real money involved, pure quota allocation and management
- **Official Results Sync:** Automatic synchronization with official lottery results
- **Comprehensive Management:** Full backoffice for moderators to manage agents, quotas, and commissions

### Target Users
- **Moderators/Admins:** System administrators who manage agents and system settings
- **Agents:** Primary users who place bets and manage sub-agents
- **Sub-Agents:** Downline agents with limited quotas from upline agents

---

## System Overview

### Current State Analysis

**Existing Features:**
- Basic betting interface (simple & detailed input modes)
- Game type selection (3D, 4D, 5D, 6D)
- Multi-provider selection (M, P, T, S)
- User profile with basic agent info
- Mock data for bets, results, winnings
- Basic transaction history
- Results calendar view

**Technology Stack:**
- Frontend: Astro + Alpine.js + Tailwind CSS
- Current Architecture: Static pages with mock data
- Language: Chinese (Traditional) with multi-language support

### Target State

**Enhanced Platform:**
- Full backend API integration
- Real-time quota management
- Multi-level agent hierarchy
- Automated result synchronization
- Comprehensive backoffice system
- Advanced reporting and analytics
- Role-based access control

---

## Core Features

### 1. Multi-Level Agent System (MLM Structure)

#### 1.1 Agent Hierarchy
- **Moderator Level (L0)**
  - System administrator
  - Can create Level 1 agents
  - Unlimited quota allocation capability
  - Full system access
  - Global configuration management

- **Agent Levels (L1-L5)**
  - L1: Primary agents (created by moderators)
  - L2-L5: Sub-agents (created by upper-level agents)
  - Each level can create one level below
  - Quota cascades from upline to downline
  - Commission structure per level

#### 1.2 Agent Management Features
- Create agent accounts
- Set agent levels and upline relationships
- Assign quota limits (daily/weekly/monthly)
- Configure commission rates per agent
- View agent hierarchy tree
- Agent performance dashboard
- Suspend/activate agent accounts
- Transfer agents between uplines

#### 1.3 Commission Structure
- Multi-level commission calculation
- Configurable commission rates per level
- Commission based on downline betting volume
- Commission tracking and reporting
- Commission payout history
- Override commission rules per agent

---

### 2. Quota Management System

#### 2.1 Quota Allocation
- **Moderator Controls:**
  - Set total quota for L1 agents
  - Define quota reset periods (daily/weekly/monthly)
  - Emergency quota adjustments
  - Quota allocation history

- **Agent Controls:**
  - Allocate quota to downline agents
  - Cannot exceed own remaining quota
  - Real-time quota tracking
  - Quota usage notifications

#### 2.2 Quota Features
- Real-time quota balance display
- Used vs. remaining quota tracking
- Quota allocation history
- Quota transfer between same-level agents (admin approval)
- Quota reset automation
- Quota expiration warnings
- Quota usage analytics

#### 2.3 Quota Rules
- Parent quota >= Sum of children quotas
- Bet amount deducted from quota immediately
- Winning amounts do NOT add to quota (sandbox mode)
- Quota resets based on configured schedule
- Negative quota prevention
- Quota hold for pending bets

---

### 3. Comprehensive Betting System

#### 3.1 Game Types Support
**Based on LOTTERY_SYSTEMS_REFERENCE.md:**

**Malaysia Providers:**
- **Magnum 4D:**
  - Classic 4D (Big/Small)
  - 4D Jackpot
  - 4D Jackpot Gold
  - Magnum Life

- **Sports Toto:**
  - Toto 4D, 5D, 6D
  - Star Toto 6/50
  - Power Toto 6/55
  - Supreme Toto 6/58
  - 4D Jackpot, 4D Zodiac

- **Damacai:**
  - 1+3D, Super 1+3D
  - 3D, 3+3D Bonus
  - 1+3D Jackpot, DMC Jackpot, 3D Jackpot

**Singapore Provider:**
- **Singapore Pools:**
  - 4D (Big/Small)
  - TOTO
  - Singapore Sweep

#### 3.2 Bet Types Support
- **Big/Small Bets (ABC/A)**
- **iBox/iBet:** Permutation betting (24/12/6/4 combinations)
- **iPerm:** Individual permutation bets
- **System Entry:** Multiple number combinations
- **Roll Bets:** Rolling digit/number
- **Quick Pick:** Random number selection
- **Ordinary Entry:** Standard betting

#### 3.3 Betting Interface Features
- **Simple Mode:** Text-based quick input
- **Detailed Mode:** Grid-based form input
- **Multi-Provider Selection:** Select multiple providers in one bet
- **Batch Betting:** Multiple numbers in single transaction
- **Saved Number Templates:** Quick access to frequent numbers
- **Bet Validation:** Real-time validation before submission
- **Bet Confirmation:** Review before final submission
- **Bet Receipt:** Unique ID and QR code for each bet

#### 3.4 Betting Management
- View pending bets
- Cancel pending bets (before draw time)
- Edit pending bets
- Duplicate previous bets
- Betting history with filters
- Bet search by number/date/provider
- Bet statistics and patterns

---

### 4. Result Management System

#### 4.1 Result Synchronization
- **Automatic Sync:**
  - Scheduled API calls to official sources
  - Real-time result updates after draw time
  - Support for all providers simultaneously
  - Result verification and validation
  - Error handling and retry mechanism

- **Manual Entry:**
  - Backoffice manual result input (backup)
  - Bulk result import (CSV/Excel)
  - Result correction capability
  - Result approval workflow

#### 4.2 Result Features
- Results calendar view (current system)
- Today's results highlight
- Historical results search
- Result notifications (push/email)
- Result comparison across providers
- Draw schedule display
- Special draw announcements

#### 4.3 Winning Calculation
- Automatic winning detection after result sync
- Prize calculation based on bet type
- Commission calculation for agent chain
- Winning notification to users
- Winning history and claims
- Prize breakdown display

---

### 5. Backoffice / Admin Panel

#### 5.1 Dashboard
- **Overview Metrics:**
  - Total agents by level
  - Total quota allocated/used
  - Total bets today/this week/this month
  - Total winnings
  - Commission summary
  - Active users count
  - System health status

- **Quick Actions:**
  - Create new agent
  - Adjust quotas
  - View pending approvals
  - Manual result entry
  - System announcements

#### 5.2 Agent Management Module
- **Agent List:**
  - Searchable/filterable agent table
  - Agent hierarchy tree view
  - Agent status (active/suspended/inactive)
  - Quick edit agent details

- **Agent Details:**
  - Profile information
  - Quota allocation history
  - Betting history
  - Winning history
  - Commission earnings
  - Downline agent list
  - Performance metrics

- **Agent Actions:**
  - Create/edit/delete agents
  - Set quota limits
  - Configure commission rates
  - Assign/change upline
  - Suspend/activate account
  - Reset password
  - View activity logs

#### 5.3 Quota Management Module
- Global quota allocation dashboard
- Quota distribution by level/agent
- Quota usage analytics
- Quota reset configuration
- Quota adjustment history
- Quota alerts and notifications
- Emergency quota top-up

#### 5.4 Commission Management Module
- Commission structure configuration
- Commission rate by level
- Commission calculation rules
- Commission payout tracking
- Commission reports
- Commission adjustments
- Commission dispute resolution

#### 5.5 System Configuration Module
- **General Settings:**
  - System name and branding
  - Language settings
  - Currency settings
  - Timezone configuration
  - Maintenance mode

- **Game Settings:**
  - Enable/disable providers
  - Enable/disable game types
  - Draw schedule configuration
  - Bet closing time rules
  - Minimum/maximum bet amounts

- **Result Settings:**
  - Auto-sync schedule
  - API endpoints configuration
  - Result verification rules
  - Manual entry permissions

- **User Settings:**
  - Password policies
  - Session timeout
  - Login attempt limits
  - Multi-factor authentication

#### 5.6 Reports & Analytics Module
- **Betting Reports:**
  - Bets by provider
  - Bets by game type
  - Bets by date range
  - Bets by agent/level
  - Popular numbers analysis

- **Financial Reports:**
  - Quota usage reports
  - Commission reports
  - Win/loss reports
  - Agent performance reports
  - Revenue projections (quota-based)

- **Agent Reports:**
  - Agent activity reports
  - Agent ranking reports
  - Downline performance reports
  - Commission earnings reports

- **Export Options:**
  - PDF export
  - Excel export
  - CSV export
  - Email scheduled reports

#### 5.7 System Logs & Audit
- User activity logs
- Bet transaction logs
- Quota adjustment logs
- Result sync logs
- System error logs
- Security logs
- Audit trail for all critical actions

---

### 6. Frontend User Features

#### 6.1 Authentication & Authorization
- **Login System:**
  - Username/password authentication
  - Remember me functionality
  - Password reset via email/SMS
  - Multi-factor authentication (optional)
  - Session management

- **Registration:**
  - Agent registration (invite-only)
  - Registration approval workflow
  - Email/phone verification

#### 6.2 User Dashboard
- **Overview Cards:**
  - Quota summary (total/used/remaining)
  - Pending bets count
  - Recent winnings
  - Commission earnings
  - Downline agent count

- **Quick Actions:**
  - Place bet (simple/detailed)
  - View results
  - Check winnings
  - View downline performance
  - Create sub-agent

#### 6.3 Profile Management
- Edit profile information
- Change password
- Language preference
- Display preferences (font size, theme)
- Notification settings
- Odds table display
- Timezone settings

#### 6.4 Betting Interface (Enhanced)
**Current + New Features:**
- Simple text-based input mode (existing)
- Detailed grid input mode (existing)
- Provider selection with visual cards
- Game type tabs with descriptions
- Bet type selector with previews
- Number quick pick
- Favorite numbers
- Number validation
- Bet amount calculator
- Quota check before submission
- Bet summary preview
- Multiple bet cart
- Saved bet templates

#### 6.5 Results & Winnings
- **Results Calendar:** (existing, enhanced)
  - Monthly view
  - Daily view
  - Multi-provider toggle
  - Special draw highlights

- **My Winnings:**
  - Winning bets list
  - Prize breakdown
  - Claim status
  - Total winnings summary
  - Winnings by provider/game type

- **Result Notifications:**
  - Push notifications
  - Email notifications
  - SMS notifications (optional)
  - Winning alerts

#### 6.6 Transaction History
- **Accounts/Statements:**
  - All transactions (bets, winnings, commissions)
  - Filter by date range
  - Filter by transaction type
  - Search functionality
  - Export to PDF/Excel

- **Bet History:**
  - Pending bets
  - Won bets
  - Lost bets
  - Cancelled bets
  - Bet details view

#### 6.7 Downline Management (for Agents)
- **Downline Dashboard:**
  - List of direct downline agents
  - Downline quota allocation
  - Downline performance summary
  - Commission from downlines

- **Create Sub-Agent:**
  - Sub-agent registration form
  - Quota allocation
  - Commission rate setting
  - Approval workflow

- **Manage Sub-Agents:**
  - View sub-agent details
  - Adjust sub-agent quota
  - View sub-agent bets
  - Sub-agent performance reports

#### 6.8 Commission Tracking
- **Commission Dashboard:**
  - Total commission earned
  - Commission by period
  - Commission by downline
  - Commission breakdown

- **Commission History:**
  - Commission transactions
  - Commission calculation details
  - Commission payout status

#### 6.9 Reports (User Level)
- Personal betting statistics
- Win/loss ratio
- Favorite numbers analysis
- Betting patterns
- Monthly summaries
- Quota usage trends

---

### 7. Advanced Features

#### 7.1 Notification System
- **Push Notifications:**
  - Bet confirmation
  - Draw results available
  - Winning notifications
  - Quota low warnings
  - Quota reset notifications
  - System announcements

- **Email Notifications:**
  - Daily/weekly summaries
  - Result notifications
  - Commission reports
  - Account activities

- **SMS Notifications (Optional):**
  - Critical alerts
  - Winning notifications
  - OTP for authentication

#### 7.2 Favorites & Templates
- Save favorite numbers
- Create bet templates
- Quick bet from history
- Number patterns library
- Lucky number generator

#### 7.3 Social Features
- **Leaderboards:**
  - Top winners
  - Top agents by volume
  - Top lucky numbers

- **Sharing:**
  - Share bet receipt
  - Share winning receipt
  - Referral system

#### 7.4 Mobile Optimization
- Responsive design (already in progress)
- Mobile-first approach
- Touch-optimized interfaces
- Offline mode for viewing history
- Progressive Web App (PWA) capability

#### 7.5 Multi-Language Support
- Chinese (Traditional) - current
- English
- Bahasa Melayu
- Language switcher
- RTL support if needed

#### 7.6 Multi-Currency Support
- MYR (Malaysian Ringgit)
- SGD (Singapore Dollar)
- Currency conversion display
- Currency-based reporting

---

### 8. Security Features

#### 8.1 Authentication Security
- Password hashing (bcrypt/argon2)
- Session token management
- JWT for API authentication
- Refresh token mechanism
- Brute force protection
- CAPTCHA on login

#### 8.2 Authorization
- Role-based access control (RBAC)
- Permission-based actions
- API endpoint protection
- Sensitive data encryption

#### 8.3 Data Protection
- HTTPS enforcement
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting
- Input validation and sanitization

#### 8.4 Audit & Compliance
- Activity logging
- Audit trails
- Data retention policies
- GDPR compliance (if applicable)
- Data export for users

---

### 9. Integration Requirements

#### 9.1 External APIs
- **Lottery Result APIs:**
  - Magnum 4D API (if available)
  - Sports Toto API (if available)
  - Damacai API (if available)
  - Singapore Pools API (if available)
  - Third-party result aggregator APIs

- **Notification Services:**
  - Email service (SMTP/SendGrid/Mailgun)
  - SMS gateway (Twilio/Nexmo)
  - Push notification service (Firebase/OneSignal)

#### 9.2 Internal APIs
- RESTful API for frontend-backend communication
- WebSocket for real-time updates
- GraphQL (optional, for complex queries)

#### 9.3 Database Integration
- Primary database (PostgreSQL/MySQL)
- Cache layer (Redis)
- Session storage
- File storage (S3/local)

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile Web  │  │  Admin Panel │      │
│  │  (Astro/Vue) │  │   (PWA)      │  │   (React)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│            (Authentication, Rate Limiting, Routing)          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────┐ │
│  │   User     │ │  Betting │ │   Agent    │ │  Result   │ │
│  │  Service   │ │  Service │ │  Service   │ │  Service  │ │
│  └────────────┘ └──────────┘ └────────────┘ └───────────┘ │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────┐ │
│  │   Quota    │ │Commission│ │   Report   │ │   Notify  │ │
│  │  Service   │ │  Service │ │  Service   │ │  Service  │ │
│  └────────────┘ └──────────┘ └────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Database   │  │  Cache Layer │  │ File Storage │      │
│  │ (PostgreSQL) │  │   (Redis)    │  │   (S3/Local) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Result APIs │  │ Email/SMS    │  │  Analytics   │      │
│  │  (Official)  │  │   Services   │  │   Services   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Recommendations

#### Frontend
- **Current:** Astro + Alpine.js + Tailwind CSS
- **Recommended Enhancement:**
  - Keep Astro for static pages
  - Add Vue 3/React for complex interactive components
  - Keep Alpine.js for simple interactivity
  - Tailwind CSS for styling (existing)
  - Chart.js / ApexCharts for data visualization

#### Backend
- **Options:**
  - **Node.js + Express/Fastify**
    - Pros: JavaScript ecosystem, fast development, good for real-time
  - **Python + FastAPI**
    - Pros: Great for data processing, ML-ready, strong typing
  - **PHP + Laravel**
    - Pros: Mature ecosystem, good admin panels
  - **Go + Gin/Fiber**
    - Pros: High performance, easy deployment

- **Recommendation:** Node.js + Express/NestJS
  - Consistent with frontend (JavaScript)
  - Rich ecosystem
  - Good real-time support (WebSocket)

#### Database
- **Primary:** PostgreSQL
  - ACID compliance
  - JSON support
  - Good for relational data (agents, bets, etc.)

- **Cache:** Redis
  - Session storage
  - Real-time quota tracking
  - Rate limiting
  - Job queue

#### Authentication
- JWT tokens
- Refresh token rotation
- Redis for token blacklist

#### Real-Time Features
- WebSocket (Socket.io)
- Server-Sent Events (SSE)
- For live result updates and quota changes

---

## User Roles & Permissions

### Role Hierarchy

```
Moderator (L0)
    │
    ├─── Agent L1
    │       ├─── Agent L2
    │       │       ├─── Agent L3
    │       │       │       ├─── Agent L4
    │       │       │       │       └─── Agent L5
    │       │       │       └─── Agent L4
    │       │       └─── Agent L3
    │       └─── Agent L2
    └─── Agent L1
```

### Permission Matrix

| Feature | Moderator | Agent L1-L5 | Notes |
|---------|-----------|-------------|-------|
| **Betting** |
| Place bets | ✓ | ✓ | Within quota limits |
| Cancel own bets | ✓ | ✓ | Before draw time |
| View bet history | ✓ | ✓ | Own bets only (agents) |
| **Agent Management** |
| Create agents | ✓ | ✓ (level+1) | Agents can create one level below |
| View all agents | ✓ | Own downlines only | |
| Edit agent details | ✓ | Own downlines only | |
| Suspend agents | ✓ | Own downlines only | |
| Delete agents | ✓ | ✗ | Only moderator |
| **Quota Management** |
| Set global quotas | ✓ | ✗ | |
| Allocate to downlines | ✓ | ✓ | Within own quota |
| View quota usage | ✓ | ✓ (own + downlines) | |
| Adjust quotas | ✓ | ✓ (downlines only) | |
| **Commission** |
| Configure rates | ✓ | ✗ | |
| View commission | ✓ | ✓ (own only) | |
| Override commission | ✓ | ✗ | |
| **Results** |
| View results | ✓ | ✓ | All users |
| Manual result entry | ✓ | ✗ | |
| Edit results | ✓ | ✗ | |
| **Reports** |
| System-wide reports | ✓ | ✗ | |
| Own reports | ✓ | ✓ | |
| Downline reports | ✓ | ✓ | |
| Export reports | ✓ | ✓ (limited) | |
| **System Config** |
| System settings | ✓ | ✗ | |
| Game configuration | ✓ | ✗ | |
| View logs | ✓ | ✗ | |
| Announcements | ✓ | ✗ | |

---

## Feature Breakdown

### Phase 1: Core Foundation (MVP)

#### 1.1 Authentication & User Management
- [ ] User login/logout
- [ ] Password management
- [ ] Session management
- [ ] Basic profile management

#### 1.2 Basic Agent System
- [ ] Agent creation (L0 → L1 only)
- [ ] Agent hierarchy storage
- [ ] Basic upline/downline relationship

#### 1.3 Simple Quota System
- [ ] Quota allocation to L1 agents
- [ ] Quota tracking (used/remaining)
- [ ] Quota deduction on bet placement

#### 1.4 Basic Betting
- [ ] 4D betting (Magnum, Sports Toto, Damacai only)
- [ ] Big/Small bet types only
- [ ] Simple bet submission
- [ ] Bet history

#### 1.5 Basic Result System
- [ ] Manual result entry (admin)
- [ ] Result display
- [ ] Basic winning calculation

### Phase 2: Extended Features

#### 2.1 Multi-Level Agents (L1-L5)
- [ ] Create agents up to 5 levels
- [ ] Quota cascade to all levels
- [ ] Downline management interface

#### 2.2 Commission System
- [ ] Commission rate configuration
- [ ] Multi-level commission calculation
- [ ] Commission tracking

#### 2.3 Extended Game Support
- [ ] All Malaysia game types (5D, 6D, Lotto)
- [ ] Singapore Pools (4D, TOTO, Sweep)
- [ ] All bet types (iBox, iPerm, System, Roll)

#### 2.4 Auto Result Sync
- [ ] API integration with result sources
- [ ] Scheduled result sync
- [ ] Automatic winning calculation

### Phase 3: Advanced Features

#### 3.1 Backoffice Admin Panel
- [ ] Complete admin dashboard
- [ ] Advanced agent management
- [ ] System configuration UI
- [ ] Comprehensive reporting

#### 3.2 Advanced Betting Features
- [ ] Bet templates
- [ ] Batch betting
- [ ] Number favorites
- [ ] Smart number suggestions

#### 3.3 Notifications
- [ ] Push notifications
- [ ] Email notifications
- [ ] SMS notifications (optional)

#### 3.4 Analytics & Reporting
- [ ] Advanced reports
- [ ] Data visualization
- [ ] Export capabilities
- [ ] Scheduled reports

### Phase 4: Optimization & Polish

#### 4.1 Performance
- [ ] Caching implementation
- [ ] Database optimization
- [ ] Load testing
- [ ] CDN integration

#### 4.2 Security Hardening
- [ ] Security audit
- [ ] Penetration testing
- [ ] Compliance checks

#### 4.3 Mobile Optimization
- [ ] PWA implementation
- [ ] Mobile UI refinements
- [ ] Offline capabilities

#### 4.4 Advanced Features
- [ ] Leaderboards
- [ ] Social sharing
- [ ] Advanced analytics
- [ ] AI number prediction (optional)

---

## Data Models (High-Level)

### Core Entities

#### User/Agent
```
- id
- username
- password_hash
- email
- phone
- role (moderator/agent)
- level (0-5)
- upline_id (reference to parent agent)
- quota_daily
- quota_weekly
- quota_monthly
- quota_used
- commission_rate
- status (active/suspended/inactive)
- created_at
- updated_at
```

#### Quota Transaction
```
- id
- agent_id
- transaction_type (allocation/deduction/reset/adjustment)
- amount
- balance_before
- balance_after
- reference_id (bet_id if deduction)
- created_by
- notes
- created_at
```

#### Bet
```
- id
- agent_id
- bet_date
- draw_date
- game_type (4D/5D/6D/TOTO/etc)
- provider (M/P/T/S)
- bet_type (BIG/SMALL/IBOX/SYSTEM/etc)
- numbers (JSON array)
- bet_amounts (JSON object)
- total_amount
- status (pending/won/lost/cancelled)
- result_id (reference to result)
- winning_amount
- created_at
- updated_at
```

#### Result
```
- id
- draw_date
- provider (M/P/T/S)
- game_type (4D/5D/6D/TOTO/etc)
- results (JSON object with all prize tiers)
- sync_status (manual/auto/verified)
- synced_at
- created_at
```

#### Commission
```
- id
- agent_id
- source_agent_id (which downline generated this)
- bet_id (reference to bet)
- commission_rate
- bet_amount
- commission_amount
- period (date)
- status (pending/paid)
- created_at
```

#### Report
```
- id
- report_type
- agent_id (null for system-wide)
- period_start
- period_end
- data (JSON)
- generated_at
```

---

## API Endpoints (High-Level)

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/password/reset
POST   /api/auth/password/change
```

### Agents
```
GET    /api/agents                  # List agents (with filters)
POST   /api/agents                  # Create agent
GET    /api/agents/:id              # Get agent details
PUT    /api/agents/:id              # Update agent
DELETE /api/agents/:id              # Delete agent
GET    /api/agents/:id/downlines    # Get downline tree
GET    /api/agents/:id/performance  # Performance metrics
POST   /api/agents/:id/suspend      # Suspend agent
POST   /api/agents/:id/activate     # Activate agent
```

### Quota
```
GET    /api/quota/balance           # Get own quota balance
GET    /api/quota/history           # Quota transaction history
POST   /api/quota/allocate          # Allocate quota to downline
GET    /api/quota/downlines         # Downlines quota summary
POST   /api/quota/adjust (admin)    # Manual quota adjustment
```

### Betting
```
POST   /api/bets                    # Place bet
GET    /api/bets                    # List bets (with filters)
GET    /api/bets/:id                # Get bet details
DELETE /api/bets/:id                # Cancel bet (if pending)
GET    /api/bets/pending            # Pending bets
GET    /api/bets/history            # Bet history
POST   /api/bets/validate           # Validate bet before submit
```

### Results
```
GET    /api/results                 # List results (with filters)
GET    /api/results/latest          # Latest results
GET    /api/results/today           # Today's results
GET    /api/results/:date           # Results by date
POST   /api/results (admin)         # Manual result entry
POST   /api/results/sync (admin)    # Trigger result sync
```

### Winnings
```
GET    /api/winnings                # My winnings
GET    /api/winnings/:id            # Winning details
GET    /api/winnings/summary        # Winnings summary
```

### Commission
```
GET    /api/commissions             # My commissions
GET    /api/commissions/summary     # Commission summary
GET    /api/commissions/downlines   # Commission by downline
```

### Reports
```
POST   /api/reports/generate        # Generate report
GET    /api/reports                 # List saved reports
GET    /api/reports/:id             # Get report
GET    /api/reports/:id/export      # Export report (PDF/Excel)
```

### Admin
```
GET    /api/admin/dashboard         # Admin dashboard stats
GET    /api/admin/agents            # All agents management
POST   /api/admin/settings          # Update system settings
GET    /api/admin/logs              # System logs
POST   /api/admin/announcement      # Create announcement
```

---

## UI/UX Enhancements

### Design Principles
1. **Mobile-First:** Optimize for mobile screens (primary use case)
2. **Simplicity:** Clean, uncluttered interface
3. **Speed:** Fast loading, minimal interactions
4. **Clarity:** Clear visual hierarchy, easy to understand
5. **Consistency:** Consistent patterns across all pages

### Key UI Components to Develop

#### 1. Agent Hierarchy Visualizer
- Tree view of agent structure
- Interactive node expansion
- Quick stats on each node
- Visual quota flow

#### 2. Quota Widget
- Real-time quota display
- Visual gauge/progress bar
- Quick allocation interface
- Quota distribution chart

#### 3. Betting Interface Improvements
- Provider cards with branding
- Game type visual selector
- Number pad with smart input
- Bet summary sidebar
- Quick bet templates

#### 4. Results Display
- Calendar heatmap
- Provider-tabbed view
- Number highlighting
- Winning number alerts

#### 5. Dashboard Widgets
- Stat cards with icons
- Mini charts (sparklines)
- Quick action buttons
- Recent activity feed

#### 6. Admin Tables
- Sortable columns
- Advanced filters
- Bulk actions
- Export buttons
- Inline editing

---

## Development Roadmap

### Milestone 1: Foundation (Weeks 1-4)
**Goal:** Basic working system with single-level agents

**Deliverables:**
- [ ] Database schema design
- [ ] Backend API setup (authentication, users, agents L1)
- [ ] Basic frontend (login, dashboard, profile)
- [ ] Simple betting (4D Big/Small only)
- [ ] Manual result entry
- [ ] Basic quota system

**Success Criteria:**
- Moderator can create L1 agents
- L1 agents can place simple 4D bets
- Quota deduction works
- Manual results can be entered
- Winnings calculated correctly

---

### Milestone 2: Multi-Level System (Weeks 5-8)
**Goal:** Full 5-level agent hierarchy with quota cascade

**Deliverables:**
- [ ] Multi-level agent creation (L1-L5)
- [ ] Quota allocation to downlines
- [ ] Downline management UI
- [ ] Commission system (basic)
- [ ] Agent hierarchy visualization

**Success Criteria:**
- 5-level agent hierarchy works
- Quota cascades correctly
- Commissions calculated for multi-level
- Agents can manage their downlines

---

### Milestone 3: Complete Game Support (Weeks 9-12)
**Goal:** All game types and bet types supported

**Deliverables:**
- [ ] All Malaysia games (4D/5D/6D/Lotto)
- [ ] All Singapore games (4D/TOTO/Sweep)
- [ ] All bet types (iBox/iPerm/System/Roll)
- [ ] Advanced betting interface
- [ ] Bet templates and favorites

**Success Criteria:**
- All games from reference doc supported
- All bet types work correctly
- Prize calculation accurate for all types
- Betting interface user-friendly

---

### Milestone 4: Auto Results & Admin Panel (Weeks 13-16)
**Goal:** Automated system with full backoffice

**Deliverables:**
- [ ] Auto result sync (API integration)
- [ ] Complete admin dashboard
- [ ] Agent management interface
- [ ] System configuration UI
- [ ] Basic reporting

**Success Criteria:**
- Results sync automatically after draw time
- Admin can manage all agents from panel
- System settings configurable via UI
- Basic reports available

---

### Milestone 5: Advanced Features (Weeks 17-20)
**Goal:** Production-ready with advanced features

**Deliverables:**
- [ ] Notification system (push/email)
- [ ] Advanced reporting and analytics
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Mobile PWA

**Success Criteria:**
- Users receive timely notifications
- Comprehensive reports available
- System performs well under load
- Security audit passed
- PWA installable on mobile

---

### Milestone 6: Launch & Polish (Weeks 21-24)
**Goal:** Production launch

**Deliverables:**
- [ ] User acceptance testing
- [ ] Bug fixes and refinements
- [ ] Documentation (user + admin)
- [ ] Training materials
- [ ] Production deployment

**Success Criteria:**
- All critical bugs resolved
- Documentation complete
- System deployed to production
- Training completed
- Launch successful

---

## Success Metrics

### Technical Metrics
- **System Uptime:** 99.9%
- **API Response Time:** < 200ms (p95)
- **Page Load Time:** < 2s (p95)
- **Database Query Time:** < 50ms (p95)
- **Error Rate:** < 0.1%

### Business Metrics
- **Agent Adoption:** 100+ agents in 3 months
- **Daily Active Users:** 50+ within 1 month
- **Bets Placed:** 500+ per day
- **Quota Utilization:** 60%+ average
- **User Retention:** 80%+ monthly

### User Experience Metrics
- **User Satisfaction:** 4.5/5 stars
- **Feature Usage:** 70%+ features used regularly
- **Support Tickets:** < 5 per week
- **Training Completion:** 90%+ agents trained

---

## Risk Assessment

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Result API unavailable | High | Medium | Manual entry fallback + multiple API sources |
| Database performance | Medium | Low | Proper indexing + caching + monitoring |
| Security breach | High | Low | Regular audits + penetration testing |
| Data loss | High | Low | Regular backups + replication |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | User training + incentives |
| Complex UI | Medium | Medium | User testing + iterative design |
| Agent abuse (quota) | Medium | Medium | Monitoring + audit logs + limits |
| Result accuracy issues | High | Low | Verification workflow + manual override |

---

## Appendix

### A. Terminology Glossary

- **Quota:** Virtual credit allocation (not real money)
- **Agent:** User who can place bets and/or manage sub-agents
- **Upline:** Parent agent in hierarchy
- **Downline:** Child agents in hierarchy
- **Commission:** Earnings from downline betting activity
- **Moderator:** System administrator (L0)
- **Provider:** Lottery operator (Magnum/Sports Toto/Damacai/Singapore Pools)
- **Draw:** Lottery drawing event
- **Big Bet (ABC):** Bet type covering all 5 prize categories
- **Small Bet (A):** Bet type covering top 3 prize categories only
- **iBox/iBet:** Permutation betting system
- **Sandbox:** Practice/simulation environment (no real money)

### B. Reference Documents

1. **LOTTERY_SYSTEMS_REFERENCE.md** - Complete lottery rules and prize structures
2. **Existing codebase** - /demo folder with current implementation
3. **External APIs** - Official lottery result sources (TBD)

### C. Future Enhancements (Post-Launch)

- AI-powered number prediction
- Social features (chat, groups)
- Gamification (achievements, badges)
- Affiliate marketing tools
- White-label capabilities
- Mobile native apps (iOS/Android)
- Live draw streaming
- Blockchain integration for transparency
- Multi-tenant support
- Advanced analytics dashboard

---

## Conclusion

This PRD outlines a comprehensive multi-level agent lottery sandbox system that combines all betting methods from Malaysia and Singapore lottery providers into a unified platform. The system emphasizes:

1. **Flexibility:** Support for all game types and bet types
2. **Scalability:** Multi-level agent hierarchy (up to 5 levels)
3. **Control:** Quota-based system with granular management
4. **Automation:** Auto result sync and winning calculation
5. **Transparency:** Comprehensive reporting and audit trails
6. **User Experience:** Intuitive interfaces for all user roles

The phased development approach ensures a solid foundation with MVP features first, followed by incremental enhancements. The roadmap spans 24 weeks to production launch with clear milestones and success criteria.

**Next Steps:**
1. Review and approve this PRD
2. Finalize technical stack decisions
3. Set up development environment
4. Begin Milestone 1 development
5. Establish regular sprint cycles and reviews

---

**Document Control:**
- **Author:** Development Team
- **Reviewers:** Project Stakeholders
- **Approval Status:** Draft
- **Next Review Date:** TBD
- **Version History:**
  - v1.0 (2025-11-17): Initial brainstorm and planning document
