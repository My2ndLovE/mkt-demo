import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, DollarSign, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LimitDisplay } from '../components/limit-display';
import { NumberInput } from '../components/number-input';
import { ProviderCheckbox } from '../components/provider-checkbox';
import { Receipt } from '../components/receipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { usePlaceBet } from '../hooks/use-bets';
import { useActiveProviders } from '../hooks/use-providers';
import { useLimits } from '../hooks/use-limits';
import { betSchema, type BetFormData } from '../schemas/bet-schema';
import { formatCurrency } from '../lib/utils';
import type { Route } from './+types/betting';
import type { ProviderCode, GameType, BetType } from '../types';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Place Bet - Lottery Sandbox' },
    { name: 'description', content: 'Place your lottery bets' },
  ];
}

export default function Betting() {
  const navigate = useNavigate();
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const { data: providers = [], isLoading: providersLoading } = useActiveProviders();
  const { data: limits } = useLimits();
  const placeBet = usePlaceBet();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BetFormData>({
    resolver: zodResolver(betSchema),
    defaultValues: {
      providers: [],
      gameType: '4D',
      betType: 'BIG',
      numbers: [],
      amountPerProvider: 1,
      drawDate: getTomorrowDate(),
    },
  });

  const watchedProviders = watch('providers');
  const watchedGameType = watch('gameType');
  const watchedNumbers = watch('numbers');
  const watchedAmount = watch('amountPerProvider');

  const totalAmount = watchedProviders.length * watchedAmount;
  const canAfford = limits ? limits.weeklyRemaining >= totalAmount : true;

  const onSubmit = async (data: BetFormData) => {
    const result = await placeBet.mutateAsync(data);
    setLastReceipt(result.receipt);
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    navigate('/bets');
  };

  if (providersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Place Bet</h1>
        <p className="text-muted-foreground">
          Select providers, game type, and numbers to place your bet
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Providers Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Providers</CardTitle>
                <CardDescription>
                  Choose one or more lottery providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {providers.map((provider) => (
                  <Controller
                    key={provider.code}
                    name="providers"
                    control={control}
                    render={({ field }) => (
                      <ProviderCheckbox
                        provider={provider}
                        checked={field.value.includes(provider.code)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...field.value, provider.code]
                            : field.value.filter((p) => p !== provider.code);
                          field.onChange(newValue);
                        }}
                      />
                    )}
                  />
                ))}
                {errors.providers && (
                  <p className="text-sm text-red-600">{errors.providers.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Game Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
                <CardDescription>
                  Choose game type, bet type, and amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gameType">Game Type</Label>
                    <Controller
                      name="gameType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="gameType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3D">3D</SelectItem>
                            <SelectItem value="4D">4D</SelectItem>
                            <SelectItem value="5D">5D</SelectItem>
                            <SelectItem value="6D">6D</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="betType">Bet Type</Label>
                    <Controller
                      name="betType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="betType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BIG">BIG</SelectItem>
                            <SelectItem value="SMALL">SMALL</SelectItem>
                            <SelectItem value="IBOX">IBOX</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amountPerProvider">
                      Amount per Provider ($)
                    </Label>
                    <Input
                      id="amountPerProvider"
                      type="number"
                      min="1"
                      max="10000"
                      {...register('amountPerProvider', { valueAsNumber: true })}
                    />
                    {errors.amountPerProvider && (
                      <p className="text-sm text-red-600">
                        {errors.amountPerProvider.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="drawDate">Draw Date</Label>
                    <Input
                      id="drawDate"
                      type="date"
                      min={getTomorrowDate()}
                      {...register('drawDate')}
                    />
                    {errors.drawDate && (
                      <p className="text-sm text-red-600">
                        {errors.drawDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Numbers Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Numbers</CardTitle>
                <CardDescription>
                  Enter your lucky numbers ({watchedGameType})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  name="numbers"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      gameType={watchedGameType}
                      numbers={field.value}
                      onNumbersChange={field.onChange}
                    />
                  )}
                />
                {errors.numbers && (
                  <p className="text-sm text-red-600 mt-2">
                    {errors.numbers.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Providers Selected
                      </span>
                      <span className="font-medium">{watchedProviders.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Numbers Selected
                      </span>
                      <span className="font-medium">{watchedNumbers.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Amount per Provider
                      </span>
                      <span className="font-medium">
                        {formatCurrency(watchedAmount)}
                      </span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Total Amount
                      </span>
                      <span className="text-xl font-bold">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {!canAfford && (
                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Insufficient weekly limit. You can only bet up to{' '}
                        {formatCurrency(limits?.weeklyRemaining || 0)}.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={placeBet.isPending || !canAfford}
                  >
                    {placeBet.isPending ? (
                      'Placing Bet...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Place Bet - {formatCurrency(totalAmount)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="space-y-6">
          <LimitDisplay compact={false} showDetails />
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bet Placed Successfully!</DialogTitle>
          </DialogHeader>
          {lastReceipt && <Receipt receipt={lastReceipt} />}
          <Button onClick={handleCloseReceipt} className="w-full">
            View My Bets
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}
