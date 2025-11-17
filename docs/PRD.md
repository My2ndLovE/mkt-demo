# Product Requirements Document (PRD)
## Lottery Practice Management System

**Version:** 1.0
**Date:** 2025-11-17
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Vision
A web-based lottery practice management system that simulates lottery betting operations for Malaysian/Singapore lottery games (4D, 3D, 5D, 6D). The system enables agents to practice betting operations in a sandbox environment with multi-level commission tracking, following official lottery results without involving real money.

### 1.2 Target Users
- **Agents**: Place bets, manage their sub-agents
- **Moderators**: Manage agent hierarchies, set commission rates, monitor operations
- **Administrators**: Full system access, oversee all moderators and agents

### 1.3 Key Objectives
- Provide risk-free lottery betting practice environment
- Implement multi-level marketing (MLM) commission structure
- Synchronize with official lottery results
- Track virtual profit/loss across agent hierarchies
- Weekly limit-based betting system (no balance, only limits)

---

## 2. Business Model

### 2.1 Commission Structure
- **Unlimited hierarchy levels**: Agent A1 > A2 > A3 > A4... (no limit)
- **Profit/Loss sharing**: Commission percentage applies to both wins and losses
- **Example**:
  - Agent A2 places $100 bet with 30% commission
  - Agent A2 keeps 30%, Agent A1 receives 70%
  - If bet wins $500 profit: A2 gets $150, A1 gets $350
  - If bet loses $100: A2 loses $30, A1 loses $70

### 2.2 Virtual Currency System
- No real money or credit involved
- **Weekly limit-based system**: Each agent has a betting limit (not balance)
- **Weekly reset**: Limits reset every Monday (Sunday is cutoff day)
- Moderators set individual agent limits
- Once limit is exhausted, agent cannot place more bets until weekly reset

### 2.3 Result Synchronization
- Fetch official lottery results via API
- Automatic result insertion into database
- System auto-calculates win/loss based on official results
- Support for multiple lottery providers (M, P, T, S, B, K, W, H, E)

---

## 3. User Roles & Permissions

### 3.1 Agent
**Capabilities:**
- Place bets (4D, 3D, 5D, 6D) across multiple lottery providers
- View bet history and results
- Query/search orders by various criteria (date, number, receipt #)
- View personal performance (成绩)
- Cancel pending bets
- Create and manage sub-agents (if permitted by moderator)
- Print bet receipts

**Limitations:**
- Weekly betting limit set by moderator
- Can only view data within their hierarchy
- Cannot access other moderators' agent data

### 3.2 Moderator
**Capabilities:**
- Create and manage agent accounts under their organization
- Set commission percentages for each agent
- Set weekly betting limits for agents
- Configure agent hierarchy (upper/lower relationships)
- View all agents and bets under their organization
- Access 6 key reports (live stats & historical)
- Cannot view other moderators' data

**Limitations:**
- Cannot access admin functions
- Isolated from other moderators' organizations

### 3.3 Administrator
**Capabilities:**
- Full system access
- View all moderators and their organizations
- View all agents across all moderators
- Override any moderator decision
- System configuration and maintenance
- Access all reports and analytics
- Manage lottery result API integration

---

## 4. Core Features

### 4.1 Betting System (幸运 Module)

#### 4.1.1 Bet Entry Modes
1. **Manual Entry (简单输入)**
   - Direct number input with keypad
   - Support for special notations:
     - `D` = Current period
     - `#123` = Specific number
     - `1234#1` = Number with multiplier
     - `*0001` = Range notation (0001, 0010, 0100, 1000)
     - `**0001` = IBOX conversion
     - `1234*` = Reverse permutation (1234, 4321)
     - Various permutation shortcuts

2. **Batch Entry (自由输入)**
   - Import multiple bets at once
   - Support complex betting patterns
   - Bulk processing

#### 4.1.2 Bet Configuration
- **Game Type Selection**: 3D, 4D, 5D, 6D
- **Draw Type**: D, D2, D3, D4, D5
- **Bet Types**: M, P, T, S, B, K, W, H, E
- **Currency**: MYR, SGD
- **Lottery Providers**:
  - M (Magnum)
  - P (Sports Toto/Pan Malaysia)
  - T (Damacai/Toto)
  - S (Singapore)
  - B (Big Sweep)
  - K, W, H, E (Other providers)
- **Amount Entry**: Flexible amount input per bet
- **Number Columns**: Support B, S, A1 columns (Big, Small, Consolation)

#### 4.1.3 Bet Validation
- Check against agent's weekly limit
- Validate number format based on game type
- Prevent duplicate bets
- Real-time limit calculation

### 4.2 Query System (查询 Module)

#### 4.2.1 Search Criteria
- **Date Range**: From/To date picker
- **Receipt Number**: Search by order ID/receipt #
- **Phone Number**: Search by phone number
- **Number Sequence**: Search by bet numbers
- **Game Type**: Filter by 4D, 3D, 5D, 6D
- **Member/Agent**: Filter by specific agent
- **Status**: Won/Lost/Pending
- **Lottery Provider**: Filter by M, P, T, S, B, etc.
- **Source**: Filter by source/origin

#### 4.2.2 Search Results Display
- Comprehensive bet details
- Win/loss status
- Commission breakdown
- Print functionality

### 4.3 Cancellation System (取消 Module)

#### 4.3.1 Cancel Options
- Cancel by single bet
- Cancel by batch/multiple selection
- Date-based cancellation
- Filter before cancel (game type, provider, status)

#### 4.3.2 Cancellation Rules
- Only pending bets can be cancelled
- Cannot cancel after draw deadline
- Automatic limit restoration upon cancellation
- Audit trail for all cancellations

### 4.4 Results Display (中奖 Module)

#### 4.4.1 Result Features
- Display official lottery results
- Match user bets against results
- Calculate winnings automatically
- Show payout breakdown by prize category
- Historical result archive

#### 4.4.2 Prize Categories (4D Example)
- A1 (First Prize) = -6000x
- A2 (Second Prize) = -6000x
- A3 (Third Prize) = -6000x
- A4 (Starter Prize) = 600x
- A5 (Consolation Prize) = 600x

### 4.5 Performance Summary (成绩 Module)

#### 4.5.1 Performance Metrics
- Calendar view with daily results
- Total bets placed
- Win/loss summary
- Period selection (D7, D23, specific date ranges)
- Breakdown by:
  - Game type
  - Lottery provider
  - Date/period
  - Number patterns

#### 4.5.2 Performance Display
- Line-by-line breakdown (L1, L2, L3...)
- Bet details with results
- Print and share functionality

### 4.6 Total Calculation (总额 Module)

#### 4.6.1 Summary Display
- Real-time total calculation
- Breakdown by:
  - Game type (3D, 4D, 5D, 6D)
  - Lottery provider
  - Currency
- Grand total across all bets
- Export/print functionality

---

## 5. Reporting System (Back Office)

### 5.1 Live Stats Reports (实时数据)

#### 5.1.1 Report A-1: Rough Stats (粗字)
**Purpose**: Overview of betting activity by date
**Filters**:
- Date selection
- Currency (MYR/SGD)
- Game type (4D)
- Member filter
- Limit (top 50)
- Status filter
- Details level
- Number filter (specific numbers)
- Company filter

**Data Display**:
- Summary statistics
- Drill-down capability

#### 5.1.2 Report A-2: Inquiry/Search (查字)
**Purpose**: Detailed bet inquiry with multiple criteria
**Filters**:
- Date
- Game type (4D)
- Member
- Status (total/pending)
- Source
- Company

**Features**:
- Detailed search results
- Export capability

#### 5.1.3 Report A-3: Order Summary (总单)
**Purpose**: Complete order listing and summary
**Filters**:
- Order number
- Date
- Receipt number
- Number
- Type
- Channel
- Limit (50)
- Status (total/pending)
- Date range

**Display**:
- Comprehensive order details
- Print functionality

### 5.2 Historical Reports (历史数据)

#### 5.2.1 Report B-1: Results Calendar (成绩)
**Purpose**: Calendar-based result viewing with daily draw results
**Features**:
- Monthly calendar view
- Daily result numbers displayed
- Quick date navigation
- Result highlighting (won/lost)
- Drill-down to detailed results

#### 5.2.2 Report B-2: Winning Orders (中奖单)
**Purpose**: Report of all winning bets
**Filters**:
- Search type (won/not won)
- Currency
- Game type
- Date
- Company
- Member
- Number
- Source
- Report type (yes/no)

**Display**:
- Total winnings summary
- Breakdown by category

#### 5.2.3 Report B-3: 7-Day Member Account Summary (7天会员账目)
**Purpose**: Weekly performance summary for members/agents
**Filters**:
- Game type
- Currency
- Member/agent
- Date range (start/end)
- Company

**Display**:
- 7-day rolling summary
- Member name with hierarchy
- Categories: Total bets, Down line, Win, Points, Eating letters, Sales, Winning, Total
- Detailed breakdown for each category
- Export functionality

---

## 6. Agent Hierarchy Management

### 6.1 Hierarchy Structure
- Tree-based organization
- Unlimited depth levels
- Visual hierarchy display
- Commission cascading from bottom to top

### 6.2 Agent Creation Flow
1. Moderator creates new agent
2. Set agent details:
   - Username/Login ID
   - Password
   - Full name
   - Contact information
   - Upper agent (parent in hierarchy)
3. Set commission percentage (e.g., 30%, 70% goes to upper)
4. Set weekly betting limit
5. Assign permissions (can create sub-agents?)
6. Activate account

### 6.3 Commission Calculation
- Automatic calculation on bet placement
- Distribution across all upper levels
- Real-time tracking
- Historical commission reports
- Per-agent commission statements

---

## 7. Technology Stack & System Architecture

### 7.1 Selected Technology Stack

#### 7.1.1 Frontend - React Native
**Platform**: Cross-platform (iOS, Android, Web)

**Core Technologies**:
- **React Native** (v0.73+)
  - Single codebase for mobile and web
  - Native performance on iOS and Android
  - React Native Web for web platform
  - Hot reloading for fast development

- **TypeScript** (v5.x)
  - Type safety across entire application
  - Better IDE support and autocomplete
  - Reduced runtime errors

- **UI Framework**: React Native Paper or NativeBase
  - Pre-built Material Design components
  - Consistent UI across platforms
  - Theming support

- **Navigation**: React Navigation (v6.x)
  - Native stack navigation
  - Deep linking support
  - Screen transitions and animations

- **State Management**:
  - **Redux Toolkit** for global state
  - **React Query (TanStack Query)** for server state management
  - **Zustand** (alternative lightweight option)

- **Forms**: React Hook Form
  - Performance optimization
  - Easy validation
  - Minimal re-renders

**Additional Frontend Libraries**:
- **Date/Time**: date-fns or Day.js
- **Charts**: Victory Native or React Native Chart Kit
- **Icons**: React Native Vector Icons
- **Gestures**: React Native Gesture Handler
- **Async Storage**: @react-native-async-storage for offline data
- **Print**: React Native Print for bet receipts

#### 7.1.2 Backend - Node.js with NestJS
**Platform**: Node.js (v20 LTS)

**Core Framework**:
- **NestJS** (v10.x)
  - TypeScript-first framework
  - Dependency injection pattern
  - Modular architecture
  - Built-in validation with class-validator
  - Swagger/OpenAPI documentation
  - Excellent for complex business logic
  - MVC/DDD patterns support

**Authentication & Authorization**:
- **Passport.js** with JWT strategy
- **bcrypt** for password hashing
- **@nestjs/jwt** for token management
- Role-based access control (RBAC) implementation
- Session management with Redis

**Validation & Transformation**:
- **class-validator**: Request validation
- **class-transformer**: DTO transformation
- Custom validation pipes for betting rules

**API Documentation**:
- **@nestjs/swagger**: Auto-generated API documentation
- OpenAPI 3.0 specification

**Background Jobs**:
- **Bull**: Redis-based queue management
  - Result synchronization jobs
  - Commission calculation jobs
  - Weekly limit reset jobs
  - Report generation jobs

**Logging & Monitoring**:
- **Winston**: Advanced logging
- **Morgan**: HTTP request logging
- **Sentry**: Error tracking and monitoring

**Testing**:
- **Jest**: Unit and integration testing
- **Supertest**: E2E API testing
- **@nestjs/testing**: NestJS testing utilities

#### 7.1.3 Database - PostgreSQL
**Version**: PostgreSQL 16.x

**Why PostgreSQL**:
- ACID compliance for financial transactions
- Excellent support for complex queries
- JSON/JSONB support for flexible data
- Window functions for hierarchy calculations
- Reliable for critical betting data
- Strong community and ecosystem

**Database Tools**:
- **TypeORM** (v0.3.x): Primary ORM
  - TypeScript decorators
  - Migration support
  - Query builder
  - Repository pattern
  - Transaction management

**Database Features to Leverage**:
- **Recursive CTEs**: For unlimited hierarchy queries
- **Materialized Views**: For report performance
- **Indexes**: B-tree, GiST for optimization
- **Partitioning**: For bet history tables (by date)
- **Row-Level Security**: For moderator data isolation
- **Triggers**: For audit logging

**Schema Design Patterns**:
- **Soft deletes**: For audit trails
- **Timestamps**: created_at, updated_at on all tables
- **Version tracking**: For concurrent updates
- **Audit tables**: For critical operations

#### 7.1.4 Caching & Session - Redis
**Version**: Redis 7.x

**Use Cases**:
- Session storage
- JWT token blacklisting
- Weekly limit tracking (real-time)
- API response caching
- Bull queue backend
- Pub/Sub for real-time updates

**Redis Libraries**:
- **ioredis**: Node.js Redis client
- **@nestjs/cache-manager**: NestJS caching module
- **cache-manager-redis-store**: Redis store adapter

#### 7.1.5 API Integration Layer
**Lottery Result APIs**:
- **Axios**: HTTP client for external APIs
- **node-cron**: Scheduled result fetching
- Retry mechanism with exponential backoff
- Circuit breaker pattern for fault tolerance

**API Features**:
- Rate limiting protection
- Response caching
- Error handling and fallbacks
- Manual override capability

### 7.2 System Architecture

#### 7.2.1 Architecture Pattern
**Monolithic with Modular Design** (Phase 1-3)
- Single deployable application
- Clear module boundaries
- Easy to develop and deploy initially
- Can be split into microservices later if needed

**Future: Microservices Ready** (Phase 4+)
- Betting Service
- User/Auth Service
- Commission Calculation Service
- Reporting Service
- Result Synchronization Service

#### 7.2.2 Application Layers

```
┌─────────────────────────────────────────────────┐
│         React Native App (Mobile & Web)         │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │  Agent   │Moderator │  Admin   │  Common  │ │
│  │  Module  │  Module  │  Module  │   UI     │ │
│  └──────────┴──────────┴──────────┴──────────┘ │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│              API Gateway / Load Balancer         │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│            NestJS Backend Application            │
│  ┌──────────────────────────────────────────┐  │
│  │         Authentication Module             │  │
│  ├──────────────────────────────────────────┤  │
│  │  Users Module  │  Agents Module           │  │
│  ├──────────────────────────────────────────┤  │
│  │  Bets Module   │  Results Module          │  │
│  ├──────────────────────────────────────────┤  │
│  │  Commission Module │  Hierarchy Module    │  │
│  ├──────────────────────────────────────────┤  │
│  │  Reports Module │  Limits Module          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ▼
┌──────────────┬──────────────┬─────────────────┐
│  PostgreSQL  │    Redis     │  Bull Queues    │
│   Database   │    Cache     │  (Background)   │
└──────────────┴──────────────┴─────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│         External Lottery Result APIs             │
└─────────────────────────────────────────────────┘
```

#### 7.2.3 Module Structure (NestJS)

**Core Modules**:
1. **AuthModule**: JWT authentication, role guards, permissions
2. **UsersModule**: User management (agents, moderators, admins)
3. **HierarchyModule**: Agent tree structure, commission routing
4. **BetsModule**: Bet placement, validation, cancellation
5. **ResultsModule**: Result fetching, win/loss calculation
6. **CommissionModule**: Commission calculation and distribution
7. **LimitsModule**: Weekly limit tracking and reset
8. **ReportsModule**: All 6 reports generation
9. **NotificationsModule**: Email/SMS/Push notifications
10. **AuditModule**: Audit logging for critical operations

**Supporting Modules**:
- **ConfigModule**: Environment configuration
- **DatabaseModule**: TypeORM setup
- **CacheModule**: Redis caching
- **QueueModule**: Bull queue setup
- **HealthModule**: Health checks

### 7.3 Mobile-First Strategy

#### 7.3.1 Development Approach
**Single Codebase**: React Native for all platforms
- iOS native app
- Android native app
- Web app (React Native Web)
- Shared business logic
- Platform-specific components when needed

#### 7.3.2 Platform-Specific Optimizations
```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  }
});
```

#### 7.3.3 Web Deployment
- React Native Web compilation
- Responsive design for desktop/tablet/mobile
- SEO optimization with React Helmet
- PWA capabilities

### 7.4 DevOps & Deployment

#### 7.4.1 Version Control
- **Git**: Source control
- **GitHub/GitLab**: Repository hosting
- Branch strategy: GitFlow or Trunk-based

#### 7.4.2 CI/CD Pipeline
- **GitHub Actions** or **GitLab CI**
- Automated testing on PR
- Automated builds for mobile (iOS/Android)
- Automated deployment to staging/production

#### 7.4.3 Deployment Strategy

**Backend**:
- **Docker**: Containerization
- **Docker Compose**: Local development
- **Kubernetes** or **AWS ECS**: Production orchestration
- **Nginx**: Reverse proxy and load balancing

**Database**:
- **Managed PostgreSQL**: AWS RDS, DigitalOcean, or Supabase
- Automated backups (daily)
- Point-in-time recovery enabled
- Read replicas for reporting

**Mobile Apps**:
- **iOS**: TestFlight (beta), App Store (production)
- **Android**: Google Play Console (beta & production)
- **Web**: Static hosting (Vercel, Netlify, AWS S3+CloudFront)

**Monitoring**:
- **Sentry**: Error tracking
- **DataDog** or **New Relic**: Performance monitoring
- **Grafana + Prometheus**: Metrics and dashboards
- **ELK Stack**: Log aggregation (optional)

### 7.5 Development Environment

#### 7.5.1 Required Tools
- **Node.js**: v20 LTS
- **npm** or **yarn**: Package management
- **React Native CLI**: Mobile development
- **Xcode**: iOS development (macOS only)
- **Android Studio**: Android development
- **PostgreSQL**: v16.x
- **Redis**: v7.x
- **Docker Desktop**: Containerization
- **Postman** or **Insomnia**: API testing
- **VS Code**: IDE (recommended extensions below)

#### 7.5.2 VS Code Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- React Native Tools
- Docker
- PostgreSQL (Weijan Chen)
- GitLens
- Thunder Client (API testing)

#### 7.5.3 Environment Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run migration:run
npm run dev

# Mobile/Frontend
cd mobile
npm install
npx react-native run-android
npx react-native run-ios
npm run web
```

### 7.6 Security Architecture

#### 7.6.1 Authentication Flow
1. User login with credentials
2. Backend validates and returns JWT access token + refresh token
3. Access token stored in secure storage (iOS Keychain, Android Keystore)
4. Token included in Authorization header for all API calls
5. Token refresh mechanism before expiry

#### 7.6.2 Authorization
- Role-based access control (RBAC)
- Route guards in NestJS
- Row-level security in PostgreSQL
- Data isolation by moderator organization

#### 7.6.3 Security Best Practices
- HTTPS only (TLS 1.3)
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CSRF protection for web
- Rate limiting on all endpoints
- Input validation on both client and server
- Secrets management (AWS Secrets Manager, HashiCorp Vault)
- Regular security audits
- Dependency vulnerability scanning (npm audit, Snyk)

---

## 8. Key Technical Considerations

### 8.1 Security
- Role-based access control (RBAC)
- Data isolation between moderator organizations
- Audit logging for all critical operations
- Encrypted passwords (bcrypt/Argon2)
- JWT-based authentication
- Rate limiting on API endpoints

### 8.2 Performance
- Caching strategy for frequent queries
- Database indexing on search fields
- Lazy loading for large data sets
- Pagination on all lists
- Background processing for heavy calculations

### 8.3 Data Integrity
- Transaction-based operations
- Optimistic locking for concurrent updates
- Daily backup strategy
- Point-in-time recovery capability

### 8.4 Scalability
- Horizontal scaling capability
- Microservices architecture (optional)
- CDN for static assets
- Database read replicas for reporting

---

## 9. Development Phases

### 9.1 Phase 1: Core Foundation (MVP)
**Duration**: 8-10 weeks

**Features**:
- User authentication & authorization
- Basic agent/moderator/admin roles
- Agent hierarchy creation (2-3 levels)
- Simple bet placement (4D only, manual entry)
- Basic query functionality
- Weekly limit system
- Manual result entry
- Commission calculation engine
- Report A-1 (Rough Stats)
- Report B-1 (Results Calendar)

### 9.2 Phase 2: Enhanced Betting
**Duration**: 6-8 weeks

**Features**:
- All game types (3D, 4D, 5D, 6D)
- All bet types (M, P, T, S, B, K, W, H, E)
- Batch entry mode
- Advanced betting notations
- Cancellation system
- Performance summary (成绩)
- Total calculation (总额)
- Report A-2 (Inquiry)
- Report A-3 (Order Summary)

### 9.3 Phase 3: Advanced Features
**Duration**: 4-6 weeks

**Features**:
- Automatic result API integration
- All remaining reports (B-2, B-3)
- Advanced search/filtering
- Commission reports
- Performance analytics
- Print/export functionality
- Multi-level hierarchy (unlimited)
- Sub-agent management by agents

### 9.4 Phase 4: Polish & Optimization
**Duration**: 3-4 weeks

**Features**:
- UI/UX refinements
- Performance optimization
- Mobile responsiveness
- PWA implementation
- Comprehensive testing
- Documentation
- Training materials

### 9.5 Phase 5: Mobile Apps (Optional)
**Duration**: 6-8 weeks

**Features**:
- Native mobile app (iOS/Android)
- Mobile-specific optimizations
- Push notifications
- Offline capability (limited)
- App store deployment

---

## 10. User Stories

### 10.1 Agent Stories

**US-A01**: As an agent, I want to place a 4D bet with specific numbers so that I can practice betting operations.

**US-A02**: As an agent, I want to view my remaining weekly limit so that I know how much more I can bet.

**US-A03**: As an agent, I want to search for my past bets by date range so that I can review my betting history.

**US-A04**: As an agent, I want to cancel a pending bet so that I can correct mistakes before the draw.

**US-A05**: As an agent, I want to see my win/loss results automatically updated so that I know my performance.

**US-A06**: As an agent, I want to create sub-agents under me so that I can build my downline.

**US-A07**: As an agent, I want to print bet receipts so that I have physical records.

**US-A08**: As an agent, I want to use shortcut notations (like 1*, #123) so that I can place bets faster.

### 10.2 Moderator Stories

**US-M01**: As a moderator, I want to create agent accounts with custom commission rates so that I can manage my organization.

**US-M02**: As a moderator, I want to set weekly betting limits for each agent so that I can control risk exposure.

**US-M03**: As a moderator, I want to view all bets placed by my agents so that I can monitor operations.

**US-M04**: As a moderator, I want to see commission breakdown across my agent hierarchy so that I understand profit distribution.

**US-M05**: As a moderator, I want to generate performance reports so that I can analyze agent activities.

**US-M06**: As a moderator, I want my data isolated from other moderators so that business information stays confidential.

**US-M07**: As a moderator, I want to configure unlimited hierarchy levels so that I can scale my organization.

### 10.3 Administrator Stories

**US-AD01**: As an administrator, I want to view all moderators and their organizations so that I can oversee the entire system.

**US-AD02**: As an administrator, I want to override moderator decisions so that I can resolve disputes or issues.

**US-AD03**: As an administrator, I want to configure the lottery result API integration so that results are automatically fetched.

**US-AD04**: As an administrator, I want to access all reports across all organizations so that I can monitor system health.

**US-AD05**: As an administrator, I want to manage system settings and configurations so that the platform runs smoothly.

---

## 11. API Integration Requirements

### 11.1 Lottery Result API
**Requirements**:
- RESTful or GraphQL endpoint
- Authentication mechanism
- Real-time or scheduled polling
- Data format: JSON preferred
- Coverage: M, P, T, S, B, K, W, H, E providers
- Historical result access

**Data Fields Needed**:
- Draw date/time
- Game type (3D, 4D, 5D, 6D)
- Provider code (M, P, T, S, B, K, W, H, E)
- Winning numbers
- Prize categories (1st, 2nd, 3rd, Starter, Consolation)
- Draw period identifier

### 11.2 Error Handling
- Retry mechanism for failed API calls
- Fallback to manual entry if API unavailable
- Alert moderators/admin of API failures
- Data validation before insertion

---

## 12. Success Metrics

### 12.1 User Engagement
- Number of active agents
- Average bets per agent per week
- Agent retention rate
- Sub-agent creation rate

### 12.2 System Performance
- Page load time < 2 seconds
- API response time < 500ms
- 99.9% uptime
- Zero data loss incidents

### 12.3 Business Metrics
- Number of moderator organizations
- Total betting volume (virtual)
- Commission distribution accuracy
- Report generation time

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| API result source unavailable | High | Manual entry fallback, multiple API sources |
| Database performance degradation | High | Indexing, caching, read replicas |
| Commission calculation errors | Critical | Comprehensive testing, audit logs, reconciliation |
| Data isolation breach | Critical | Strict access control, security audits |
| Weekly limit bypass | High | Transaction-based checks, validation |

### 13.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Complex hierarchy causes performance issues | Medium | Optimize query patterns, limit depth warnings |
| User confusion with betting notations | Medium | Comprehensive help system, training |
| Report generation timeout | Low | Background processing, caching |

---

## 14. Open Questions

1. **Regulatory Compliance**: Are there any legal considerations for lottery practice systems in Malaysia/Singapore?

2. **Multi-Currency**: Should the system support real-time currency conversion between MYR and SGD?

3. **Internationalization**: Should the UI support multiple languages (English, Chinese, Malay)?

4. **Branding**: Will this be white-labeled for different moderator organizations?

5. **Data Retention**: How long should historical data be retained? Any archival strategy?

6. **Betting Deadlines**: What are the exact cutoff times before draws? Do they vary by provider?

7. **Prize Calculation**: Are there provider-specific payout tables, or is it standardized?

8. **User Support**: What level of customer support is needed (chat, email, phone)?

---

## 15. Appendix

### 15.1 Glossary

- **4D**: 4-digit lottery game
- **3D**: 3-digit lottery game
- **5D**: 5-digit lottery game
- **6D**: 6-digit lottery game
- **Big (大)**: Big bet type with higher payout
- **Small (小)**: Small bet type with guaranteed smaller payout
- **M**: Magnum lottery provider
- **P**: Sports Toto/Pan Malaysia
- **T**: Damacai/Toto
- **S**: Singapore Pools
- **IBOX**: All permutations of a number
- **Permutation**: Different arrangements of same digits
- **Receipt Number**: Unique bet identifier
- **Draw Period**: Specific lottery draw (e.g., D=today, D7=7 days ago)
- **Commission**: Percentage shared with upper-level agents
- **Weekly Limit**: Maximum betting amount per week (resets Monday)

### 15.2 Reference Screenshots
- Location: `C:\WebDev\MKT\docs\ss\app\` (App UI references)
- Location: `C:\WebDev\MKT\docs\ss\backoffice\` (Back office reports)
- Location: `C:\WebDev\MKT\docs\ss\app\rules-*.JPG` (Betting rules and notations)

### 15.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | Initial | First draft based on requirements gathering |

---

**Document Status**: Draft for Review
**Next Steps**: Review with stakeholders, finalize technical stack, begin Phase 1 development planning
