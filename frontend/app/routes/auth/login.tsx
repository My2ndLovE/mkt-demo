import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Lottery Sandbox</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {loginError instanceof Error ? loginError.message : 'Login failed. Please try again.'}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-xs text-center text-muted-foreground space-y-1">
              <p>Default credentials:</p>
              <p>Agent: agent1 / Agent123!</p>
              <p>Moderator: moderator1 / Moderator123!</p>
              <p>Admin: admin / Admin123!</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
