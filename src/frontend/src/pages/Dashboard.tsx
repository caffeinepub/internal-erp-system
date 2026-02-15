import { useState, useEffect } from 'react';
import { useGetCallerUserRole } from '../hooks/useQueries';
import { useHashRoute } from '../hooks/useHashRoute';
import AppShell from '../components/AppShell';
import DashboardOverview from '../components/DashboardOverview';
import BillingModule from '../components/BillingModule';
import ProductsModule from '../components/ProductsModule';
import ContactsModule from '../components/ContactsModule';
import InventoryModule from '../components/InventoryModule';
import PurchaseModule from '../components/PurchaseModule';
import FinanceModule from '../components/FinanceModule';
import AdminBackupModule from '../components/AdminBackupModule';
import EstimateEditorPage from './EstimateEditorPage';
import EstimatePrintPreviewPage from './EstimatePrintPreviewPage';

export type ModuleView =
  | 'overview'
  | 'billing'
  | 'products'
  | 'contacts'
  | 'inventory'
  | 'purchase'
  | 'finance'
  | 'backup';

export default function Dashboard() {
  const { data: userRole } = useGetCallerUserRole();
  const { route } = useHashRoute();
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');

  const isAdmin = userRole === 'admin';

  // Handle hash route changes
  useEffect(() => {
    if (route.type === 'dashboard') {
      // Stay on current module when returning to dashboard
    }
  }, [route]);

  // Render focused full-screen routes
  if (route.type === 'estimate-editor') {
    return (
      <EstimateEditorPage
        mode={route.mode}
        estimateId={route.mode === 'edit' ? route.id : undefined}
      />
    );
  }

  if (route.type === 'estimate-print') {
    return <EstimatePrintPreviewPage estimateId={route.id} />;
  }

  // Render normal dashboard with modules
  const renderModule = () => {
    switch (activeModule) {
      case 'overview':
        return <DashboardOverview />;
      case 'billing':
        return <BillingModule />;
      case 'products':
        return <ProductsModule />;
      case 'contacts':
        return <ContactsModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'purchase':
        return <PurchaseModule />;
      case 'finance':
        return <FinanceModule />;
      case 'backup':
        return isAdmin ? <AdminBackupModule /> : <DashboardOverview />;
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
      <div className="container mx-auto py-6 px-4">{renderModule()}</div>
    </AppShell>
  );
}
