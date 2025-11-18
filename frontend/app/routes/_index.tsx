import { Link } from 'react-router';
import { DollarSign, Dice5, Trophy, TrendingUp, Plus, ListOrdered } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { StatsCard } from '../components/stats-card';
import { LimitDisplay } from '../components/limit-display';
import { BetCard } from '../components/bet-card';
import { useAuthStore } from '../stores/auth-store';
import { useRecentBets, useCancelBet } from '../hooks/use-bets';
import { useLimits } from '../hooks/use-limits';
import { useLatestResults } from '../hooks/use-results';
import { useRecentCommissions } from '../hooks/use-commissions';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Route } from './+types/_index';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dashboard - Lottery Sandbox' },
    { name: 'description', content: 'Multi-Level Agent Lottery Sandbox System' },
  ];
}

export default function Index() {
  const { user } = useAuthStore();
  const { data: recentBets = [], isLoading: betsLoading } = useRecentBets(5);
  const { data: limits } = useLimits();
  const { data: latestResults = [] } = useLatestResults(3);
  const { data: recentCommissions = [] } = useRecentCommissions(5);
  const cancelBet = useCancelBet();

  const handleCancelBet = async (betId: number) => {
    if (window.confirm('Are you sure you want to cancel this bet?')) {
      await cancelBet.mutateAsync(betId);
    }
  };

  if (!user) return null;

  const isAgent = user.role === 'AGENT' || user.role === 'MODERATOR';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {user.fullName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your lottery account today
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button asChild size="lg">
          <Link to="/betting">
            <Dice5 className="mr-2 h-5 w-5" />
            Place New Bet
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/results">
            <Trophy className="mr-2 h-5 w-5" />
            View Results
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/bets">
            <ListOrdered className="mr-2 h-5 w-5" />
            My Bets
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Weekly Limit"
          value={formatCurrency(limits?.weeklyLimit || 0)}
          description="Maximum per week"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard
          title="Weekly Used"
          value={formatCurrency(limits?.weeklyUsed || 0)}
          description={`${(limits?.weeklyPercentUsed || 0).toFixed(1)}% of limit`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Remaining"
          value={formatCurrency(limits?.weeklyRemaining || 0)}
          description="Available to bet"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard
          title="Recent Bets"
          value={recentBets.length}
          description="Last 5 bets"
          icon={<Dice5 className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bets */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bets</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/bets">View All</Link>
                </Button>
              </div>
              <CardDescription>
                Your latest lottery bets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {betsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentBets.length > 0 ? (
                <div className="space-y-4">
                  {recentBets.map((bet) => (
                    <BetCard
                      key={bet.id}
                      bet={bet}
                      onCancel={handleCancelBet}
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No bets yet</p>
                  <Button asChild>
                    <Link to="/betting">
                      <Plus className="mr-2 h-4 w-4" />
                      Place Your First Bet
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Latest Draw Results</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/results">View All</Link>
                </Button>
              </div>
              <CardDescription>
                Recent lottery draw results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestResults.length > 0 ? (
                <div className="space-y-4">
                  {latestResults.map((result) => (
                    <div
                      key={result.id}
                      className="rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{result.provider.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(result.drawDate)}
                          </p>
                        </div>
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">1st</p>
                          <p className="font-bold">{result.firstPrize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">2nd</p>
                          <p className="font-bold">{result.secondPrize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">3rd</p>
                          <p className="font-bold">{result.thirdPrize}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No results available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Limits */}
          <LimitDisplay compact />

          {/* Commissions (for agents only) */}
          {isAgent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Commissions</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/commissions">View All</Link>
                  </Button>
                </div>
                <CardDescription>
                  Latest commission earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentCommissions.length > 0 ? (
                  <div className="space-y-3">
                    {recentCommissions.map((commission) => (
                      <div
                        key={commission.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {commission.sourceAgent.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(commission.createdAt, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <p className="font-bold text-green-600">
                          {formatCurrency(commission.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No commissions yet
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {formatDate(user.createdAt, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
