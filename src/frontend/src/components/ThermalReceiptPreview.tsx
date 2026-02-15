import type { EstimatePrintData } from '../backend';
import type { ThermalQuickPreviewSettings } from '../utils/thermalQuickPreview';

interface ThermalReceiptPreviewProps {
  printData: EstimatePrintData;
  settings: ThermalQuickPreviewSettings;
}

export default function ThermalReceiptPreview({ printData, settings }: ThermalReceiptPreviewProps) {
  const { estimate, companyBranding, previousPendingAmount } = printData;

  const companyName = companyBranding?.name || 'PN TRADING';
  const companyAddress = companyBranding?.address || '121 Gopi Krishna Vihar Colony Ahmedabad';
  const companyPhone = '7202061295';

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const estimateNumber = `EST-${estimate.id.toString().padStart(4, '0')}`;
  const currentBillTotal = estimate.netAmount;
  const totalPending = previousPendingAmount + estimate.pendingAmount;

  return (
    <div
      className="thermal-receipt-preview bg-white text-black font-mono"
      style={{
        width: settings.paperWidth,
        maxWidth: settings.paperWidth,
        padding: `${settings.containerPadding}mm`,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineSpacing,
      }}
    >
      {/* Header: Shop Name, Address, Phone */}
      <div className="text-center mb-3 pb-2 border-b border-dashed border-black">
        <div className="font-bold text-lg mb-1" style={{ fontSize: `${Math.round(settings.fontSize * 1.45)}px` }}>
          {companyName}
        </div>
        <div className="text-xs leading-tight mb-1" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
          {companyAddress}
        </div>
        <div className="text-xs font-bold" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
          Ph.No.: {companyPhone}
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-3 pb-2 border-b border-dashed border-black">
        <div className="text-xs font-bold uppercase mb-1" style={{ fontSize: `${Math.round(settings.fontSize * 0.82)}px` }}>
          Bill To:
        </div>
        <div className="font-bold mb-1" style={{ fontSize: `${settings.fontSize}px` }}>
          {estimate.customerName}
        </div>
        {estimate.customerAddress && (
          <div className="text-xs leading-tight" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
            {estimate.customerAddress}
          </div>
        )}
      </div>

      {/* Date & Time, Estimate Number */}
      <div className="text-center text-xs mb-2" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
        <div>Date: {formatDate(estimate.createdAt)}</div>
        <div className="font-bold mt-1">Invoice No: {estimateNumber}</div>
      </div>

      {/* Separator */}
      <div className="border-t border-black my-2" />

      {/* Product Lines - Two-line format */}
      <div className="space-y-2" style={{ gap: `${settings.itemSpacing}px` }}>
        {estimate.lineItems.map((item, index) => (
          <div key={index} className="pb-2 border-b border-dashed border-gray-300">
            {/* Line 1: Product Name */}
            <div className="font-bold break-words" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
              {index + 1}. {item.description}
            </div>
            {/* Line 2: Qty x Rate = Amount */}
            <div className="flex justify-between text-xs" style={{ fontSize: `${Math.round(settings.fontSize * 0.82)}px` }}>
              <span>
                {item.quantity} x ₹{item.rate.toFixed(2)}
              </span>
              <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="border-t border-black my-2" />

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
          <span>Sub Total:</span>
          <span>₹{estimate.netAmount.toFixed(2)}</span>
        </div>
        {previousPendingAmount > 0 && (
          <div className="flex justify-between text-xs" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
            <span>Previous Bal.:</span>
            <span>₹{previousPendingAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold" style={{ fontSize: `${Math.round(settings.fontSize * 1.09)}px` }}>
          <span>Current Bal.:</span>
          <span>₹{currentBillTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-black pt-1 mt-1" style={{ fontSize: `${Math.round(settings.fontSize * 1.09)}px` }}>
          <span>Total Pending:</span>
          <span>₹{totalPending.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer: Thank You */}
      <div className="mt-3 pt-2 border-t border-dashed border-black text-center">
        <div className="text-xs font-bold" style={{ fontSize: `${Math.round(settings.fontSize * 0.91)}px` }}>
          Thank You
        </div>
        <div className="text-xs mt-1" style={{ fontSize: `${Math.round(settings.fontSize * 0.82)}px` }}>
          Visit Again
        </div>
      </div>
    </div>
  );
}
