import { useState } from 'react';
import { Link } from 'react-router';
import { Filter, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { BetCard } from '../../components/bet-card';
import { useBets, useCancelBet } from '../../hooks/use-bets';
import type { Route } from './+types/index';
import type { BetStatus } from '../../types';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'My Bets - Lottery Sandbox' },
    { name: 'description', content: 'View and manage your bets' },
  ];
}

export default function BetsIndex() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BetStatus | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useBets({
    page,
    pageSize: 10,
    ...(status !== 'ALL' && { status: status as BetStatus }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const cancelBet = useCancelBet();

  const handleCancelBet = async (betId: number) => {
    if (window.confirm('Are you sure you want to cancel this bet?')) {
      await cancelBet.mutateAsync(betId);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bets</h1>
          <p className="text-muted-foreground">
            View and manage all your lottery bets
          </p>
        </div>
        <Button asChild>
          <Link to="/betting">
            <Plus className="mr-2 h-4 w-4" />
            Place New Bet
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="WON">Won</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bets List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : data && data.bets.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.bets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                onCancel={handleCancelBet}
                showActions
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No bets found</p>
            <Button asChild>
              <Link to="/betting">Place Your First Bet</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
