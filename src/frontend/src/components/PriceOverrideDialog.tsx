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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PriceOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  costPrice: number;
  sellingPrice: number;
  itemName: string;
}

export default function PriceOverrideDialog({
  isOpen,
  onClose,
  onApprove,
  costPrice,
  sellingPrice,
  itemName,
}: PriceOverrideDialogProps) {
  const loss = costPrice - sellingPrice;
  const lossPercentage = ((loss / costPrice) * 100).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Price Override Required
          </DialogTitle>
          <DialogDescription>
            Admin approval needed for transaction with selling price below cost price
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Warning: Selling below cost price</p>
              <p className="text-sm">
                This transaction will result in a loss. Please review carefully before approving.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Item:</span>
              <span className="text-sm">{itemName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Cost Price:</span>
              <span className="text-sm">₹{costPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Selling Price:</span>
              <span className="text-sm text-destructive">₹{sellingPrice.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm font-semibold">Loss:</span>
              <span className="text-sm font-semibold text-destructive">
                ₹{loss.toFixed(2)} ({lossPercentage}%)
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onApprove}>
            Approve Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
