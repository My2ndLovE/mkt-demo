import { useState } from 'react';
import { Link } from 'react-router';
import { useProviders } from '@/hooks/use-providers';
import { usePlaceBet } from '@/hooks/use-bets';
import { WeeklyLimitCard } from '@/components/features/weekly-limit-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateBetRequest, GameType, BetType } from '@/types/bet';

export default function BettingPage() {
  const { data: providers } = useProviders(true);
  const { mutate: placeBet, isPending, isSuccess, data: placedBet, error } = usePlaceBet();

  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [gameType, setGameType] = useState<GameType>('4D');
  const [betType, setBetType] = useState<BetType>('BIG');
  const [numbers, setNumbers] = useState('');
  const [amount, setAmount] = useState('10');

  const handleProviderToggle = (code: string) => {
    setSelectedProviders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get next draw date (simplified - use current date + 1 day at 7 PM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);

    const betData: CreateBetRequest = {
      providers: selectedProviders,
      gameType,
      betType,
      numbers,
      amount: Number(amount),
      drawDate: tomorrow.toISOString(),
    };

    placeBet(betData);
  };

  const resetForm = () => {
    setNumbers('');
    setAmount('10');
    setSelectedProviders([]);
  };

  if (isSuccess && placedBet) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✓ Bet Placed Successfully!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Receipt Number:</span>
                  <span className="font-mono">{placedBet.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Numbers:</span>
                  <span className="text-lg font-bold">{placedBet.numbers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Providers:</span>
                  <span>{placedBet.providers.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Amount:</span>
                  <span className="text-lg">${placedBet.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Game Type:</span>
                  <span>{placedBet.gameType} - {placedBet.betType}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetForm} className="flex-1">
                  Place Another Bet
                </Button>
                <Link to="/app/history" className="flex-1">
                  <Button variant="outline" className="w-full">
                    View History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Place Bet</h1>
          <Link to="/app/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Bet Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Providers */}
                  <div className="space-y-2">
                    <Label>Select Providers (Multi-select)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {providers?.map((provider) => (
                        <button
                          key={provider.code}
                          type="button"
                          onClick={() => handleProviderToggle(provider.code)}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            selectedProviders.includes(provider.code)
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">{provider.code}</div>
                          <div className="text-xs text-gray-600">{provider.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Game Type */}
                  <div className="space-y-2">
                    <Label>Game Type</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['3D', '4D', '5D', '6D'] as GameType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setGameType(type)}
                          className={`p-2 rounded border-2 ${
                            gameType === type
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bet Type */}
                  <div className="space-y-2">
                    <Label>Bet Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['BIG', 'SMALL', 'IBOX'] as BetType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBetType(type)}
                          className={`p-2 rounded border-2 ${
                            betType === type ? 'border-primary bg-primary/10' : 'border-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="space-y-2">
                    <Label htmlFor="numbers">Numbers</Label>
                    <Input
                      id="numbers"
                      placeholder={`Enter ${gameType} numbers (e.g., ${gameType === '4D' ? '1234' : '123'})`}
                      value={numbers}
                      onChange={(e) => setNumbers(e.target.value.replace(/\D/g, ''))}
                      maxLength={parseInt(gameType.charAt(0))}
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount per Provider ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    {selectedProviders.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Total: ${(Number(amount) * selectedProviders.length).toFixed(2)} ({selectedProviders.length} providers × ${amount})
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {error instanceof Error ? error.message : 'Failed to place bet'}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || selectedProviders.length === 0}
                  >
                    {isPending ? 'Placing Bet...' : 'Place Bet'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <WeeklyLimitCard />
          </div>
        </div>
      </div>
    </div>
  );
}
