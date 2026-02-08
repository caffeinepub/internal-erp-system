import { Sheet, SheetContent } from '@/components/ui/sheet';
import PrimaryNavigation from './PrimaryNavigation';
import type { ModuleView } from '../pages/Dashboard';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
  isAdmin?: boolean;
}

export default function MobileNavDrawer({ 
  isOpen, 
  onClose, 
  activeModule, 
  onModuleChange,
  isAdmin = false
}: MobileNavDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className="w-64 p-0 bg-card border-r-2 shadow-2xl"
      >
        <div className="py-4">
          <h2 className="px-4 mb-4 text-lg font-semibold">Navigation</h2>
          <PrimaryNavigation
            variant="sidebar"
            activeModule={activeModule}
            onModuleChange={onModuleChange}
            isAdmin={isAdmin}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
