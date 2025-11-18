import { useState } from 'react';
import { Link } from 'react-router';
import { useBets, useCancelBet } from '@/hooks/use-bets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BetStatus } from '@/types/bet';

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState<BetStatus | 'ALL'>('ALL');
  const { data: bets, isLoading } = useBets(
    statusFilter !== 'ALL' ? { status: statusFilter } : undefined
  );
  const { mutate: cancelBet, isPending: isCancelling } = useCancelBet();

  const handleCancel = (receiptNumber: string) => {
    if (confirm('Are you sure you want to cancel this bet?')) {
      cancelBet(receiptNumber);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bet History</h1>
          <Link to="/app/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'PENDING', 'WON', 'LOST', 'CANCELLED'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bets List */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : bets && bets.length > 0 ? (
          <div className="space-y-3">
            {bets.map((bet) => (
              <Card key={bet.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {bet.numbers} - {bet.gameType}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receipt: {bet.receiptNumber}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        bet.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : bet.status === 'WON'
                          ? 'bg-green-100 text-green-800'
                          : bet.status === 'LOST'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {bet.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Providers</div>
                      <div className="font-semibold">{bet.providers.join(', ')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Bet Type</div>
                      <div className="font-semibold">{bet.betType}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Amount</div>
                      <div className="font-semibold">${bet.amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Draw Date</div>
                      <div className="font-semibold">
                        {new Date(bet.drawDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {bet.status === 'PENDING' && new Date(bet.drawDate) > new Date() && (
                    <div className="mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(bet.receiptNumber)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel Bet'}
                      </Button>
                    </div>
                  )}

                  {bet.results && bet.results.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-semibold mb-2">Results:</div>
                      <div className="space-y-1">
                        {bet.results.map((result, idx) => (
                          <div key={idx} className="text-sm flex justify-between">
                            <span>
                              {result.provider} - {result.prizeCategory || result.status}
                            </span>
                            <span className="font-semibold">
                              {result.winAmount > 0 ? `$${result.winAmount.toFixed(2)}` : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No bets found. <Link to="/app/betting" className="text-primary hover:underline">Place your first bet</Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
