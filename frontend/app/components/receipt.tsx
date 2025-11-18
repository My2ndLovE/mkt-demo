import { Calendar, DollarSign, Hash, Printer, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { formatCurrency, formatDate } from '../lib/utils';
import type { BetReceipt } from '../types';

interface ReceiptProps {
  receipt: BetReceipt;
  showPrintButton?: boolean;
}

export function Receipt({ receipt, showPrintButton = true }: ReceiptProps) {
  const { receiptNumber, bet, providers, user } = receipt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="max-w-md mx-auto print:shadow-none print:border-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bet Receipt</CardTitle>
        <p className="text-sm text-muted-foreground">Lottery Sandbox System</p>
        <p className="font-mono text-lg font-bold mt-2">{receiptNumber}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        {/* User Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Player:</span>
            <span className="font-medium">{user.fullName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Placed:</span>
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

        <Separator />

        {/* Bet Details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Game Type</p>
              <p className="font-medium">{bet.gameType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bet Type</p>
              <p className="font-medium">{bet.betType}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Providers</p>
            <div className="flex flex-wrap gap-2">
              {providers.map((provider) => (
                <div
                  key={provider.code}
                  className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium"
                >
                  {provider.name}
                </div>
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

          <div>
            <p className="text-sm text-muted-foreground">Draw Date</p>
            <p className="font-medium">{formatDate(bet.drawDate)}</p>
          </div>
        </div>

        <Separator />

        {/* Pricing */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount per Provider</span>
            <span className="font-medium">
              {formatCurrency(bet.amountPerProvider)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Number of Providers</span>
            <span className="font-medium">{bet.providers.length}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Amount
            </span>
            <span className="text-xl font-bold">
              {formatCurrency(bet.totalAmount)}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-lg font-bold">{bet.status}</p>
        </div>

        {showPrintButton && (
          <Button onClick={handlePrint} className="w-full print:hidden">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Keep this receipt for your records. Receipt number: {receiptNumber}
        </p>
      </CardContent>
    </Card>
  );
}
