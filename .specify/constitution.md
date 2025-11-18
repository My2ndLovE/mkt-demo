# Project Constitution
## Multi-Level Agent Lottery Sandbox System

**Version:** 1.0
**Created:** 2025-11-18
**Status:** Active

---

## Purpose

This constitution defines the core principles, values, and standards that guide the development of the Multi-Level Agent Lottery Sandbox System. All technical decisions, feature implementations, and code contributions must align with these principles.

---

## Core Principles

### 1. Type Safety & Code Quality (Priority: Critical)

**Principle:** Code correctness and maintainability are paramount over development speed.

**Guidelines:**
- **TypeScript Everywhere**: 100% TypeScript coverage on both frontend and backend
- **Strict Mode**: TypeScript strict mode enabled (`strict: true`)
- **No `any` Types**: Avoid `any`; use `unknown` with proper type guards when necessary
- **Type Inference**: Leverage TypeScript's type inference; explicit types only when needed
- **Validation at Boundaries**: Validate all external data (API requests, user input, third-party APIs)
  - Frontend: Zod schemas for forms and API responses
  - Backend: class-validator for DTOs
- **Linting**: ESLint with strict rules, zero warnings in production
- **Code Reviews**: Mandatory PR reviews before merging
- **Test Coverage**: Minimum 80% coverage for critical business logic
  - Commission calculations: 100% coverage
  - Quota management: 100% coverage
  - Bet validation: 100% coverage

**Rationale:**
Financial/betting systems require absolute correctness. Type safety catches bugs at compile-time, reducing production incidents and building user trust.

**Examples:**
```typescript
// ❌ BAD
function calculateCommission(amount: any, rate: any) {
  return amount * rate
}

// ✅ GOOD
function calculateCommission(amount: number, rate: number): number {
  if (amount < 0 || rate < 0 || rate > 100) {
    throw new ValidationError('Invalid commission parameters')
  }
  return Math.round(amount * (rate / 100) * 100) / 100 // 2 decimal precision
}
```

---

### 2. User Experience & Accessibility (Priority: Critical)

**Principle:** The system must be intuitive, fast, and accessible to all users, especially on mobile devices.

**Guidelines:**
- **Mobile-First Design**: Design for mobile (375px width minimum), scale up to desktop
- **100% Mobile Users**: Optimize for touch interfaces, large tap targets (minimum 44x44px)
- **Performance Targets**:
  - Page Load Time: < 2 seconds (p95)
  - Time to Interactive: < 3 seconds
  - API Response: < 200ms (p95)
- **Accessibility Standards**:
  - WCAG 2.1 AA compliance minimum
  - Semantic HTML
  - ARIA labels where necessary
  - Keyboard navigation support
  - Color contrast ratio ≥ 4.5:1
  - Screen reader tested
- **Responsive Design**: Breakpoints at 640px, 768px, 1024px, 1280px (Tailwind defaults)
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Offline Support**: Display cached data when network unavailable (future)
- **Error Messages**: Clear, actionable error messages in user's language
- **Loading States**: Immediate feedback for all user actions
- **Success Feedback**: Confirm all successful operations (bets placed, agents created, etc.)

**Rationale:**
Users are primarily mobile-based. A slow or confusing interface leads to lost engagement and errors in bet placement.

**Examples:**
```tsx
// ✅ GOOD: Mobile-first button with loading state
<Button
  className="w-full min-h-[44px] text-lg touch-manipulation"
  disabled={isLoading}
  aria-label="Place bet"
>
  {isLoading ? (
    <><Spinner className="mr-2" /> Placing bet...</>
  ) : (
    'Place Bet'
  )}
</Button>
```

---

### 3. Security & Data Integrity (Priority: Critical)

**Principle:** Financial data and user information must be protected at all costs.

**Guidelines:**
- **Authentication**:
  - JWT tokens with expiration (15min access, 7day refresh)
  - Secure token storage (httpOnly cookies for web, secure storage for mobile)
  - Password hashing with bcrypt (cost factor: 12)
  - Rate limiting on login attempts (5 attempts per 15min)
- **Authorization**:
  - Role-based access control (RBAC)
  - Verify permissions on every API call
  - Row-level security in database (moderator isolation)
  - Never trust client-side authorization
- **Data Protection**:
  - HTTPS only (TLS 1.3 minimum)
  - Parameterized queries (prevent SQL injection)
  - Input sanitization (prevent XSS)
  - CORS properly configured
  - Environment variables for all secrets
  - No sensitive data in logs or error messages
- **Audit Trail**:
  - Log all financial transactions (bets, quota changes, commissions)
  - Log all admin actions (agent creation, suspensions)
  - Immutable audit logs (append-only)
  - Include: who, what, when, IP address, user agent
- **Data Validation**:
  - Validate on both client and server
  - Server validation is source of truth
  - Reject invalid data, never silently correct

**Rationale:**
Lottery systems handle sensitive financial data. Security breaches destroy trust and can lead to legal issues.

**Examples:**
```typescript
// ✅ GOOD: Validated bet placement
@Post('bets')
@UseGuards(JwtAuthGuard)
async placeBet(
  @Body(ValidationPipe) createBetDto: CreateBetDto,
  @CurrentUser() user: User,
) {
  // Verify user has permission
  if (user.weeklyLimitRemaining < createBetDto.amount) {
    throw new ForbiddenException('Weekly limit exceeded')
  }

  // Audit log
  await this.auditService.log({
    action: 'BET_PLACED',
    userId: user.id,
    metadata: { betAmount: createBetDto.amount },
    ipAddress: req.ip,
  })

  return this.betsService.create(createBetDto, user)
}
```

---

### 4. Scalability & Performance

**Principle:** System must handle growth efficiently without major rewrites.

**Guidelines:**
- **Database Design**:
  - Proper indexing on all query fields
  - Use database-level constraints
  - Recursive CTEs for unlimited hierarchy queries
  - Partitioning for large tables (bets by date)
  - Connection pooling
- **Caching Strategy**:
  - Cache expensive queries (hierarchy trees, results)
  - Cache invalidation on data changes
  - TTL-based caching for semi-static data
  - Use Cloudflare KV for edge caching
- **API Design**:
  - Pagination on all list endpoints (default 50, max 100)
  - Filtering and sorting support
  - Rate limiting per user/IP
  - Bulk operations where applicable
- **Background Jobs**:
  - Async processing for heavy operations (reports, commissions)
  - Scheduled jobs via Cloudflare Cron or Azure Functions
  - Retry mechanisms with exponential backoff
- **Code Splitting**:
  - Route-based code splitting (React Router 7 automatic)
  - Lazy load heavy components
  - Tree-shaking enabled

**Performance Budgets:**
- JavaScript bundle: < 200KB gzipped
- Initial page load: < 2s
- Database query: < 50ms (p95)
- API response: < 200ms (p95)

---

### 5. Maintainability & Developer Experience

**Principle:** Code should be easy to understand, modify, and extend.

**Guidelines:**
- **Code Organization**:
  - Feature-based folder structure
  - Colocate related files
  - Single Responsibility Principle
  - DRY (Don't Repeat Yourself) but avoid premature abstraction
- **Naming Conventions**:
  - PascalCase for components, classes
  - camelCase for functions, variables
  - SCREAMING_SNAKE_CASE for constants
  - Descriptive names (prefer `userWeeklyLimit` over `limit`)
- **Documentation**:
  - JSDoc for public APIs
  - README in each major module
  - API documentation via Swagger/OpenAPI
  - Decision records for major architectural choices
- **Testing**:
  - Test business logic, not implementation details
  - Unit tests for pure functions
  - Integration tests for API endpoints
  - E2E tests for critical user flows
- **Git Workflow**:
  - Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
  - Feature branches (`feature/bet-placement`)
  - PR template with checklist
  - Squash merge to main
- **Dependencies**:
  - Prefer well-maintained libraries
  - Lock file committed to repo
  - Regular dependency updates
  - Audit for security vulnerabilities

---

## Technical Standards

### Frontend Standards

1. **React Components**:
   - Functional components only
   - Hooks for state management
   - Props interfaces for every component
   - Avoid prop drilling (max 2-3 levels)

2. **Styling**:
   - Tailwind utility classes
   - Custom classes in `@layer components`
   - Mobile-first responsive design
   - Dark mode ready (optional Phase 2)

3. **State Management**:
   - TanStack Query for server state
   - Zustand for UI/app state
   - Avoid global state when local state suffices
   - Single source of truth

4. **Forms**:
   - React Hook Form for all forms
   - Zod for validation schemas
   - Immediate validation feedback
   - Accessible error messages

### Backend Standards

1. **NestJS Architecture**:
   - Module per feature
   - Service contains business logic
   - Controller handles HTTP
   - Repository/ORM for data access
   - DTOs for request/response

2. **API Design**:
   - RESTful conventions
   - Versioning in URL (`/api/v1`)
   - Consistent error responses
   - Standard HTTP status codes

3. **Database**:
   - Prisma schema as source of truth
   - Migrations for all schema changes
   - Seeds for development data
   - Transactions for multi-step operations

4. **Error Handling**:
   - Custom exception filters
   - Logging all errors
   - User-friendly error messages
   - Stack traces in development only

---

## Feature Development Process

### 1. Specification (SpecKit)
- Create `spec.md` with detailed feature requirements
- Include acceptance criteria
- Define API contracts
- Design database schema changes

### 2. Planning
- Generate `plan.md` with implementation steps
- Identify risks and dependencies
- Estimate effort

### 3. Implementation
- Follow `tasks.md` in order
- Write tests first (TDD) for critical logic
- Implement feature
- Manual testing

### 4. Review
- Self-review before PR
- Run linter and tests
- Address all feedback
- Update documentation

### 5. Deployment
- Merge to main
- Automatic deployment via CI/CD
- Monitor for errors
- Communicate changes to team

---

## Configuration Management

### Environment Variables

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for signing JWTs
- `NODE_ENV`: `development` | `staging` | `production`

**Optional:**
- `RESULT_API_URL`: Third-party lottery result API
- `RESULT_API_KEY`: API key for result service
- `SENTRY_DSN`: Error tracking endpoint

**Never Commit:**
- `.env` files
- API keys
- Passwords
- Private keys

---

## Deployment Standards

### Environments

1. **Development** (local)
   - Local database
   - Mock third-party APIs
   - Debug logging enabled

2. **Staging** (preview)
   - Separate database
   - Real-like data (sanitized)
   - Preview deployments for PRs

3. **Production**
   - Auto-deploy from `main` branch
   - Database backups daily
   - Monitoring and alerts
   - Rate limiting enabled

### CI/CD Pipeline

```yaml
# On every PR:
- Lint code (ESLint, Prettier)
- Type check (TypeScript)
- Run tests (Jest)
- Build frontend
- Build backend

# On merge to main:
- All above steps
- Deploy frontend (Cloudflare Pages)
- Deploy backend (Cloudflare Workers)
- Run smoke tests
- Notify team
```

---

## Code Quality Checklist

Before submitting a PR, ensure:

- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with zero warnings
- [ ] All tests pass
- [ ] New features have tests
- [ ] API endpoints documented
- [ ] Accessibility verified (keyboard navigation, ARIA)
- [ ] Mobile responsive (tested on 375px width)
- [ ] Error handling implemented
- [ ] Loading states for async operations
- [ ] Success feedback for user actions
- [ ] No console.log in production code
- [ ] Environment variables for configuration
- [ ] Database migrations created (if schema changed)
- [ ] Audit logging for sensitive operations

---

## Non-Functional Requirements

### Performance
- Page load < 2s (p95)
- API response < 200ms (p95)
- Lighthouse score > 90

### Availability
- 99.9% uptime target
- Graceful degradation
- Error boundaries

### Security
- OWASP Top 10 compliance
- Regular security audits
- Dependency vulnerability scanning

### Privacy
- User data encrypted at rest
- PII handling according to regulations
- Clear privacy policy

---

## Exceptions & Trade-offs

When to deviate from principles:

1. **Prototypes**: Lower standards for throwaway code
2. **Urgent Fixes**: Skip full test coverage for critical patches (but add tests after)
3. **External Libraries**: May not follow our conventions
4. **Performance**: May sacrifice readability for proven performance gains

**Document all exceptions with rationale.**

---

## Evolution

This constitution is a living document:

- **Review**: Quarterly
- **Updates**: Via team consensus
- **Version**: Semantic versioning

**Next Review:** 2025-02-18

---

## Summary

This project prioritizes:

1. ✅ **Type Safety & Code Quality** - Correctness over speed
2. ✅ **User Experience & Accessibility** - Mobile-first, fast, intuitive
3. ✅ **Security & Data Integrity** - Financial data protection
4. ⚡ Scalability & Performance - Handle growth efficiently
5. 🛠️ Maintainability & DX - Easy to understand and extend

**Not a priority:**
- ❌ Fast development at the cost of quality
- ❌ Cutting corners on security
- ❌ Poor mobile experience

---

**Approved by:** Project Team
**Effective Date:** 2025-11-18
