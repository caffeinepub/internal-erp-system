import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  FileText,
  DollarSign,
  Database,
} from 'lucide-react';
import type { ModuleView } from '../pages/Dashboard';

interface PrimaryNavigationProps {
  variant: 'top' | 'sidebar';
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
  isAdmin?: boolean;
}

interface NavItem {
  id: ModuleView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'purchase', label: 'Purchasing', icon: ShoppingCart },
  { id: 'billing', label: 'Billing', icon: FileText },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'backup', label: 'Backup', icon: Database, adminOnly: true },
];

export default function PrimaryNavigation({
  variant,
  activeModule,
  onModuleChange,
  isAdmin = false,
}: PrimaryNavigationProps) {
  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  if (variant === 'top') {
    return (
      <ul className="flex items-center gap-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => onModuleChange(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  // Sidebar variant (for mobile drawer only)
  return (
    <ul className="flex flex-col gap-1 px-2">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        return (
          <li key={item.id}>
            <button
              onClick={() => onModuleChange(item.id)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
