import { Outlet, Navigate } from 'react-router';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Toaster } from '../ui/toaster';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const { isSidebarOpen } = useUIStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to change password if first login
  if (user?.firstLogin) {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main
        className={cn(
          'min-h-[calc(100vh-4rem)] pb-16 pt-4 transition-all md:pb-4',
          isSidebarOpen ? 'md:pl-64' : 'md:pl-0'
        )}
      >
        <div className="container px-4">
          <Outlet />
        </div>
      </main>

      <MobileNav />
      <Toaster />
    </div>
  );
}
