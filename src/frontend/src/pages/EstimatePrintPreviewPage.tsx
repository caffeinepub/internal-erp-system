import { useState, useEffect } from 'react';
import { useHashRoute } from '../hooks/useHashRoute';
import { useFocusedOverlay } from '../context/FocusedOverlayContext';
import { usePrintEstimate } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Printer, Bluetooth } from 'lucide-react';
import type { EstimatePrintData } from '../backend';
import ThermalReceiptPreview from '../components/ThermalReceiptPreview';
import { DEFAULT_THERMAL_SETTINGS, type ThermalQuickPreviewSettings, getPrintStyles, getEncoderSettings } from '../utils/thermalQuickPreview';
import { useBluetoothThermalPrinter } from '../hooks/useBluetoothThermalPrinter';
import { encodeThermalReceipt } from '../utils/thermalReceiptEncoding';
import { encodeThermalReceiptRaster } from '../utils/thermalReceiptRaster';
import { toast } from 'sonner';

interface EstimatePrintPreviewPageProps {
  estimateId: string;
}

// Helper to detect if text contains non-ASCII characters (Gujarati, etc.)
function containsNonASCII(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}

// Helper to check if receipt data contains Gujarati or other Unicode
function requiresRasterPrinting(data: EstimatePrintData): boolean {
  const companyName = data.companyBranding?.name || '';
  const companyAddress = data.companyBranding?.address || '';
  const customerName = data.estimate.customerName;
  const customerAddress = data.estimate.customerAddress;
  
  if (containsNonASCII(companyName) || containsNonASCII(companyAddress)) return true;
  if (containsNonASCII(customerName) || containsNonASCII(customerAddress)) return true;
  
  for (const item of data.estimate.lineItems) {
    if (containsNonASCII(item.description)) return true;
  }
  
  return false;
}

export default function EstimatePrintPreviewPage({ estimateId }: EstimatePrintPreviewPageProps) {
  const { navigate } = useHashRoute();
  const { register, unregister } = useFocusedOverlay();
  const printEstimate = usePrintEstimate();
  const bluetoothPrinter = useBluetoothThermalPrinter();

  const [printData, setPrintData] = useState<EstimatePrintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ThermalQuickPreviewSettings>(DEFAULT_THERMAL_SETTINGS);
  const [isPrinting, setIsPrinting] = useState(false);

  // Register focused overlay on mount
  useEffect(() => {
    register();
    return () => unregister();
  }, [register, unregister]);

  // Load print data
  useEffect(() => {
    const loadPrintData = async () => {
      try {
        const data = await printEstimate.mutateAsync(BigInt(estimateId));
        setPrintData(data);
      } catch (error: any) {
        toast.error(`Failed to load print data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrintData();
  }, [estimateId]);

  const handleBrowserPrint = () => {
    if (!printData) return;

    setIsPrinting(true);

    // Inject print styles
    const styleId = 'thermal-print-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = getPrintStyles(settings);

    // Trigger print
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleBluetoothPrint = async () => {
    if (!printData) return;

    setIsPrinting(true);

    try {
      // Connect if not connected
      if (!bluetoothPrinter.isConnected) {
        await bluetoothPrinter.connect();
      }

      // Transform EstimatePrintData to ThermalReceiptData format
      const companyName = printData.companyBranding?.name || 'PN TRADING';
      const companyAddress = printData.companyBranding?.address || '121 Gopi Krishna Vihar Colony Ahmedabad';
      const companyPhone = '7202061295';

      const estimateDate = new Date(Number(printData.estimate.createdAt) / 1000000).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Generate correct estimate number from estimateId
      const estimateNumber = `EST-${estimateId.toString().padStart(4, '0')}`;

      const thermalReceiptData = {
        companyName,
        companyAddress,
        companyPhone,
        estimateDate,
        estimateNumber,
        customerName: printData.estimate.customerName,
        customerAddress: printData.estimate.customerAddress,
        previousPending: printData.previousPendingAmount > 0 ? printData.previousPendingAmount : undefined,
        lineItems: printData.estimate.lineItems,
        totalAmount: printData.estimate.netAmount,
        paidAmount: printData.estimate.paidAmount,
        pendingAmount: printData.estimate.pendingAmount,
      };

      const encoderSettings = getEncoderSettings(settings);

      // Decide printing strategy: raster for Gujarati/Unicode, text for ASCII-only
      const useRaster = requiresRasterPrinting(printData);

      let bytes: Uint8Array;

      if (useRaster) {
        // Use raster/image printing for Gujarati Unicode support
        bytes = await encodeThermalReceiptRaster(thermalReceiptData, encoderSettings);
        toast.info('Using image-based printing for Gujarati text');
      } else {
        // Use text ESC/POS for ASCII-only receipts
        bytes = encodeThermalReceipt(thermalReceiptData, encoderSettings);
      }

      // Print
      await bluetoothPrinter.print(bytes);
      toast.success('Printed successfully');
    } catch (error: any) {
      toast.error(`Bluetooth print failed: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading print preview...</p>
        </div>
      </div>
    );
  }

  if (!printData) {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load print data</p>
          <Button onClick={() => navigate({ type: 'dashboard' })}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-background overflow-y-auto">
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ type: 'dashboard' })}
              disabled={isPrinting}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Print Preview</h1>
              <p className="text-sm text-muted-foreground">
                Thermal receipt format (WYSIWYG)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBrowserPrint} disabled={isPrinting} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Browser Print
            </Button>
            <Button onClick={handleBluetoothPrint} disabled={isPrinting}>
              <Bluetooth className="w-4 h-4 mr-2" />
              {bluetoothPrinter.isConnected ? 'Print' : 'Connect & Print'}
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Paper Width:</label>
              <Select
                value={settings.paperWidth}
                onValueChange={(value: '58mm' | '80mm') =>
                  setSettings({ ...settings, paperWidth: value })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="80mm">80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div className="border-2 border-dashed border-muted-foreground/30 p-4 rounded-lg">
            <ThermalReceiptPreview printData={printData} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}
