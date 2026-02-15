import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Bluetooth, AlertCircle, Info, RotateCcw, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { Estimate, CompanyBranding } from '../backend';
import { encodeThermalReceipt, getEncodingMetadata } from '../utils/thermalReceiptEncoding';
import { toast } from 'sonner';
import { useThermalQuickPreviewSettings } from '../hooks/useThermalQuickPreviewSettings';
import { getPreviewStyles, getPrintStyles, getEncoderSettings, getBluetoothLimitations } from '../utils/thermalQuickPreview';
import BluetoothPrinterRequirementsDialog from './BluetoothPrinterRequirementsDialog';

interface EstimatePrintViewProps {
  estimate: Estimate;
  companyBranding: CompanyBranding | null | undefined;
  previousPendingAmount: number;
  isOpen: boolean;
  onClose: () => void;
  bluetoothPrinter?: {
    isSupported: boolean;
    isConnected: boolean;
    deviceName: string | null;
    error: string | null;
    isConnecting: boolean;
    isPrinting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    print: (data: Uint8Array) => Promise<void>;
    clearError: () => void;
  };
}

export default function EstimatePrintView({
  estimate,
  companyBranding,
  previousPendingAmount,
  isOpen,
  onClose,
  bluetoothPrinter,
}: EstimatePrintViewProps) {
  const standardPrintRef = useRef<HTMLDivElement>(null);
  const thermalPrintRef = useRef<HTMLDivElement>(null);
  const [printFormat, setPrintFormat] = useState<'standard' | 'thermal'>('thermal');
  const [printMethod, setPrintMethod] = useState<'browser' | 'bluetooth'>('browser');
  const [showRequirements, setShowRequirements] = useState(false);
  const { settings, updateSettings, resetToDefaults } = useThermalQuickPreviewSettings();

  const handleBrowserPrint = (format: 'standard' | 'thermal') => {
    const printContent = format === 'standard' ? standardPrintRef.current : thermalPrintRef.current;
    if (!printContent) return;

    const styles = format === 'thermal' ? getPrintStyles(settings) : getStandardStyles();

    // Open full-screen window
    const printWindow = window.open('', '', 'width=' + screen.availWidth + ',height=' + screen.availHeight);
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estimate ${estimate.id}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print and close
    setTimeout(() => {
      printWindow.print();
      
      // Close window after print dialog is handled
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  };

  const handleBluetoothPrint = async () => {
    if (!bluetoothPrinter) return;

    if (!bluetoothPrinter.isConnected) {
      toast.error('No printer connected. Please connect to a printer first.');
      return;
    }

    try {
      const companyName = companyBranding?.name || 'PN TRADING';
      const companyAddress = companyBranding?.address || '121 Gopi Krishna Vihar Colony Ahmedabad';
      const companyPhone = '9033793722';

      const estimateDate = new Date(Number(estimate.createdAt) / 1000000).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Generate correct estimate number from estimate.id
      const estimateNumber = `EST-${estimate.id.toString().padStart(4, '0')}`;

      // Use ALL line items without deduplication
      const allLineItems = estimate.lineItems;

      const encoderSettings = getEncoderSettings(settings);
      const encodingMetadata = getEncodingMetadata(encoderSettings);

      // === PRODUCTION DIAGNOSIS LOG ===
      console.log('🖨️ Bluetooth Thermal Print Diagnostics', {
        timestamp: new Date().toISOString(),
        encoderSettings: {
          paperWidth: encodingMetadata.paperWidth,
          lineWidth: encodingMetadata.lineWidth,
          lineSpacing: encodingMetadata.lineSpacing,
          itemSpacing: encodingMetadata.itemSpacing,
        },
        receiptSummary: {
          companyName,
          estimateNumber,
          estimateDate,
          customerName: estimate.customerName,
          lineItemCount: allLineItems.length,
          totalAmount: estimate.netAmount,
          paidAmount: estimate.paidAmount,
          pendingAmount: estimate.pendingAmount,
          previousPending: previousPendingAmount > 0 ? previousPendingAmount : 0,
        },
      });

      const data = encodeThermalReceipt({
        companyName,
        companyAddress,
        companyPhone,
        estimateDate,
        estimateNumber,
        customerName: estimate.customerName,
        customerAddress: estimate.customerAddress,
        previousPending: previousPendingAmount > 0 ? previousPendingAmount : undefined,
        lineItems: allLineItems,
        totalAmount: estimate.netAmount,
        paidAmount: estimate.paidAmount,
        pendingAmount: estimate.pendingAmount,
      }, encoderSettings);

      await bluetoothPrinter.print(data);
      toast.success('Print sent to Bluetooth printer');
    } catch (err) {
      console.error('Bluetooth print error:', err);
      toast.error('Failed to print via Bluetooth');
    }
  };

  const getStandardStyles = () => `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    .estimate-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
    }
    .company-name {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #1a1a1a;
    }
    .company-address {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 4px;
    }
    .company-phone {
      font-size: 14px;
      color: #666;
      font-weight: 600;
    }
    .customer-info {
      margin-bottom: 30px;
      text-align: left;
    }
    .customer-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .customer-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .customer-address {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }
    .estimate-date {
      text-align: right;
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    .pending-info {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 12px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .pending-label {
      font-size: 12px;
      color: #856404;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .pending-amount {
      font-size: 16px;
      color: #856404;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      table-layout: fixed;
    }
    th {
      padding: 14px 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #333;
    }
    th:nth-child(1) {
      width: 40%;
      text-align: left;
    }
    th:nth-child(2) {
      width: 20%;
      text-align: right;
    }
    th:nth-child(3) {
      width: 20%;
      text-align: right;
    }
    th:nth-child(4) {
      width: 20%;
      text-align: right;
    }
    td {
      padding: 14px 12px;
      font-size: 14px;
    }
    td:nth-child(1) {
      width: 40%;
      text-align: left;
    }
    td:nth-child(2) {
      width: 20%;
      text-align: right;
    }
    td:nth-child(3) {
      width: 20%;
      text-align: right;
    }
    td:nth-child(4) {
      width: 20%;
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 350px;
      padding: 20px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 15px;
    }
    .total-row.grand-total {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #333;
      padding-top: 14px;
      margin-top: 10px;
      color: #1a1a1a;
    }
    .total-row.paid-amount {
      font-weight: 600;
      color: #059669;
    }
    .total-row.pending-amount {
      font-weight: bold;
      color: #dc2626;
    }
    .total-row.total-pending {
      font-weight: bold;
      border-top: 1px solid #333;
      padding-top: 8px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 13px;
      color: #666;
    }
    .footer-thank-you {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
    }
    @media print {
      body {
        padding: 20px;
      }
      .estimate-container {
        max-width: 100%;
      }
      @page {
        margin: 1cm;
      }
    }
  `;

  const companyName = companyBranding?.name || 'PN TRADING';
  const companyAddress = companyBranding?.address || '121 Gopi Krishna Vihar Colony Ahmedabad';
  const companyPhone = '9033793722';

  // Use ALL line items without deduplication for preview
  const allLineItems = estimate.lineItems;

  const previewStyles = getPreviewStyles(settings);
  const bluetoothLimitations = getBluetoothLimitations();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Estimate Preview - EST-{estimate.id.toString().padStart(4, '0')}</span>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={printFormat} onValueChange={(v) => setPrintFormat(v as 'standard' | 'thermal')}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="thermal">Thermal Receipt</TabsTrigger>
                  <TabsTrigger value="standard">Standard Format</TabsTrigger>
                </TabsList>
              </div>

              {/* Quick Preview Controls - Only for Thermal */}
              {printFormat === 'thermal' && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Quick Preview Controls</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetToDefaults}
                      className="h-8"
                    >
                      <RotateCcw className="w-3 h-3 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Paper Width */}
                    <div className="space-y-2">
                      <Label htmlFor="paper-width" className="text-xs font-medium">
                        Paper Width
                      </Label>
                      <Select
                        value={settings.paperWidth}
                        onValueChange={(value: '58mm' | '80mm') => updateSettings({ paperWidth: value })}
                      >
                        <SelectTrigger id="paper-width" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="58mm">58mm</SelectItem>
                          <SelectItem value="80mm">80mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                      <Label htmlFor="font-size" className="text-xs font-medium">
                        Font Size: {settings.fontSize}px
                      </Label>
                      <Slider
                        id="font-size"
                        min={8}
                        max={16}
                        step={1}
                        value={[settings.fontSize]}
                        onValueChange={([value]) => updateSettings({ fontSize: value })}
                        className="py-2"
                      />
                    </div>

                    {/* Container Padding */}
                    <div className="space-y-2">
                      <Label htmlFor="padding" className="text-xs font-medium">
                        Padding: {settings.containerPadding}mm
                      </Label>
                      <Slider
                        id="padding"
                        min={0}
                        max={8}
                        step={1}
                        value={[settings.containerPadding]}
                        onValueChange={([value]) => updateSettings({ containerPadding: value })}
                        className="py-2"
                      />
                    </div>

                    {/* Line Spacing */}
                    <div className="space-y-2">
                      <Label htmlFor="line-spacing" className="text-xs font-medium">
                        Line Spacing: {settings.lineSpacing.toFixed(1)}
                      </Label>
                      <Slider
                        id="line-spacing"
                        min={1.0}
                        max={2.0}
                        step={0.1}
                        value={[settings.lineSpacing]}
                        onValueChange={([value]) => updateSettings({ lineSpacing: value })}
                        className="py-2"
                      />
                    </div>

                    {/* Item Spacing */}
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="item-spacing" className="text-xs font-medium">
                        Item Spacing: {settings.itemSpacing}px
                      </Label>
                      <Slider
                        id="item-spacing"
                        min={2}
                        max={12}
                        step={1}
                        value={[settings.itemSpacing]}
                        onValueChange={([value]) => updateSettings({ itemSpacing: value })}
                        className="py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Print Method Selection */}
              {printFormat === 'thermal' && bluetoothPrinter && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={printMethod === 'browser' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPrintMethod('browser')}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Browser Print
                    </Button>
                    <Button
                      variant={printMethod === 'bluetooth' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPrintMethod('bluetooth')}
                      disabled={!bluetoothPrinter.isSupported}
                    >
                      <Bluetooth className="w-4 h-4 mr-2" />
                      Bluetooth Printer
                    </Button>
                  </div>

                  {/* Bluetooth Section */}
                  {printMethod === 'bluetooth' && (
                    <div className="border rounded-lg p-4 space-y-3">
                      {!bluetoothPrinter.isSupported ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Bluetooth printing is not supported in this browser. Please use Chrome, Edge, or Opera on a desktop device.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Status: {bluetoothPrinter.isConnected ? (
                                  <span className="text-green-600">Connected</span>
                                ) : (
                                  <span className="text-muted-foreground">Not Connected</span>
                                )}
                              </p>
                              {bluetoothPrinter.deviceName && (
                                <p className="text-xs text-muted-foreground">
                                  Device: {bluetoothPrinter.deviceName}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {bluetoothPrinter.isConnected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={bluetoothPrinter.disconnect}
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={bluetoothPrinter.connect}
                                  disabled={bluetoothPrinter.isConnecting}
                                >
                                  {bluetoothPrinter.isConnecting ? 'Connecting...' : 'Connect Printer'}
                                </Button>
                              )}
                            </div>
                          </div>

                          {bluetoothPrinter.error && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{bluetoothPrinter.error}</AlertDescription>
                            </Alert>
                          )}

                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-xs space-y-1">
                              <p className="font-semibold">Bluetooth Printing Limitations:</p>
                              <ul className="list-disc list-inside space-y-0.5 ml-2">
                                {bluetoothLimitations.map((limitation, index) => (
                                  <li key={index}>{limitation}</li>
                                ))}
                              </ul>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs mt-2"
                                onClick={() => setShowRequirements(true)}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                View Printer Requirements
                              </Button>
                            </AlertDescription>
                          </Alert>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Preview Content */}
              <TabsContent value="thermal" className="mt-0">
                <div className="flex justify-center py-4">
                  <div
                    ref={thermalPrintRef}
                    className="thermal-receipt-preview border-2 border-dashed border-muted-foreground/30 bg-white text-black"
                    style={previewStyles}
                  >
                    {/* Company Header */}
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '1.4em', fontWeight: 'bold', marginBottom: '4px' }}>
                        {companyName}
                      </div>
                      <div style={{ fontSize: '0.85em', lineHeight: '1.3' }}>
                        {companyAddress}
                      </div>
                      <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginTop: '4px' }}>
                        Ph.No.: {companyPhone}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                    {/* Customer Info */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Bill To:</div>
                      <div>{estimate.customerName}</div>
                      {estimate.customerAddress && (
                        <div style={{ fontSize: '0.9em' }}>{estimate.customerAddress}</div>
                      )}
                      {previousPendingAmount > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          Previous Pending: Rs{previousPendingAmount.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                    {/* Date & Estimate Number */}
                    <div style={{ textAlign: 'center', fontSize: '0.9em', marginBottom: '8px' }}>
                      <div>
                        Date: {new Date(Number(estimate.createdAt) / 1000000).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div style={{ fontWeight: 'bold', marginTop: '2px' }}>
                        Invoice No: EST-{estimate.id.toString().padStart(4, '0')}
                      </div>
                    </div>

                    <div style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

                    {/* Line Items - Two-line format */}
                    <div style={{ marginBottom: '8px' }}>
                      {allLineItems.map((item, index) => (
                        <div key={index} style={{ marginBottom: `${settings.itemSpacing}px` }}>
                          {/* Line 1: Product Name */}
                          <div style={{ fontWeight: 'bold' }}>
                            {index + 1}. {item.description}
                          </div>
                          {/* Line 2: Qty x Rate = Amount */}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.quantity} x Rs{item.rate.toFixed(2)}</span>
                            <span>Rs{item.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

                    {/* Totals */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sub Total:</span>
                        <span>Rs{estimate.netAmount.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Current Bal.:</span>
                        <span>Rs{estimate.netAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>Total Pending:</span>
                      <span>Rs{(previousPendingAmount + estimate.pendingAmount).toFixed(2)}</span>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Thank You</div>
                      <div style={{ fontSize: '0.9em' }}>Visit Again</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="standard" className="mt-0">
                <div ref={standardPrintRef} className="estimate-container">
                  {/* Standard A4 Format */}
                  <div className="header">
                    <div className="company-name">{companyName}</div>
                    <div className="company-address">{companyAddress}</div>
                    <div className="company-phone">Phone: {companyPhone}</div>
                  </div>

                  <div className="estimate-date">
                    Date: {new Date(Number(estimate.createdAt) / 1000000).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>

                  <div className="customer-info">
                    <div className="customer-label">Bill To:</div>
                    <div className="customer-name">{estimate.customerName}</div>
                    {estimate.customerAddress && (
                      <div className="customer-address">{estimate.customerAddress}</div>
                    )}
                  </div>

                  {previousPendingAmount > 0 && (
                    <div className="pending-info">
                      <div className="pending-label">Previous Pending Amount</div>
                      <div className="pending-amount">₹{previousPendingAmount.toFixed(2)}</div>
                    </div>
                  )}

                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLineItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.rate.toFixed(2)}</td>
                          <td>₹{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="totals">
                    <div className="total-row grand-total">
                      <span>Total Amount:</span>
                      <span>₹{estimate.netAmount.toFixed(2)}</span>
                    </div>
                    <div className="total-row paid-amount">
                      <span>Paid Amount:</span>
                      <span>₹{estimate.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="total-row pending-amount">
                      <span>Pending Amount:</span>
                      <span>₹{estimate.pendingAmount.toFixed(2)}</span>
                    </div>
                    {previousPendingAmount > 0 && (
                      <div className="total-row total-pending">
                        <span>Total Pending (Including Previous):</span>
                        <span>₹{(previousPendingAmount + estimate.pendingAmount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="footer">
                    <div className="footer-thank-you">Thank You for Your Business!</div>
                    <div>For any queries, please contact us at {companyPhone}</div>
                  </div>
                </div>
              </TabsContent>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {printFormat === 'thermal' && printMethod === 'bluetooth' && bluetoothPrinter ? (
                  <Button
                    onClick={handleBluetoothPrint}
                    disabled={!bluetoothPrinter.isConnected || bluetoothPrinter.isPrinting}
                  >
                    <Bluetooth className="w-4 h-4 mr-2" />
                    {bluetoothPrinter.isPrinting ? 'Printing...' : 'Print via Bluetooth'}
                  </Button>
                ) : (
                  <Button onClick={() => handleBrowserPrint(printFormat)}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BluetoothPrinterRequirementsDialog
        isOpen={showRequirements}
        onClose={() => setShowRequirements(false)}
      />
    </>
  );
}
