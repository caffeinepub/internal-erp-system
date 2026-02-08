import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import PrimaryNavigation from './PrimaryNavigation';
import MobileNavDrawer from './MobileNavDrawer';
import { useState } from 'react';
import type { ModuleView } from '../pages/Dashboard';

interface AppShellProps {
  children: ReactNode;
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
}

export default function AppShell({ children, activeModule, onModuleChange }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onMobileMenuClick={() => setIsMobileNavOpen(true)} />
      
      {/* Desktop Top Navigation */}
      <nav className="hidden lg:block border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-[52px] z-40 shadow-sm">
        <div className="container mx-auto px-3 max-w-7xl">
          <PrimaryNavigation
            variant="top"
            activeModule={activeModule}
            onModuleChange={onModuleChange}
          />
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeModule={activeModule}
        onModuleChange={(module) => {
          onModuleChange(module);
          setIsMobileNavOpen(false);
        }}
      />

      <main className="flex-1 container mx-auto px-3 py-4 max-w-7xl">
        {children}
      </main>

      <Footer />
    </div>
  );
}
