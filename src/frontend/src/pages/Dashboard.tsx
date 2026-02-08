import { useState } from 'react';
import { useGetCallerUserRole } from '../hooks/useQueries';
import AppShell from '../components/AppShell';
import DashboardOverview from '../components/DashboardOverview';
import InventoryModule from '../components/InventoryModule';
import ContactsModule from '../components/ContactsModule';
import ProductsModule from '../components/ProductsModule';
import FinanceModule from '../components/FinanceModule';
import BillingModule from '../components/BillingModule';
import PurchaseModule from '../components/PurchaseModule';
import AdminBackupModule from '../components/AdminBackupModule';
import AccessDeniedScreen from '../components/AccessDeniedScreen';

export type ModuleView = 'dashboard' | 'inventory' | 'contacts' | 'products' | 'purchase' | 'billing' | 'finance' | 'backup';

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleView>('dashboard');
  const { data: userRole } = useGetCallerUserRole();
  const isAdmin = userRole === 'admin';

  // Render the active module content
  const renderModuleContent = () => {
    switch (activeModule) {
      case 'dashboard':
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
        return isAdmin ? <AdminBackupModule /> : <AccessDeniedScreen />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <AppShell activeModule={activeModule} onModuleChange={setActiveModule}>
      {renderModuleContent()}
    </AppShell>
  );
}
