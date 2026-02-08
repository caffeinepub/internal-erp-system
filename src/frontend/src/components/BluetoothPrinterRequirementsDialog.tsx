import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BluetoothPrinterRequirementsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BluetoothPrinterRequirementsDialog({
  isOpen,
  onClose,
}: BluetoothPrinterRequirementsDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

    const styles = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
      }
      h1 {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 24px;
        color: #1a1a1a;
        text-align: center;
      }
      .requirements-list {
        margin-bottom: 32px;
      }
      .requirements-list h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #1a1a1a;
      }
      .requirements-list ul {
        list-style: disc;
        padding-left: 24px;
        line-height: 1.8;
      }
      .requirements-list li {
        font-size: 15px;
        margin-bottom: 8px;
      }
      .image-container {
        margin-top: 32px;
        text-align: center;
        page-break-inside: avoid;
      }
      .image-container img {
        max-width: 100%;
        height: auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .image-caption {
        font-size: 13px;
        color: #666;
        margin-top: 12px;
        font-style: italic;
      }
      @media print {
        body {
          padding: 20px;
        }
        @page {
          margin: 1cm;
          size: A4;
        }
      }
    `;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bluetooth Printer Requirements</title>
          <style>${styles}</style>
        </head>
        <body>
          <h1>Bluetooth Printer Requirements</h1>
          
          <div class="requirements-list">
            <h2>Requirements:</h2>
            <ul>
              <li>Bluetooth must be enabled on your device</li>
              <li>Printer must be powered on and in pairing mode</li>
              <li>Page must be served over HTTPS (secure connection)</li>
              <li>Compatible with most ESC/POS thermal printers</li>
            </ul>
          </div>

          <div class="image-container">
            <img src="/assets/generated/bluetooth-print-requirements-reference.dim_1200x800.png" alt="Bluetooth Printer Reference" />
            <p class="image-caption">Reference image for Bluetooth thermal printer setup</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Bluetooth Printer Requirements
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Requirements List */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Bluetooth must be enabled on your device</li>
                <li>Printer must be powered on and in pairing mode</li>
                <li>Page must be served over HTTPS (secure connection)</li>
                <li>Compatible with most ESC/POS thermal printers</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Reference Image */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Reference Image:</h3>
            <div className="bg-white p-4 rounded-lg border">
              <img
                src="/assets/generated/bluetooth-print-requirements-reference.dim_1200x800.png"
                alt="Bluetooth Printer Reference"
                className="w-full h-auto rounded border"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center italic">
                Reference image for Bluetooth thermal printer setup
              </p>
            </div>
          </div>

          {/* Print Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handlePrint} disabled={isPrinting}>
              <Printer className="w-4 h-4 mr-2" />
              {isPrinting ? 'Printing...' : 'Print Requirements'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
