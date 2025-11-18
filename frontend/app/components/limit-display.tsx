import { AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { formatCurrency } from '../lib/utils';
import { useLimits } from '../hooks/use-limits';
import { getLimitColor, getLimitProgressColor } from '../hooks/use-limits';

interface LimitDisplayProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function LimitDisplay({ compact = false, showDetails = true }: LimitDisplayProps) {
  const { data: limits, isLoading } = useLimits();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!limits) return null;

  const { weeklyLimit, weeklyUsed, weeklyRemaining, weeklyPercentUsed } = limits;
  const isNearLimit = weeklyPercentUsed >= 80;
  const textColor = getLimitColor(weeklyPercentUsed);
  const progressColor = getLimitProgressColor(weeklyPercentUsed);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Weekly Limit</span>
          <span className={`font-semibold ${textColor}`}>
            {formatCurrency(weeklyRemaining)} remaining
          </span>
        </div>
        <Progress
          value={weeklyPercentUsed}
          className="h-2"
          style={{
            ['--progress-bg' as any]: progressColor,
          }}
        />
        <p className="text-xs text-muted-foreground">
          {formatCurrency(weeklyUsed)} of {formatCurrency(weeklyLimit)} used ({weeklyPercentUsed.toFixed(1)}%)
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Limit
          </CardTitle>
          {isNearLimit && (
            <AlertCircle className="h-5 w-5 text-orange-600" />
          )}
        </div>
        {showDetails && (
          <CardDescription>
            Current week: {new Date(limits.currentWeekStart).toLocaleDateString()} -{' '}
            {new Date(limits.currentWeekEnd).toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isNearLimit && (
          <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {weeklyPercentUsed >= 90
                ? 'You are approaching your weekly limit!'
                : 'You have used most of your weekly limit.'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Used</span>
            <span className="text-sm font-medium">{formatCurrency(weeklyUsed)}</span>
          </div>

          <Progress value={weeklyPercentUsed} className="h-3" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Remaining</span>
            <span className={`text-sm font-bold ${textColor}`}>
              {formatCurrency(weeklyRemaining)}
            </span>
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Limit</p>
              <p className="text-lg font-bold">{formatCurrency(weeklyLimit)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usage</p>
              <p className="text-lg font-bold">{weeklyPercentUsed.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
