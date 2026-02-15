import { useState } from 'react';
import { useFocusedOverlay } from '../context/FocusedOverlayContext';
import Header from './Header';
import MobileNavDrawer from './MobileNavDrawer';
import type { ModuleView } from '../pages/Dashboard';

interface AppShellProps {
  children: React.ReactNode;
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
  isAdmin?: boolean;
}

export default function AppShell({ 
  children, 
  activeModule, 
  onModuleChange,
  isAdmin = false 
}: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isActive: isFocusedOverlayActive } = useFocusedOverlay();

  return (
    <div className="min-h-screen bg-background">
      {!isFocusedOverlayActive && (
        <Header
          activeModule={activeModule}
          onModuleChange={onModuleChange}
          onMobileMenuToggle={() => setIsMobileNavOpen(true)}
          isAdmin={isAdmin}
        />
      )}
      
      <main className="relative">
        {children}
      </main>

      {!isFocusedOverlayActive && (
        <MobileNavDrawer
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          activeModule={activeModule}
          onModuleChange={(module) => {
            onModuleChange(module);
            setIsMobileNavOpen(false);
          }}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
