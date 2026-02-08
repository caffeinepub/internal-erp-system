import { useState } from 'react';
import AppShell from '../components/AppShell';
import DashboardOverview from '../components/DashboardOverview';
import InventoryModule from '../components/InventoryModule';
import ContactsModule from '../components/ContactsModule';
import ProductsModule from '../components/ProductsModule';
import PurchaseModule from '../components/PurchaseModule';
import BillingModule from '../components/BillingModule';
import FinanceModule from '../components/FinanceModule';
import AdminBackupModule from '../components/AdminBackupModule';
import { useGetCallerUserRole } from '../hooks/useQueries';
import { UserRole } from '../backend';

export type ModuleView = 
  | 'overview' 
  | 'inventory' 
  | 'contacts' 
  | 'products' 
  | 'purchase' 
  | 'billing' 
  | 'finance'
  | 'backup';

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  const isAdmin = userRole === UserRole.admin;

  const renderModule = () => {
    switch (activeModule) {
      case 'overview':
        return <DashboardOverview />;
      case 'inventory':
        return <InventoryModule />;
      case 'contacts':
        return <ContactsModule />;
      case 'products':
        return <ProductsModule />;
      case 'purchase':
        return <PurchaseModule />;
      case 'billing':
        return <BillingModule />;
      case 'finance':
        return <FinanceModule />;
      case 'backup':
        // Show backup module when role is loaded and user is admin
        return !roleLoading && isAdmin ? <AdminBackupModule /> : <DashboardOverview />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <AppShell 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
      isAdmin={isAdmin}
    >
      {renderModule()}
    </AppShell>
  );
}
