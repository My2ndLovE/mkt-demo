import { useState } from 'react';
import { Link } from 'react-router';
import { Trophy, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useResults } from '../../hooks/use-results';
import { useProviders } from '../../hooks/use-providers';
import { formatDate } from '../../lib/utils';
import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Results - Lottery Sandbox' },
    { name: 'description', content: 'View lottery draw results' },
  ];
}

export default function ResultsIndex() {
  const [page, setPage] = useState(1);
  const [providerId, setProviderId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useResults({
    page,
    pageSize: 10,
    ...(providerId && { providerId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const { data: providers = [] } = useProviders();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Draw Results</h1>
        <p className="text-muted-foreground">
          View past lottery draw results and winning numbers
        </p>
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
              <label className="text-sm font-medium">Provider</label>
              <Select
                value={providerId?.toString() || 'ALL'}
                onValueChange={(value) =>
                  setProviderId(value === 'ALL' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
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
                  setProviderId(undefined);
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

      {/* Results List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4">
            {data.results.map((result) => (
              <Card key={result.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      <div>
                        <CardTitle className="text-lg">
                          {result.provider.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(result.drawDate)}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/results/${result.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">1st Prize</p>
                      <Badge variant="default" className="text-lg px-4 py-2">
                        {result.firstPrize}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">2nd Prize</p>
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        {result.secondPrize}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">3rd Prize</p>
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        {result.thirdPrize}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Starters</p>
                      <div className="flex flex-wrap gap-2">
                        {result.starters.map((num, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono">
                            {num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Consolations</p>
                      <div className="flex flex-wrap gap-2">
                        {result.consolations.map((num, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono">
                            {num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No results found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
