<!--
Sync Impact Report:
- Version: Initial → 1.0.0
- Ratification: 2025-11-18
- Modified Principles: All (initial creation)
- Added Sections: Core Principles (3), Technical Standards, Development Workflow, Governance
- Templates Status:
  ✅ spec-template.md - aligned with type safety and testing requirements
  ✅ plan-template.md - aligned with constitution check requirements
  ✅ tasks-template.md - aligned with TDD and quality gates
- Follow-up TODOs: None
-->

# Multi-Level Agent Lottery Sandbox System Constitution

## Core Principles

### I. Type Safety & Code Quality (CRITICAL - NON-NEGOTIABLE)

Code correctness and maintainability are paramount over development speed.

**Requirements**:
- TypeScript strict mode MUST be enabled on all codebases
- `any` type is PROHIBITED; use `unknown` with proper type guards when necessary
- All external data (API requests, user input, third-party APIs) MUST be validated at boundaries:
  - Frontend: Zod schemas for forms and API responses
  - Backend: class-validator for DTOs
- ESLint MUST pass with zero warnings in production builds
- Code reviews are MANDATORY before merging to main
- Test coverage MUST be minimum 80% for critical business logic:
  - Commission calculations: 100% coverage REQUIRED
  - Quota management: 100% coverage REQUIRED
  - Bet validation: 100% coverage REQUIRED

**Rationale**: Financial/betting systems require absolute correctness. Type safety catches bugs at compile-time, reducing production incidents and building user trust. A single commission calculation error could compound through unlimited hierarchy levels causing significant financial discrepancies.

### II. User Experience & Accessibility (CRITICAL - NON-NEGOTIABLE)

The system MUST be intuitive, fast, and accessible to all users, especially on mobile devices.

**Requirements**:
- Mobile-first design (375px width minimum) - design for mobile, scale up to desktop
- 100% mobile user optimization:
  - Touch interfaces with minimum 44x44px tap targets
  - Touch-optimized interactions (swipe, pull-to-refresh, bottom sheets)
  - Haptic feedback where appropriate
- Performance targets (MUST meet):
  - Page Load Time: < 2 seconds (p95)
  - Time to Interactive: < 3 seconds
  - API Response: < 200ms (p95)
- Accessibility standards MUST meet WCAG 2.1 AA compliance minimum:
  - Semantic HTML throughout
  - ARIA labels where necessary
  - Keyboard navigation fully supported
  - Color contrast ratio ≥ 4.5:1
  - Screen reader compatibility verified
- Responsive breakpoints: 640px, 768px, 1024px, 1280px (Tailwind defaults)
- Error messages MUST be clear and actionable
- Loading states MUST provide immediate feedback for all user actions
- Success feedback MUST confirm all operations (bets placed, agents created, etc.)

**Rationale**: Users are primarily mobile-based (100% mobile users specified). A slow or confusing interface leads to lost engagement and errors in bet placement. Accessibility ensures the platform is usable by all users regardless of ability.

### III. Security & Data Integrity (CRITICAL - NON-NEGOTIABLE)

Financial data and user information MUST be protected at all costs.

**Requirements**:
- **Authentication**:
  - JWT tokens with expiration (15min access, 7day refresh)
  - Secure token storage (httpOnly cookies for web)
  - Password hashing with bcrypt (cost factor: 12)
  - Rate limiting on login attempts (5 attempts per 15min)
- **Authorization**:
  - Role-based access control (RBAC) on every API call
  - Verify permissions server-side (NEVER trust client)
  - Row-level security in database for moderator isolation
- **Data Protection**:
  - HTTPS only (TLS 1.3 minimum)
  - Parameterized queries MANDATORY (prevent SQL injection)
  - Input sanitization (prevent XSS)
  - CORS properly configured
  - Environment variables for ALL secrets
  - NO sensitive data in logs or error messages
- **Audit Trail** (MANDATORY for financial operations):
  - Log all financial transactions (bets, quota changes, commissions)
  - Log all admin actions (agent creation, suspensions, limit adjustments)
  - Immutable audit logs (append-only)
  - Include: who, what, when, IP address, user agent
- **Data Validation**:
  - Validate on BOTH client and server
  - Server validation is source of truth
  - Reject invalid data, NEVER silently correct

**Rationale**: Lottery systems handle sensitive financial data. Security breaches destroy trust and can lead to legal issues. Audit trails are essential for financial reconciliation and dispute resolution.

## Technical Standards

### Frontend Standards

**React Components**:
- Functional components ONLY (no class components)
- Hooks for state management
- Props interfaces REQUIRED for every component
- Avoid prop drilling (maximum 2-3 levels, use context/state management beyond that)

**Styling**:
- Tailwind utility classes as primary styling method
- Custom classes in `@layer components` for reusable patterns
- Mobile-first responsive design MANDATORY
- Dark mode ready (optional Phase 2, but architecture must support it)

**State Management**:
- TanStack Query for server state (API data)
- Zustand for UI/app state (auth, theme, sidebar)
- Avoid global state when local state suffices
- Single source of truth for all data

**Forms**:
- React Hook Form for ALL forms
- Zod for validation schemas
- Immediate validation feedback (real-time)
- Accessible error messages (ARIA live regions)

### Backend Standards

**NestJS Architecture**:
- Module per feature (modularity REQUIRED)
- Service contains business logic
- Controller handles HTTP only (thin controllers)
- Repository/ORM for data access
- DTOs for request/response (validation at boundaries)

**API Design**:
- RESTful conventions
- Versioning in URL (`/api/v1`)
- Consistent error responses (standard format)
- Standard HTTP status codes (200, 201, 400, 401, 403, 404, 500)

**Database**:
- Prisma schema as single source of truth
- Migrations for ALL schema changes (no manual SQL in production)
- Seeds for development data
- Transactions for multi-step operations (commission calculations, bet placements)

**Error Handling**:
- Custom exception filters
- Logging all errors (Winston)
- User-friendly error messages to client
- Stack traces in development ONLY (never production)

## Development Workflow

### Test-Driven Development (TDD) for Critical Logic

**When TDD is MANDATORY**:
- Commission calculation logic
- Weekly limit validation and reset
- Bet validation rules
- Winning calculation engine
- Agent hierarchy queries

**TDD Process (Red-Green-Refactor)**:
1. **RED**: Write a failing test first
2. **GREEN**: Write minimum code to make it pass
3. **REFACTOR**: Clean up while keeping tests passing

**Non-Critical Code**:
- UI components, forms, layouts: tests recommended but not mandatory first
- Utility functions: test after implementation acceptable

### Feature Development Process (SpecKit Workflow)

1. **Specification** (`/speckit.specify`)
   - Create `spec.md` with detailed feature requirements
   - Include acceptance criteria
   - Define API contracts
   - Design database schema changes

2. **Planning** (`/speckit.plan`)
   - Generate `plan.md` with implementation steps
   - Identify risks and dependencies
   - Estimate effort
   - Perform Constitution Check

3. **Task Breakdown** (`/speckit.tasks`)
   - Generate `tasks.md` with actionable tasks
   - Order by dependencies
   - Include test writing tasks first (for TDD areas)

4. **Implementation** (`/speckit.implement`)
   - Follow `tasks.md` in order
   - Write tests first for critical logic (TDD)
   - Implement feature
   - Manual testing

5. **Review**
   - Self-review before PR
   - Run linter and tests (MUST pass)
   - Address all feedback
   - Update documentation

6. **Deployment**
   - Merge to main
   - Automatic deployment via CI/CD
   - Monitor for errors (Sentry, Azure Application Insights)
   - Communicate changes to team

### Git Workflow

**Branching**:
- `main` - production branch
- `feature/*` - feature branches (e.g., `feature/bet-placement`)
- `fix/*` - bug fix branches

**Commits**:
- Conventional commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- Descriptive commit messages
- Reference issue/task numbers when applicable

**Pull Requests**:
- PR template with checklist REQUIRED
- Code review MANDATORY (at least 1 approval)
- All CI checks MUST pass
- Squash merge to main

## Governance

### Amendment Procedure

This Constitution supersedes all other practices and guidelines.

**Amendment Process**:
1. Propose amendment in writing with rationale
2. Document impact on existing code/processes
3. Obtain team approval (consensus for CRITICAL principles, majority for others)
4. Create migration plan if existing code affected
5. Update constitution version according to semantic versioning
6. Update all dependent templates and documentation

**Version Numbering**:
- **MAJOR** (X.0.0): Backward-incompatible governance/principle removals or redefinitions
- **MINOR** (x.Y.0): New principle/section added or materially expanded guidance
- **PATCH** (x.y.Z): Clarifications, wording, typo fixes, non-semantic refinements

### Compliance

**Verification**:
- All PRs/reviews MUST verify compliance with constitution
- Constitution Check in `/speckit.plan` workflow MANDATORY
- Complexity that violates principles MUST be justified in writing

**Enforcement**:
- Constitution violations block PR merges
- Exceptions MUST be documented with:
  - Specific principle being violated
  - Technical/business rationale
  - Mitigation plan or timeline to resolve
  - Approval from lead developer or project owner

**Review Schedule**:
- Constitution reviewed quarterly
- Updates to reflect lessons learned
- Principles adjusted based on team feedback and project evolution

### Runtime Guidance

For day-to-day development guidance (not governance):
- See project `README.md` for setup and quick start
- See `AZURE_SETUP.md` for deployment specifics
- See `.specify/templates/` for SpecKit workflow templates

**Version**: 1.0.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-18
