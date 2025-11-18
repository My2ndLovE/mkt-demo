import { Link } from 'react-router';
import { Plus, Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useMyDownlines } from '../../hooks/use-agents';
import { useAuthStore } from '../../stores/auth-store';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Agents - Lottery Sandbox' },
    { name: 'description', content: 'Manage your downline agents' },
  ];
}

export default function AgentsIndex() {
  const { user } = useAuthStore();
  const { data: downlines = [], isLoading } = useMyDownlines();

  // Redirect if not an agent
  if (user && user.role === 'PLAYER') {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Agent management is only available for agents
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Agents</h1>
          <p className="text-muted-foreground">
            Manage and view your downline agents
          </p>
        </div>
        {user?.canCreateSubs && (
          <Button asChild>
            <Link to="/agents/create">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downlines.length}</div>
            <p className="text-xs text-muted-foreground">
              Direct downlines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {downlines.filter((a) => a.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Limits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                downlines.reduce((sum, agent) => sum + agent.weeklyLimit, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined weekly limits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Downline Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading agents...</p>
            </div>
          ) : downlines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weekly Limit</TableHead>
                  <TableHead>Weekly Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downlines.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{agent.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          @{agent.username}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{agent.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={agent.isActive ? 'success' : 'destructive'}
                      >
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(agent.weeklyLimit)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(agent.weeklyUsed)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({((agent.weeklyUsed / agent.weeklyLimit) * 100).toFixed(0)}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDate(agent.createdAt, { month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/agents/${agent.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No downline agents yet</p>
              {user?.canCreateSubs && (
                <Button asChild>
                  <Link to="/agents/create">Create Your First Agent</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
