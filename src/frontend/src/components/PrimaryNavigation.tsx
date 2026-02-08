import { Package, Users, ShoppingCart, FileText, DollarSign, BarChart3, Database, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModuleView } from '../pages/Dashboard';

interface PrimaryNavigationProps {
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
  variant?: 'top' | 'sidebar';
  isAdmin?: boolean;
}

const navigationItems = [
  { id: 'overview' as ModuleView, label: 'Overview', icon: LayoutDashboard },
  { id: 'products' as ModuleView, label: 'Products', icon: Package },
  { id: 'inventory' as ModuleView, label: 'Inventory', icon: ShoppingCart },
  { id: 'contacts' as ModuleView, label: 'Contacts', icon: Users },
  { id: 'purchase' as ModuleView, label: 'Purchasing', icon: ShoppingCart },
  { id: 'billing' as ModuleView, label: 'Billing', icon: FileText },
  { id: 'finance' as ModuleView, label: 'Finance', icon: DollarSign },
  { id: 'backup' as ModuleView, label: 'Backup', icon: Database, adminOnly: true },
];

export default function PrimaryNavigation({ 
  activeModule, 
  onModuleChange, 
  variant = 'top',
  isAdmin = false 
}: PrimaryNavigationProps) {
  const filteredItems = navigationItems.filter(item => !item.adminOnly || isAdmin);

  if (variant === 'top') {
    return (
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Sidebar variant
  return (
    <nav className="flex flex-col gap-1 p-2">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onModuleChange(item.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
