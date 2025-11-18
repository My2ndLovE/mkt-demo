import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  // Public routes
  route('login', './routes/login.tsx'),
  route('change-password', './routes/change-password.tsx'),

  // Protected routes with layout
  layout('./components/layout/app-layout.tsx', [
    index('./routes/_index.tsx'),
    route('betting', './routes/betting.tsx'),
    route('bets', './routes/bets/index.tsx'),
    route('bets/:id', './routes/bets/$id.tsx'),
    route('results', './routes/results/index.tsx'),
    route('commissions', './routes/commissions.tsx'),
    route('agents', './routes/agents/index.tsx'),
    route('profile', './routes/profile.tsx'),
    route('limits', './routes/limits.tsx'),
  ]),
] satisfies RouteConfig;
