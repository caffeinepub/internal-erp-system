import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, LogIn } from 'lucide-react';
import PrimaryNavigation from './PrimaryNavigation';
import type { ModuleView } from '../pages/Dashboard';

interface HeaderProps {
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
  onMobileMenuToggle: () => void;
  isAdmin?: boolean;
}

export default function Header({ 
  activeModule, 
  onModuleChange, 
  onMobileMenuToggle,
  isAdmin = false 
}: HeaderProps) {
  const { identity, clear, loginStatus, login } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left: Logo + Desktop Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
              PN
            </div>
            <span className="hidden sm:inline-block font-semibold text-sm">TRADING ERP</span>
          </div>

          {/* Desktop Navigation (Top Menu Bar) */}
          <nav className="hidden md:block">
            <PrimaryNavigation
              variant="top"
              activeModule={activeModule}
              onModuleChange={onModuleChange}
              isAdmin={isAdmin}
            />
          </nav>
        </div>

        {/* Right: Auth Button + Mobile Menu */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAuth}
            disabled={isLoggingIn}
            variant={isAuthenticated ? 'ghost' : 'default'}
            size="sm"
            className="gap-2"
          >
            {isLoggingIn ? (
              'Logging in...'
            ) : isAuthenticated ? (
              <>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </>
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
