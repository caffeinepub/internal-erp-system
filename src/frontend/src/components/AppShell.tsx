import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import PrimaryNavigation from './PrimaryNavigation';
import type { ModuleView } from '../pages/Dashboard';

interface AppShellProps {
  children: ReactNode;
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
}

export default function AppShell({ children, activeModule, onModuleChange }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 border-r bg-card/30 backdrop-blur-sm">
          <PrimaryNavigation 
            activeModule={activeModule} 
            onModuleChange={onModuleChange}
            variant="sidebar"
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm z-40">
        <PrimaryNavigation 
          activeModule={activeModule} 
          onModuleChange={onModuleChange}
          variant="bottom"
        />
      </div>

      <Footer />
    </div>
  );
}
