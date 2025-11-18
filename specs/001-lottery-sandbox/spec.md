# Feature Specification: Multi-Level Agent Lottery Sandbox System

**Feature Branch**: `001-lottery-sandbox`
**Created**: 2025-11-18
**Status**: Draft
**Input**: User description: "Multi-Level Agent Lottery Sandbox System - A comprehensive web-based lottery practice management system for Malaysian and Singapore lottery games (3D, 4D, 5D, 6D) with unlimited agent hierarchy, configurable commission rates, weekly betting limits, automated result synchronization, and complete reporting. Primary users: Administrators (system-wide), Moderators (organization-level), and Agents (operational level with unlimited sub-agent creation). Tech stack: Azure SQL Database, Azure Static Web Apps, Azure Functions, React Router 7, NestJS, Prisma. Mobile-first design for 100% mobile users. Key features: configurable service providers, weekly limit system (Monday reset), commission flow through unlimited hierarchy, BIG/SMALL/IBOX bet types, third-party API result sync with manual fallback, 6 comprehensive reports, in-memory cache (optional Redis when scaling)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Places Practice Bet (Priority: P1)

An agent wants to place a practice bet on 4D lottery numbers to simulate real betting operations without financial risk.

**Why this priority**: Core value proposition of the system - allows agents to practice betting operations safely. Without this, the system has no purpose.

**Independent Test**: Agent can log in, select lottery game (4D), enter numbers, choose bet type (BIG/SMALL), specify amount, and receive a bet receipt confirmation. The system deducts the amount from their weekly limit.

**Acceptance Scenarios**:

1. **Given** agent has remaining weekly limit of $500, **When** agent places $100 bet on 4D number "1234" (BIG) for next draw, **Then** system creates bet record, generates unique receipt number, deducts $100 from limit, and displays confirmation with receipt details
2. **Given** agent has $50 remaining weekly limit, **When** agent attempts to place $100 bet, **Then** system prevents bet placement and shows error message "Insufficient weekly limit. Remaining: $50"
3. **Given** draw cutoff time is 7:00 PM and current time is 7:05 PM, **When** agent attempts to place bet for today's draw, **Then** system prevents bet and shows "Draw closed. Betting available for next draw on [date]"

---

### User Story 2 - Administrator Configures Service Providers (Priority: P1)

An administrator needs to configure which lottery service providers (Magnum, Sports Toto, Damacai, Singapore Pools) are available and what game types each supports.

**Why this priority**: Foundation for system flexibility and future-proofing. Without configurable providers, system is rigid and cannot adapt to new markets or providers.

**Independent Test**: Administrator can add a new provider (e.g., "Thai Lottery"), specify which games it supports (3D, 4D), set draw schedule, and activate/deactivate it. Changes immediately reflect in agent betting interface.

**Acceptance Scenarios**:

1. **Given** administrator is logged in, **When** administrator adds new provider "Sports Toto" with games [4D, 5D, 6D] and draw schedule [Wed, Sat, Sun 7:00 PM], **Then** system saves provider configuration and makes it available in agent betting dropdown
2. **Given** provider "Damacai" is active, **When** administrator deactivates it, **Then** provider disappears from agent betting interface but historical bets remain viewable
3. **Given** provider configuration exists, **When** administrator updates game types from [4D] to [3D, 4D], **Then** agents can immediately select 3D game for that provider

---

### User Story 3 - Moderator Creates Agent with Commission Structure (Priority: P1)

A moderator wants to create a new agent under their organization with specific weekly limit and commission rate.

**Why this priority**: Essential for hierarchical structure. Moderators need ability to build their agent network with custom commission splits.

**Independent Test**: Moderator can create agent account with username, password, full name, weekly limit ($1000), and commission rate (30%), and the agent can immediately log in and place bets with configured limits and commission structure.

**Acceptance Scenarios**:

1. **Given** moderator is logged in, **When** moderator creates agent with username "agent001", weekly limit $1000, commission rate 30%, **Then** system creates account, sends credentials, and agent can log in with $1000 available limit
2. **Given** agent001 (30% commission) places $100 bet that wins $500, **When** system processes win, **Then** agent001 receives $150 (30% of $500 profit) and moderator receives $350 (70%)
3. **Given** moderator has 5 agents with total allocated limits of $8000, **When** moderator attempts to create new agent with $5000 limit, **Then** system validates total allocations and either allows (if moderator has sufficient limits) or prevents with error

---

### User Story 4 - Agent Views Bet Results and Commission (Priority: P2)

After a lottery draw completes, an agent wants to see if their bets won and how much commission they earned.

**Why this priority**: Provides feedback and value from betting practice. Agents need to understand outcomes to learn from their betting strategies.

**Independent Test**: After draw results are synchronized, agent can view all their bets for that draw showing win/loss status, prize amounts, and commission earned/lost. System shows detailed breakdown by prize category.

**Acceptance Scenarios**:

1. **Given** agent placed bet "1234" for Wed draw and "1234" wins 1st prize, **When** agent views results after draw, **Then** system displays "WON - 1st Prize: $2500" (for RM1 bet on BIG), calculates agent's share based on commission rate
2. **Given** agent has 10 pending bets, **When** draw results are synchronized, **Then** all 10 bets update to WON/LOST status automatically, and agent sees updated commission earnings
3. **Given** agent's bet number appears in Consolation prizes, **When** viewing results, **Then** system shows "WON - Consolation: $60" with correct commission calculation

---

### User Story 5 - Moderator Generates Weekly Performance Report (Priority: P2)

A moderator wants to view comprehensive performance reports for their agents over a specific week.

**Why this priority**: Business intelligence critical for moderators to manage their organization and understand agent performance.

**Independent Test**: Moderator can select date range (e.g., Nov 10-16), filter by agent or all agents, and generate report showing total bets, win/loss, commissions, and breakdown by game type. Report can be exported.

**Acceptance Scenarios**:

1. **Given** moderator manages 10 agents, **When** moderator generates 7-day report for week of Nov 10-16, **Then** system displays summary table with columns: Agent Name, Total Bets, Downline Activity, Wins, Losses, Commissions, Net Performance
2. **Given** report is displayed, **When** moderator clicks export button, **Then** system generates Excel/PDF file with same data maintaining formatting
3. **Given** moderator filters report by specific agent "agent001", **When** report generates, **Then** system shows only agent001's performance including their downline's aggregated data

---

### User Story 6 - System Auto-Resets Weekly Limits (Priority: P2)

Every Monday at midnight, the system automatically resets all agents' weekly limits to allow fresh betting for the new week.

**Why this priority**: Automated limit management is core to weekly limit system functionality. Without auto-reset, manual intervention required weekly.

**Independent Test**: Agent has $50 remaining limit on Sunday. On Monday at 00:01, agent logs in and sees their full weekly limit restored (e.g., $1000) with usage reset to $0.

**Acceptance Scenarios**:

1. **Given** agent has weekly limit $1000 with $950 used (Sunday 11:59 PM), **When** system clock passes Monday 00:00, **Then** system resets weeklyUsed to $0, making full $1000 available again
2. **Given** 1000 agents across system, **When** Monday 00:00 reset occurs, **Then** all 1000 agents' limits reset simultaneously without system performance degradation
3. **Given** reset job fails due to database connection issue, **When** retry mechanism activates, **Then** system attempts reset again after exponential backoff and logs failure for admin review

---

### User Story 7 - Agent Creates Sub-Agent (Priority: P3)

An agent with sub-agent creation permission wants to create their own downline agent to build a multi-level structure.

**Why this priority**: Enables unlimited hierarchy depth as specified. Important for MLM-style commission structure but not critical for basic operations.

**Independent Test**: Agent (L1) creates sub-agent (L2) with allocated weekly limit ($200 from their own $1000 limit) and commission rate (20%). L2 agent can log in, place bets, and commissions flow from L2 → L1 → Moderator.

**Acceptance Scenarios**:

1. **Given** agent L1 has $1000 limit, **When** L1 creates sub-agent L2 with $200 allocation and 20% commission, **Then** L1's available limit reduces to $800, L2 can use $200, and L2's bets generate commissions for L1
2. **Given** L2 places $100 bet with 20% commission that wins $500 profit, **When** system calculates commissions, **Then** L2 gets $100 (20%), L1 gets $80 (20% of remaining $400), Moderator gets $320 (remaining)
3. **Given** agent does not have sub-agent permission, **When** agent attempts to access create sub-agent form, **Then** system denies access and shows "Permission denied. Contact moderator to enable sub-agent creation."

---

### User Story 8 - Third-Party API Result Synchronization (Priority: P3)

System automatically fetches lottery results from third-party API after each draw and processes all pending bets.

**Why this priority**: Automation reduces manual work. However, manual entry fallback provides backup, making automation enhancement rather than requirement.

**Independent Test**: After 7:15 PM draw completion, system automatically calls result API, retrieves winning numbers, saves to database, matches against all pending bets, calculates winnings, and updates bet statuses without manual intervention.

**Acceptance Scenarios**:

1. **Given** Magnum 4D draw completes at 7:00 PM, **When** scheduled job runs at 7:15 PM, **Then** system fetches results via API, validates data format, saves results, and processes 500 pending bets within 30 seconds
2. **Given** API call fails with timeout error, **When** retry mechanism activates, **Then** system retries with exponential backoff (retry after 30s, then 1min, then 2min) up to 5 attempts
3. **Given** API returns invalid/incomplete data, **When** system validates response, **Then** system rejects data, logs error, sends alert to administrator, and keeps bets in PENDING status for manual result entry

---

### Edge Cases

- **What happens when agent's commission rate changes mid-week?** System uses commission rate at time of bet placement for that specific bet. Rate changes do not retroactively affect existing bets, only future bets.

- **What happens when two agents simultaneously create sub-agents pushing total allocation over moderator's limit?** System uses database transaction locks to prevent race condition. Second transaction fails with "Insufficient limit available. Another allocation is being processed."

- **What happens when agent cancels bet after weekly limit reset has occurred?** Cancelled bet restores limit to current week, not previous week. If bet was from last week but cancelled this week, refund applies to this week's limit.

- **What happens when draw results are corrected by lottery provider after initial publication?** System allows administrator to update results manually. All affected bets are recalculated. System creates audit log entry showing original result, corrected result, timestamp, and administrator who made correction.

- **What happens when agent is suspended mid-week with pending bets?** Pending bets remain active and will be processed when results available. Agent cannot place new bets or cancel existing ones while suspended. Winnings/losses still calculated and applied to their account.

- **What happens when hierarchy depth reaches 20+ levels and commission calculation becomes complex?** System uses recursive query optimization (SQL Server CTE) to calculate commissions efficiently. If calculation exceeds 5 seconds, system queues as background job and notifies user upon completion.

- **What happens when agent tries to bet on draw that's already completed?** System validates draw date against current time and draw schedule. Prevents bet placement and shows "This draw has closed. Next available draw: [date/time]".

- **What happens when multiple moderators create agents with same username?** System enforces globally unique usernames. Second moderator receives error "Username 'agent001' already exists. Please choose different username." Alternatively, system could namespace usernames by moderator (e.g., "MOD1-agent001", "MOD2-agent001") [NEEDS CLARIFICATION: Should usernames be globally unique or namespaced by moderator?]

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization

- **FR-001**: System MUST authenticate users with username and password
- **FR-002**: System MUST support three distinct user roles: Administrator, Moderator, Agent
- **FR-003**: System MUST restrict data access based on role: Administrators see all data, Moderators see only their organization, Agents see only their data and downlines
- **FR-004**: System MUST enforce row-level security preventing moderators from accessing other moderators' data
- **FR-005**: System MUST hash passwords using industry-standard algorithm before storage
- **FR-006**: System MUST issue JWT tokens with 15-minute expiration for authenticated sessions
- **FR-007**: System MUST provide refresh token mechanism with 7-day expiration
- **FR-008**: System MUST rate-limit login attempts (5 attempts per 15 minutes per IP address)

#### Service Provider Management

- **FR-009**: System MUST allow administrators to create new lottery service providers
- **FR-010**: System MUST allow administrators to configure which game types (3D, 4D, 5D, 6D) each provider supports
- **FR-011**: System MUST allow administrators to activate/deactivate service providers
- **FR-012**: System MUST prevent agents from betting on deactivated providers
- **FR-013**: System MUST maintain historical bet data even when provider is deactivated
- **FR-014**: System MUST display only active providers in agent betting interface
- **FR-015**: System MUST store provider draw schedules (days of week, time)

#### Agent Hierarchy Management

- **FR-016**: System MUST support unlimited levels of agent hierarchy (no maximum depth)
- **FR-017**: System MUST allow moderators to create Level 1 agents
- **FR-018**: System MUST allow agents to create sub-agents if granted permission
- **FR-019**: System MUST track upline-downline relationships for commission flow
- **FR-020**: System MUST allow moderator to set weekly limit for each agent during creation
- **FR-021**: System MUST allow moderator to set commission rate (0-100%) for each agent during creation
- **FR-022**: System MUST validate total allocated limits do not exceed moderator's available limits
- **FR-023**: System MUST allow moderator to suspend/reactivate agents
- **FR-024**: System MUST prevent suspended agents from placing new bets
- **FR-025**: System MUST display agent hierarchy as tree visualization

#### Weekly Limit System

- **FR-026**: System MUST track weekly betting limit for each agent
- **FR-027**: System MUST deduct bet amount from agent's weekly limit upon bet placement
- **FR-028**: System MUST prevent bet placement when remaining limit is insufficient
- **FR-029**: System MUST restore limit when pending bet is cancelled
- **FR-030**: System MUST automatically reset all agents' weekly limits every Monday at 00:00
- **FR-031**: System MUST log each limit reset operation for audit purposes
- **FR-032**: System MUST display agent's total limit, used amount, and remaining amount in real-time
- **FR-033**: System MUST handle timezone correctly (Malaysia/Singapore time) for Monday reset

#### Betting System

- **FR-034**: System MUST support betting on 3D, 4D, 5D, 6D game types based on provider configuration
- **FR-035**: System MUST support BIG, SMALL, and IBOX bet types
- **FR-036**: System MUST allow multi-provider selection (single bet across M+P+T simultaneously)
- **FR-037**: System MUST validate bet number length matches game type (3 digits for 3D, 4 for 4D, etc.)
- **FR-038**: System MUST validate bet amount is within provider's min/max limits
- **FR-039**: System MUST prevent betting after draw cutoff time
- **FR-040**: System MUST generate unique receipt number for each bet
- **FR-041**: System MUST display bet summary before final confirmation
- **FR-042**: System MUST allow agents to cancel pending bets before draw cutoff
- **FR-043**: System MUST support two input modes: Simple (text-based) and Detailed (form-based)
- **FR-044**: System MUST display bet history with filtering by date, provider, status, game type
- **FR-045**: System MUST allow agents to search bets by receipt number or bet number

#### Result Management

- **FR-046**: System MUST allow manual entry of draw results by administrators
- **FR-047**: System MUST validate results to prevent duplicate entries for same draw
- **FR-048**: System MUST store all prize categories (1st, 2nd, 3rd, Starter, Consolation) for each draw
- **FR-049**: System MUST automatically match pending bets against results after entry
- **FR-050**: System MUST calculate winning amounts based on bet type (BIG/SMALL) and prize category
- **FR-051**: System MUST update bet status to WON or LOST after result processing
- **FR-052**: System MUST support automated result synchronization via third-party API
- **FR-053**: System MUST retry failed API calls with exponential backoff (max 5 attempts)
- **FR-054**: System MUST fall back to manual entry if API synchronization fails
- **FR-055**: System MUST schedule result sync job to run after each draw time

#### Commission System

- **FR-056**: System MUST calculate commissions for all upline agents when bet is processed
- **FR-057**: System MUST apply commission rate configured at time of bet placement
- **FR-058**: System MUST flow commissions through unlimited hierarchy levels
- **FR-059**: System MUST apply commission to both profits (wins) and losses
- **FR-060**: System MUST store commission records linked to original bet
- **FR-061**: System MUST allow agents to view their commission earnings by date range
- **FR-062**: System MUST display commission breakdown showing source agent and level distance

#### Reporting System

- **FR-063**: System MUST provide Report A-1 (Rough Stats) showing number-based betting overview
- **FR-064**: System MUST provide Report A-2 (Inquiry/Search) for advanced bet searching
- **FR-065**: System MUST provide Report A-3 (Order Summary) for complete order listing
- **FR-066**: System MUST provide Report B-1 (Performance Calendar) with monthly calendar view of results
- **FR-067**: System MUST provide Report B-2 (Winning Orders) showing all winning bets
- **FR-068**: System MUST provide Report B-3 (7-Day Member Account) for weekly performance summary
- **FR-069**: System MUST allow filtering all reports by date range, provider, agent, game type
- **FR-070**: System MUST allow exporting all reports to Excel format
- **FR-071**: System MUST generate reports within 2 seconds for standard date ranges (1 week)

#### Audit & Logging

- **FR-072**: System MUST log all financial transactions (bet placement, cancellation, result processing)
- **FR-073**: System MUST log all administrative actions (agent creation, suspension, limit adjustments)
- **FR-074**: System MUST include in audit logs: user ID, action type, timestamp, IP address, user agent
- **FR-075**: System MUST make audit logs immutable (append-only, no deletion/modification)
- **FR-076**: System MUST allow administrators to query audit logs by date range, user, action type

### Key Entities

- **User/Agent**: Represents all system users (Admin, Moderator, Agent). Attributes: username, role, fullName, uplineId, moderatorId, weeklyLimit, weeklyUsed, commissionRate, canCreateSubAgents, active status, timestamps.

- **ServiceProvider**: Lottery service providers (M, P, T, S). Attributes: code, name, country, active status, availableGames (JSON array), betTypes (JSON array), drawSchedule (JSON), API configuration (endpoint, key).

- **Bet**: Individual lottery bet placed by agent. Attributes: agentId, providerId, gameType, betType, numbers, amount, drawDate, status (PENDING/WON/LOST/CANCELLED), resultId, winAmount, receiptNumber, timestamps.

- **DrawResult**: Official lottery draw results. Attributes: providerId, gameType, drawDate, drawNumber (unique identifier), firstPrize, secondPrize, thirdPrize, starters (JSON array of 10), consolations (JSON array of 10), syncMethod (AUTO/MANUAL), syncedBy (user ID), status.

- **Commission**: Commission records for hierarchy. Attributes: agentId (recipient), betId, sourceAgentId (who placed bet), commissionRate, betAmount, profitLoss, commissionAmount, level (hierarchy distance), timestamp.

- **AuditLog**: System audit trail. Attributes: userId, action, metadata (JSON), ipAddress, userAgent, timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Agents can place a practice bet from login to receipt confirmation in under 60 seconds on mobile device
- **SC-002**: System processes 1000 pending bets and calculates all commissions within 30 seconds after result synchronization
- **SC-003**: Weekly limit reset completes for 1000 agents within 5 seconds every Monday at 00:00
- **SC-004**: Page load time is under 2 seconds on 4G mobile network for all core pages (dashboard, bet placement, results)
- **SC-005**: 95% of agents successfully place their first bet without needing support or documentation
- **SC-006**: Report generation completes within 2 seconds for standard weekly reports (up to 500 bets)
- **SC-007**: System maintains 99.9% uptime during business hours (8 AM - 11 PM Malaysia time)
- **SC-008**: Zero commission calculation errors detected over 30-day period (100% accuracy)
- **SC-009**: Agent hierarchy queries return results within 200ms for trees up to 10 levels deep
- **SC-010**: Mobile bet placement interface achieves 4.5/5 average user satisfaction rating
- **SC-011**: All accessibility targets (WCAG 2.1 AA) achieved with zero critical violations
- **SC-012**: Third-party API synchronization succeeds on first attempt 95% of the time, with fallback to manual entry required less than 5% of draws

### Business Outcomes

- **SC-013**: 100 agents successfully onboarded within first 3 months
- **SC-014**: 500+ practice bets placed daily across all agents
- **SC-015**: Less than 5 support tickets per week related to bet placement or limit issues
- **SC-016**: Moderators can generate and understand all 6 required reports without training
- **SC-017**: Zero financial discrepancies in commission calculations requiring manual correction

## Assumptions *(documented for transparency)*

1. **Draw Times**: All lottery draws occur at 7:00 PM Malaysia/Singapore time (GMT+8). Bet cutoff is exactly at draw time.
2. **Prize Calculation**: Using standard Magnum 4D prize structure as baseline (BIG: 1st=RM2500, 2nd=RM1000, 3rd=RM500, Starter=RM180, Consolation=RM60 per RM1 bet). Other providers follow similar structure.
3. **Currency**: All amounts stored and displayed in single currency (MYR or SGD based on provider). No real-time currency conversion needed.
4. **Data Retention**: All bet history, results, and audit logs retained indefinitely. No automatic data archival/deletion in MVP.
5. **User Language**: Primary interface in English. Chinese/Malay translations are future enhancement, not MVP requirement.
6. **Session Management**: In-memory session storage sufficient for MVP. Redis migration when concurrent users exceed 1000.
7. **Email/SMS Notifications**: Not required for MVP. System relies on in-app notifications and user checking dashboard.
8. **Password Reset**: Administrator manually resets passwords in MVP. Self-service password reset is Phase 2 feature.
9. **Mobile Apps**: Web application optimized for mobile browsers. Native iOS/Android apps are future enhancement.
10. **Payment Integration**: No real money, no payment gateways. System is pure practice/sandbox environment.
11. **Username Uniqueness**: Usernames are globally unique across all moderators (not namespaced).
12. **Commission Precision**: Commission calculations use 2 decimal places (cents). Rounding uses banker's rounding (round half to even).

## Out of Scope *(explicitly excluded from this feature)*

- Real money transactions or payment processing
- LOTTO games (6/50, 6/55, 6/58) - only number-picking games (3D/4D/5D/6D)
- Multi-currency wallets or currency conversion
- Native mobile applications (iOS/Android apps)
- Self-service password reset
- Email/SMS notifications
- Multi-language support (English only for MVP)
- AI-powered number predictions or suggestions
- Social features (sharing bets, leaderboards, chat)
- Affiliate marketing tracking beyond commission structure
- Integration with real lottery providers for ticket purchase
- Blockchain or cryptocurrency features
- Advanced analytics or machine learning insights
- White-label customization for different moderator brands
- Offline mode or progressive web app (PWA) capabilities

## Open Questions *(needs clarification - MAX 3)*

### Question 1: Username Uniqueness Scope

**Context**: System has multiple moderators managing separate organizations. Agent usernames need to be unique, but scope is unclear.

**What we need to know**: Should usernames be globally unique across all moderators, or should they be namespaced per moderator to allow username reuse?

**Suggested Answers**:

| Option | Answer | Implications |
| ------ | ------ | ------------ |
| A | Globally unique across entire system | Simpler login (username only), but moderators might conflict on common names like "agent001". Requires moderators to coordinate or use prefixes manually. |
| B | Namespaced by moderator (MOD1-agent001, MOD2-agent001) | No conflicts, but login requires moderator selection first or longer username. More complex authentication flow. |
| C | Globally unique with moderator prefix enforced by system | System automatically adds moderator code as prefix. Clean separation but usernames become longer. |
| Custom | Provide your own answer | Describe your preferred approach. |

**Your choice**: _A - Globally unique (documented in Assumptions)_

---

## Dependencies

- **Third-party lottery result API**: System requires API access to Malaysian/Singapore lottery result providers (or willingness to manually enter results daily).
- **Azure Infrastructure**: Deployment requires Azure subscription with Static Web Apps, Azure Functions, and Azure SQL Database services.
- **Domain/SSL**: Requires domain name and SSL certificate for production deployment.

## Risks

1. **Third-party API Reliability**: If result API provider has frequent downtime, manual entry burden increases. **Mitigation**: Implement robust fallback to manual entry, retry mechanisms, and administrator alerts.

2. **Unlimited Hierarchy Performance**: Deep agent hierarchies (20+ levels) could slow commission calculations. **Mitigation**: Database query optimization (indexed recursive CTEs), caching of hierarchy paths, background job processing for complex calculations.

3. **Concurrent Limit Allocation**: Race conditions when multiple moderators allocate limits simultaneously. **Mitigation**: Database transaction locks, optimistic locking with retry, clear error messages.

4. **Data Isolation Breach**: Critical security risk if moderator can access other moderator's data. **Mitigation**: Row-level security in database, comprehensive authorization tests, security audit before production.

5. **Monday Reset Failure**: If weekly reset job fails, system becomes unusable. **Mitigation**: Retry mechanism, alerting, manual reset procedure documented, scheduled job monitoring.

---

**Next Steps**: Run `/speckit.plan` to generate implementation plan.
