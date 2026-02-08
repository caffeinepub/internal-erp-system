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
  variant: 'sidebar' | 'top';
}

export default function PrimaryNavigation({ activeModule, onModuleChange, variant }: PrimaryNavigationProps) {
  const { data: userRole } = useGetCallerUserRole();
  const isAdmin = userRole === 'admin';

  const visibleItems = navigationItems.filter(item => !item.adminOnly || isAdmin);

  if (variant === 'top') {
    return (
      <nav className="flex items-center gap-1 py-2 overflow-x-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'flex-shrink-0 gap-2 h-8 text-xs px-3',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              )}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>
    );
  }

  if (variant === 'sidebar') {
    return (
      <nav className="flex flex-col w-full p-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-2 h-8 text-xs px-2',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              )}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>
    );
  }

  return null;
}
