import { useGetCallerUserRole } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  ShoppingBag, 
  FileText, 
  DollarSign,
  Database
} from 'lucide-react';
import type { ModuleView } from '../pages/Dashboard';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: ModuleView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'products', label: 'Products', icon: ShoppingCart },
  { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
  { id: 'billing', label: 'Billing', icon: FileText },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'backup', label: 'Backup', icon: Database, adminOnly: true },
];

interface PrimaryNavigationProps {
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
  variant: 'sidebar' | 'bottom';
}

export default function PrimaryNavigation({ activeModule, onModuleChange, variant }: PrimaryNavigationProps) {
  const { data: userRole } = useGetCallerUserRole();
  const isAdmin = userRole === 'admin';

  const visibleItems = navigationItems.filter(item => !item.adminOnly || isAdmin);

  if (variant === 'sidebar') {
    return (
      <nav className="flex flex-col w-full p-4 space-y-2">
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Modules
          </h2>
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-11',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              )}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Button>
          );
        })}
      </nav>
    );
  }

  // Bottom navigation for mobile
  return (
    <nav className="flex items-center justify-around w-full px-2 py-2">
      {visibleItems.slice(0, 5).map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        return (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={cn(
              'flex flex-col items-center gap-1 h-auto py-2 px-3',
              isActive && 'text-primary'
            )}
            onClick={() => onModuleChange(item.id)}
          >
            <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
            <span className="text-xs">{item.label}</span>
          </Button>
        );
      })}
    </nav>
  );
}
