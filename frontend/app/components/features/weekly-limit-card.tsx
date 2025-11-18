import { useWeeklyLimit } from '@/hooks/use-limits';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function WeeklyLimitCard() {
  const { data: limit, isLoading } = useWeeklyLimit();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limit) return null;

  const percentageUsed = limit.percentage;
  const progressColor =
    percentageUsed >= 90 ? 'bg-red-500' : percentageUsed >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Limit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-bold text-lg">${limit.remaining.toFixed(2)}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${progressColor} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Used: ${limit.weeklyUsed.toFixed(2)}</span>
          <span>Limit: ${limit.weeklyLimit.toFixed(2)}</span>
        </div>

        {percentageUsed >= 90 && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            ⚠️ You've used {percentageUsed.toFixed(0)}% of your weekly limit
          </div>
        )}
      </CardContent>
    </Card>
  );
}
