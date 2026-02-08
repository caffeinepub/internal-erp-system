import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import PrimaryNavigation from './PrimaryNavigation';
import type { ModuleView } from '../pages/Dashboard';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: ModuleView;
  onModuleChange: (module: ModuleView) => void;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  activeModule,
  onModuleChange,
}: MobileNavDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 bg-card border-2 shadow-2xl">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <PrimaryNavigation
            variant="sidebar"
            activeModule={activeModule}
            onModuleChange={onModuleChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
