// Quick Preview settings for thermal receipt layout
export interface ThermalQuickPreviewSettings {
  paperWidth: '58mm' | '80mm';
  fontSize: number; // Base font size in pixels
  containerPadding: number; // Padding in mm
  lineSpacing: number; // Line spacing multiplier
  itemSpacing: number; // Space between items in pixels
}

export const DEFAULT_THERMAL_SETTINGS: ThermalQuickPreviewSettings = {
  paperWidth: '80mm',
  fontSize: 11,
  containerPadding: 4,
  lineSpacing: 1.3,
  itemSpacing: 6,
};

// Convert settings to CSS styles for preview
export function getPreviewStyles(settings: ThermalQuickPreviewSettings): React.CSSProperties {
  return {
    width: settings.paperWidth,
    maxWidth: settings.paperWidth,
    padding: `${settings.containerPadding}mm`,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineSpacing,
  };
}

// Convert settings to print window CSS
export function getPrintStyles(settings: ThermalQuickPreviewSettings): string {
  const widthValue = settings.paperWidth === '58mm' ? '58mm' : '80mm';
  
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: ${widthValue};
      max-width: ${widthValue};
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      padding: ${settings.containerPadding}mm;
      color: #000;
      font-size: ${settings.fontSize}px;
      line-height: ${settings.lineSpacing};
    }
    .thermal-container {
      width: 100%;
      max-width: ${widthValue};
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #000;
    }
    .company-name {
      font-size: ${Math.round(settings.fontSize * 1.45)}px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .company-address {
      font-size: ${Math.round(settings.fontSize * 0.91)}px;
      line-height: ${settings.lineSpacing};
      margin-bottom: 2px;
    }
    .company-phone {
      font-size: ${Math.round(settings.fontSize * 0.91)}px;
      font-weight: bold;
    }
    .customer-info {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #000;
    }
    .customer-label {
      font-size: ${Math.round(settings.fontSize * 0.82)}px;
      text-transform: uppercase;
      margin-bottom: 3px;
      font-weight: bold;
    }
    .customer-name {
      font-size: ${settings.fontSize}px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .customer-address {
      font-size: ${Math.round(settings.fontSize * 0.91)}px;
      line-height: ${settings.lineSpacing};
    }
    .estimate-date {
      text-align: center;
      font-size: ${Math.round(settings.fontSize * 0.91)}px;
      margin-bottom: 8px;
    }
    .pending-info {
      background: #f9f9f9;
      border: 1px dashed #000;
      padding: 6px;
      margin-bottom: 8px;
      text-align: center;
    }
    .pending-label {
      font-size: ${Math.round(settings.fontSize * 0.82)}px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .pending-amount {
      font-size: ${settings.fontSize}px;
      font-weight: bold;
    }
    .items-header {
      font-size: ${Math.round(settings.fontSize * 0.82)}px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 4px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      display: flex;
      justify-content: space-between;
    }
    .item-row {
      padding: ${settings.itemSpacing}px 0;
      border-bottom: 1px dashed #ccc;
      font-size: ${Math.round(settings.fontSize * 0.91)}px;
    }
    .item-name {
      font-weight: bold;
      margin-bottom: 2px;
    }
    .item-details {
      display: flex;
      justify-content: space-between;
      font-size: ${Math.round(settings.fontSize * 0.82)}px;
    }
    .totals {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #000;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: ${Math.round(settings.fontSize * 0.91)}px;
    }
    .total-row.grand-total {
      font-size: ${Math.round(settings.fontSize * 1.09)}px;
      font-weight: bold;
      border-top: 1px solid #000;
      padding-top: 6px;
      margin-top: 4px;
    }
    .total-row.paid-amount {
      font-weight: 600;
    }
    .total-row.pending-amount {
      font-weight: bold;
    }
    .total-row.total-pending {
      font-weight: bold;
      border-top: 1px solid #000;
      padding-top: 4px;
      margin-top: 4px;
    }
    .footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #000;
      text-align: center;
      font-size: ${Math.round(settings.fontSize * 0.82)}px;
    }
    .footer-thank-you {
      font-size: ${Math.round(settings.fontSize * 0.91)}px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    @media print {
      html, body {
        width: ${widthValue};
        max-width: ${widthValue};
      }
      body {
        padding: 0;
        margin: 0;
      }
      @page {
        size: ${widthValue} auto;
        margin: 0;
        padding: 0;
      }
    }
  `;
}

// Map settings to ESC/POS encoder parameters with computed line width
export function getEncoderSettings(settings: ThermalQuickPreviewSettings) {
  // Calculate characters per line based on paper width
  // 58mm ≈ 32 chars at 12cpi, 80mm ≈ 42 chars at 12cpi
  const lineWidth = settings.paperWidth === '58mm' ? 32 : 42;
  
  return {
    paperWidth: settings.paperWidth,
    lineSpacing: settings.lineSpacing,
    itemSpacing: settings.itemSpacing,
    lineWidth, // Computed line width for encoder
  };
}

// Identify which settings are not fully supported in ESC/POS
export function getBluetoothLimitations(): string[] {
  return [
    'Font size adjustments may be limited by printer capabilities',
    'Exact padding and spacing may vary between printer models',
    'Paper width preset affects layout calculations but not physical paper size',
  ];
}
