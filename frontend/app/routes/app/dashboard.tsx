import { Link } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useBets } from '@/hooks/use-bets';
import { WeeklyLimitCard } from '@/components/features/weekly-limit-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: recentBets } = useBets({});

  const pendingBets = recentBets?.filter((bet) => bet.status === 'PENDING') || [];
  const wonBets = recentBets?.filter((bet) => bet.status === 'WON') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Lottery Sandbox</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.fullName}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Weekly Limit */}
          <WeeklyLimitCard />

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Bets</CardTitle>
              <CardDescription>Awaiting draw results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingBets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Winning Bets</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{wonBets.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/app/betting">
              <CardHeader>
                <CardTitle>Place New Bet</CardTitle>
                <CardDescription>Quick betting or detailed form</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/app/history">
              <CardHeader>
                <CardTitle>Bet History</CardTitle>
                <CardDescription>View and manage your bets</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
