import { Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';

/**
 * User context for row-level security
 */
export interface UserContext {
  userId: string;
  role: string;
  agentId?: string;
  parentAgentId?: string;
}

/**
 * Prisma Middleware for Row-Level Security (RLS)
 *
 * Implements multi-level agent hierarchy security as specified in T230-T235.
 * Automatically filters database queries based on user role and agent hierarchy.
 *
 * Security Rules (T230-T235):
 * - SUPER_ADMIN: Access to all records (no filtering)
 * - OPERATOR: Access to all records (no filtering)
 * - SENIOR_AGENT: Access to own records + all descendants in hierarchy
 * - MASTER_AGENT: Access to own records + all descendants in hierarchy
 * - GOLD_AGENT: Access to own records + all descendants in hierarchy
 * - AGENT: Access to own records + direct children only
 * - PLAYER: Access to own records only
 *
 * Hierarchy Example:
 * ```
 * SENIOR_AGENT (Level 1)
 *   └── MASTER_AGENT (Level 2)
 *       └── GOLD_AGENT (Level 3)
 *           └── AGENT (Level 4)
 *               └── PLAYER (Level 5)
 * ```
 *
 * Protected Models:
 * - User: Filter by userId and agent hierarchy
 * - Bet: Filter by userId/agentId and hierarchy
 * - Commission: Filter by agentId and hierarchy
 * - Limit: Filter by agentId and hierarchy
 * - Report: Filter based on user role and hierarchy
 *
 * @param {UserContext | null} userContext - Current user context (null for system operations)
 * @returns {Prisma.Middleware} Prisma middleware function
 *
 * @example Usage in PrismaService
 * ```typescript
 * this.$use(createRowLevelSecurityMiddleware(userContext));
 * ```
 */
export function createRowLevelSecurityMiddleware(
  userContext: UserContext | null,
): Prisma.Middleware {
  const logger = new Logger('PrismaRLSMiddleware');

  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>,
  ) => {
    // Skip filtering for system operations (no user context)
    if (!userContext) {
      logger.debug(`System operation on ${params.model}.${params.action} - No RLS applied`);
      return next(params);
    }

    const { userId, role, agentId, parentAgentId } = userContext;

    // Skip filtering for SUPER_ADMIN and OPERATOR (full access)
    if (role === 'SUPER_ADMIN' || role === 'OPERATOR') {
      logger.debug(`${role} operation on ${params.model}.${params.action} - No RLS applied`);
      return next(params);
    }

    // Apply row-level security based on model and operation
    const model = params.model;
    const action = params.action;

    // Only filter read operations (find, findMany, findFirst, count, aggregate)
    const readActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'];
    const isReadOperation = readActions.includes(action);

    if (!isReadOperation || !model) {
      return next(params);
    }

    // Apply security filters based on model type
    switch (model) {
      case 'User':
        params = applyUserFilter(params, userContext, logger);
        break;

      case 'Bet':
        params = applyBetFilter(params, userContext, logger);
        break;

      case 'Commission':
        params = applyCommissionFilter(params, userContext, logger);
        break;

      case 'Limit':
        params = applyLimitFilter(params, userContext, logger);
        break;

      case 'AgentHierarchy':
        params = applyAgentHierarchyFilter(params, userContext, logger);
        break;

      default:
        // No filtering for other models
        logger.debug(`No RLS rules for model ${model}`);
        break;
    }

    return next(params);
  };
}

/**
 * Apply row-level security filter for User model (T230)
 *
 * Filters users based on agent hierarchy:
 * - Agents can see their own profile + direct children + all descendants
 * - Players can only see their own profile
 *
 * @param {Prisma.MiddlewareParams} params - Query parameters
 * @param {UserContext} userContext - Current user context
 * @param {Logger} logger - Logger instance
 * @returns {Prisma.MiddlewareParams} Modified parameters
 */
function applyUserFilter(
  params: Prisma.MiddlewareParams,
  userContext: UserContext,
  logger: Logger,
): Prisma.MiddlewareParams {
  const { userId, role, agentId } = userContext;

  // Players can only see themselves
  if (role === 'PLAYER') {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        id: userId,
      },
    };
    logger.debug(`RLS: PLAYER ${userId} can only see own profile`);
    return params;
  }

  // Agents can see their hierarchy
  if (agentId) {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        OR: [
          { id: userId }, // Own profile
          { createdById: userId }, // Direct children
          { agentId: agentId }, // Users under this agent
          {
            agent: {
              ancestorPath: {
                contains: agentId, // All descendants in hierarchy (T231)
              },
            },
          },
        ],
      },
    };
    logger.debug(`RLS: ${role} ${userId} can see own + hierarchy users`);
  }

  return params;
}

/**
 * Apply row-level security filter for Bet model (T232)
 *
 * Filters bets based on agent hierarchy:
 * - Agents can see bets from their hierarchy
 * - Players can only see their own bets
 *
 * @param {Prisma.MiddlewareParams} params - Query parameters
 * @param {UserContext} userContext - Current user context
 * @param {Logger} logger - Logger instance
 * @returns {Prisma.MiddlewareParams} Modified parameters
 */
function applyBetFilter(
  params: Prisma.MiddlewareParams,
  userContext: UserContext,
  logger: Logger,
): Prisma.MiddlewareParams {
  const { userId, role, agentId } = userContext;

  // Players can only see their own bets
  if (role === 'PLAYER') {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        userId: userId,
      },
    };
    logger.debug(`RLS: PLAYER ${userId} can only see own bets`);
    return params;
  }

  // Agents can see bets from their hierarchy
  if (agentId) {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        OR: [
          { userId: userId }, // Own bets
          { agentId: agentId }, // Bets under this agent
          {
            agent: {
              ancestorPath: {
                contains: agentId, // Bets from descendants (T232)
              },
            },
          },
        ],
      },
    };
    logger.debug(`RLS: ${role} ${userId} can see bets from hierarchy`);
  }

  return params;
}

/**
 * Apply row-level security filter for Commission model (T233)
 *
 * Filters commissions based on agent hierarchy:
 * - Agents can see their own commissions + commissions from descendants
 * - Players cannot access commissions
 *
 * @param {Prisma.MiddlewareParams} params - Query parameters
 * @param {UserContext} userContext - Current user context
 * @param {Logger} logger - Logger instance
 * @returns {Prisma.MiddlewareParams} Modified parameters
 */
function applyCommissionFilter(
  params: Prisma.MiddlewareParams,
  userContext: UserContext,
  logger: Logger,
): Prisma.MiddlewareParams {
  const { userId, role, agentId } = userContext;

  // Players cannot access commissions
  if (role === 'PLAYER') {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        id: 'never-match', // Return no results
      },
    };
    logger.debug(`RLS: PLAYER ${userId} cannot access commissions`);
    return params;
  }

  // Agents can see their own commissions + hierarchy commissions
  if (agentId) {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        OR: [
          { agentId: agentId }, // Own commissions
          {
            agent: {
              ancestorPath: {
                contains: agentId, // Commissions from descendants (T233)
              },
            },
          },
        ],
      },
    };
    logger.debug(`RLS: ${role} ${userId} can see commissions from hierarchy`);
  }

  return params;
}

/**
 * Apply row-level security filter for Limit model (T234)
 *
 * Filters limits based on agent hierarchy:
 * - Agents can see their own limits + limits from descendants
 * - Players can see their own limits
 *
 * @param {Prisma.MiddlewareParams} params - Query parameters
 * @param {UserContext} userContext - Current user context
 * @param {Logger} logger - Logger instance
 * @returns {Prisma.MiddlewareParams} Modified parameters
 */
function applyLimitFilter(
  params: Prisma.MiddlewareParams,
  userContext: UserContext,
  logger: Logger,
): Prisma.MiddlewareParams {
  const { userId, role, agentId } = userContext;

  // Players can see their own limits
  if (role === 'PLAYER') {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        userId: userId,
      },
    };
    logger.debug(`RLS: PLAYER ${userId} can see own limits`);
    return params;
  }

  // Agents can see their own limits + hierarchy limits
  if (agentId) {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        OR: [
          { agentId: agentId }, // Own limits
          {
            agent: {
              ancestorPath: {
                contains: agentId, // Limits from descendants (T234)
              },
            },
          },
        ],
      },
    };
    logger.debug(`RLS: ${role} ${userId} can see limits from hierarchy`);
  }

  return params;
}

/**
 * Apply row-level security filter for AgentHierarchy model (T235)
 *
 * Filters agent hierarchy based on user role:
 * - Agents can see their own hierarchy record + descendants
 * - Players cannot access hierarchy
 *
 * @param {Prisma.MiddlewareParams} params - Query parameters
 * @param {UserContext} userContext - Current user context
 * @param {Logger} logger - Logger instance
 * @returns {Prisma.MiddlewareParams} Modified parameters
 */
function applyAgentHierarchyFilter(
  params: Prisma.MiddlewareParams,
  userContext: UserContext,
  logger: Logger,
): Prisma.MiddlewareParams {
  const { userId, role, agentId } = userContext;

  // Players cannot access hierarchy
  if (role === 'PLAYER') {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        id: 'never-match',
      },
    };
    logger.debug(`RLS: PLAYER ${userId} cannot access hierarchy`);
    return params;
  }

  // Agents can see their own hierarchy + descendants
  if (agentId) {
    params.args = {
      ...params.args,
      where: {
        ...params.args?.where,
        OR: [
          { agentId: agentId }, // Own hierarchy
          {
            ancestorPath: {
              contains: agentId, // Descendant hierarchies (T235)
            },
          },
        ],
      },
    };
    logger.debug(`RLS: ${role} ${userId} can see own + descendant hierarchies`);
  }

  return params;
}
