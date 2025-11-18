import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LimitDisplay } from '../components/limit-display';
import { useLimits } from '../hooks/use-limits';
import { formatCurrency } from '../lib/utils';
import type { Route } from './+types/limits';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'My Limits - Lottery Sandbox' },
    { name: 'description', content: 'View your betting limits' },
  ];
}

export default function Limits() {
  const { data: limits, isLoading } = useLimits();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="animate-pulse">
          <CardContent className="h-96" />
        </Card>
      </div>
    );
  }

  if (!limits) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Limits</h1>
        <p className="text-muted-foreground">
          Track your weekly betting limits and usage
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LimitDisplay compact={false} showDetails />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Weekly Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(limits.weeklyLimit)}
              </div>
              <p className="text-xs text-muted-foreground">Maximum per week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Used This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(limits.weeklyUsed)}
              </div>
              <p className="text-xs text-muted-foreground">
                {limits.weeklyPercentUsed.toFixed(1)}% of limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(limits.weeklyRemaining)}
              </div>
              <p className="text-xs text-muted-foreground">Available to bet</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Weekly Limits</CardTitle>
          <CardDescription>
            Your weekly betting limit resets every week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Current Week:</strong> {new Date(limits.currentWeekStart).toLocaleDateString()} - {new Date(limits.currentWeekEnd).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Your weekly limit is set by your parent agent or system administrator
            </p>
            <p>
              • The limit resets at the beginning of each week (Sunday 00:00)
            </p>
            <p>
              • Used amount includes pending and completed bets
            </p>
            <p>
              • Cancelled bets are refunded to your available limit
            </p>
            <p>
              • Contact your agent if you need a limit increase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
