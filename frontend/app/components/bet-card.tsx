import { Link } from 'react-router';
import { Calendar, DollarSign, Hash, Receipt } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Bet } from '../types';

interface BetCardProps {
  bet: Bet;
  onCancel?: (betId: number) => void;
  showActions?: boolean;
}

export function BetCard({ bet, onCancel, showActions = true }: BetCardProps) {
  const canCancel = bet.status === 'PENDING' && showActions;

  const statusVariant = {
    PENDING: 'default',
    WON: 'success',
    LOST: 'destructive',
    CANCELLED: 'outline',
  }[bet.status] as 'default' | 'success' | 'destructive' | 'outline';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono text-sm font-medium">
              {bet.receiptNumber}
            </span>
          </div>
          <Badge variant={statusVariant}>{bet.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Providers</p>
            <div className="flex gap-1">
              {bet.providers.map((provider) => (
                <Badge key={provider} variant="secondary" className="text-xs">
                  {provider}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Game Type</p>
            <p className="text-sm font-medium">
              {bet.gameType} / {bet.betType}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Numbers</p>
          <div className="flex flex-wrap gap-2">
            {bet.numbers.map((number, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1"
              >
                <Hash className="h-3 w-3" />
                <span className="font-mono text-sm font-semibold">
                  {number}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(bet.totalAmount)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(bet.drawDate)}</span>
          </div>
        </div>

        {bet.status === 'WON' && bet.winAmount && (
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
            <p className="text-center text-lg font-bold text-green-700 dark:text-green-300">
              Won {formatCurrency(bet.winAmount)}!
            </p>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2 pt-0">
          <Button asChild variant="outline" className="flex-1" size="sm">
            <Link to={`/bets/${bet.id}`}>View Details</Link>
          </Button>

          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel?.(bet.id)}
              className="flex-1"
            >
              Cancel Bet
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
