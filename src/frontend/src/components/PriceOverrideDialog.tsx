import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface PriceOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  costPrice: number;
  sellingPrice: number;
  itemName?: string;
}

export default function PriceOverrideDialog({
  isOpen,
  onClose,
  onApprove,
  costPrice,
  sellingPrice,
  itemName,
}: PriceOverrideDialogProps) {
  const [isApproving, setIsApproving] = useState(false);

  const profitLoss = sellingPrice - costPrice;
  const profitPercentage = costPrice > 0 ? ((profitLoss / costPrice) * 100) : 0;

  const handleApprove = async () => {
    setIsApproving(true);
    await onApprove();
    setIsApproving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Price Override Required
          </DialogTitle>
          <DialogDescription>
            Admin approval is required for this transaction with inconsistent pricing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {itemName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium">{itemName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost Price:</span>
            <span className="font-medium">₹{costPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Selling Price:</span>
            <span className="font-medium">₹{sellingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profit/Loss:</span>
            <span className={`font-medium ${profitLoss < 0 ? 'text-destructive' : 'text-green-600'}`}>
              ₹{profitLoss.toFixed(2)} ({profitPercentage.toFixed(2)}%)
            </span>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-4">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Warning: Selling price is less than cost price. This will result in a loss.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApproving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleApprove} disabled={isApproving}>
            {isApproving ? 'Approving...' : 'Approve Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
