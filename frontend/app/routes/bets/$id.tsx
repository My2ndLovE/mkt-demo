import { Link, useParams } from 'react-router';
import { ArrowLeft, Calendar, DollarSign, Hash } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useBet, useCancelBet } from '../../hooks/use-bets';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Route } from './+types/$id';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Bet #${params.id} - Lottery Sandbox` },
    { name: 'description', content: 'View bet details' },
  ];
}

export default function BetDetails() {
  const { id } = useParams();
  const { data: bet, isLoading } = useBet(id!);
  const cancelBet = useCancelBet();

  const handleCancel = async () => {
    if (bet && window.confirm('Are you sure you want to cancel this bet?')) {
      await cancelBet.mutateAsync(bet.id);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="animate-pulse">
          <CardContent className="h-96" />
        </Card>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Bet not found</p>
            <Button asChild className="mt-4">
              <Link to="/bets">Back to Bets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusVariant = {
    PENDING: 'default',
    WON: 'success',
    LOST: 'destructive',
    CANCELLED: 'outline',
  }[bet.status] as any;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/bets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Bet Details</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {bet.receiptNumber}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receipt #{bet.receiptNumber}</CardTitle>
            <Badge variant={statusVariant}>{bet.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Game Type</p>
              <p className="font-medium">{bet.gameType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bet Type</p>
              <p className="font-medium">{bet.betType}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Providers</p>
            <div className="flex flex-wrap gap-2">
              {bet.providers.map((provider) => (
                <Badge key={provider} variant="secondary">
                  {provider}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Numbers</p>
            <div className="flex flex-wrap gap-2">
              {bet.numbers.map((number, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                >
                  <Hash className="h-4 w-4" />
                  <span className="font-mono text-lg font-bold">{number}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount per Provider</span>
              <span className="font-medium">
                {formatCurrency(bet.amountPerProvider)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Number of Providers</span>
              <span className="font-medium">{bet.providers.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total Amount
              </span>
              <span className="text-xl font-bold">
                {formatCurrency(bet.totalAmount)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Draw Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{formatDate(bet.drawDate)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Placed At</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {formatDate(bet.placedAt, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {bet.status === 'WON' && bet.winAmount && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <p className="text-center text-xl font-bold text-green-700 dark:text-green-300">
                Congratulations! You won {formatCurrency(bet.winAmount)}!
              </p>
            </div>
          )}

          {bet.status === 'PENDING' && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelBet.isPending}
              className="w-full"
            >
              {cancelBet.isPending ? 'Cancelling...' : 'Cancel Bet'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
