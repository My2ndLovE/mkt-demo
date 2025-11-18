import { Link, useLocation } from 'react-router';
import {
  BarChart3,
  Dice5,
  FileText,
  Home,
  ListOrdered,
  PieChart,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('PLAYER' | 'AGENT' | 'MODERATOR')[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Place Bet',
    href: '/betting',
    icon: Dice5,
  },
  {
    title: 'My Bets',
    href: '/bets',
    icon: ListOrdered,
  },
  {
    title: 'Results',
    href: '/results',
    icon: Trophy,
  },
  {
    title: 'Commissions',
    href: '/commissions',
    icon: Wallet,
    roles: ['AGENT', 'MODERATOR'],
  },
  {
    title: 'Reports',
    href: '/reports/sales',
    icon: BarChart3,
  },
  {
    title: 'Agents',
    href: '/agents',
    icon: Users,
    roles: ['AGENT', 'MODERATOR'],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { isSidebarOpen } = useUIStore();

  if (!user) return null;

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 flex-col border-r bg-background transition-transform md:flex',
        !isSidebarOpen && '-translate-x-full'
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
