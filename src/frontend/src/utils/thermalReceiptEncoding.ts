// ESC/POS command constants
const ESC = 0x1b;
const GS = 0x1d;

// Initialize printer - comprehensive reset
const INIT = [ESC, 0x40]; // Initialize printer
const RESET_PRINT_MODE = [ESC, 0x21, 0x00]; // Reset print mode
const PRINT_DIRECTION_LEFT_TO_RIGHT = [ESC, 0x54, 0x00]; // Print direction: left to right, top to bottom

// Text formatting
const BOLD_ON = [ESC, 0x45, 0x01];
const BOLD_OFF = [ESC, 0x45, 0x00];
const ALIGN_LEFT = [ESC, 0x61, 0x00];
const ALIGN_CENTER = [ESC, 0x61, 0x01];
const ALIGN_RIGHT = [ESC, 0x61, 0x02];

// Size
const SIZE_NORMAL = [GS, 0x21, 0x00];
const SIZE_DOUBLE = [GS, 0x21, 0x11]; // Double height and width
const SIZE_DOUBLE_HEIGHT = [GS, 0x21, 0x01]; // Double height only

// Line feed and spacing
const LINE_FEED = [0x0a];
const SET_LINE_SPACING_DEFAULT = [ESC, 0x32]; // Default line spacing
const CUT_PAPER = [GS, 0x56, 0x00]; // Full cut

export interface ThermalEncoderSettings {
  paperWidth: '58mm' | '80mm';
  lineSpacing: number;
  itemSpacing: number;
  // Computed values
  lineWidth?: number;
}

/**
 * Encodes thermal receipt content into ESC/POS commands
 * This is a best-effort implementation for common thermal printers
 */
export function encodeThermalReceipt(
  content: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    estimateDate: string;
    customerName: string;
    customerAddress: string;
    previousPending?: number;
    lineItems: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  },
  encoderSettings?: ThermalEncoderSettings
): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];

  // Use default settings if not provided
  const settings: ThermalEncoderSettings = encoderSettings || {
    paperWidth: '80mm',
    lineSpacing: 1.3,
    itemSpacing: 6,
  };

  // Calculate line width based on paper width (approximate characters per line)
  // 58mm ≈ 32 chars at 12cpi, 80mm ≈ 42 chars at 12cpi
  const lineWidth = settings.lineWidth || (settings.paperWidth === '58mm' ? 32 : 42);
  settings.lineWidth = lineWidth;

  // Helper to add text
  const addText = (text: string) => {
    commands.push(...Array.from(encoder.encode(text)));
  };

  // Helper to add command
  const addCommand = (cmd: number[]) => {
    commands.push(...cmd);
  };

  // Helper to add line
  const addLine = (text: string) => {
    addText(text);
    addCommand(LINE_FEED);
  };

  // Helper to add separator
  const addSeparator = () => {
    addLine('-'.repeat(lineWidth));
  };

  // Helper to truncate text to fit line width
  const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Helper to add extra spacing based on itemSpacing setting
  const addItemSpacing = () => {
    // Map itemSpacing (2-12px) to extra line feeds (0-2)
    const extraLines = Math.floor(settings.itemSpacing / 6);
    for (let i = 0; i < extraLines; i++) {
      addCommand(LINE_FEED);
    }
  };

  // === PRINTER INITIALIZATION ===
  // Critical: Reset printer to known state and set normal print direction
  addCommand(INIT); // Initialize/reset printer
  addCommand(RESET_PRINT_MODE); // Reset all print modes
  addCommand(PRINT_DIRECTION_LEFT_TO_RIGHT); // Ensure left-to-right, top-to-bottom printing
  addCommand(SET_LINE_SPACING_DEFAULT); // Set default line spacing
  addCommand(SIZE_NORMAL); // Ensure normal size
  addCommand(BOLD_OFF); // Ensure bold is off
  addCommand(ALIGN_LEFT); // Start with left alignment

  // === HEADER - COMPANY INFO ===
  addCommand(ALIGN_CENTER);
  addCommand(SIZE_DOUBLE_HEIGHT);
  addCommand(BOLD_ON);
  addLine(truncate(content.companyName, lineWidth));
  addCommand(BOLD_OFF);
  addCommand(SIZE_NORMAL);
  addCommand(LINE_FEED);

  // Company address and phone (centered, normal size)
  addCommand(ALIGN_CENTER);
  // Split address if too long
  const addressLines = splitTextToLines(content.companyAddress, lineWidth);
  addressLines.forEach(line => addLine(line));
  addLine(`Ph: ${content.companyPhone}`);
  addCommand(LINE_FEED);

  // === DATE ===
  addCommand(ALIGN_CENTER);
  addLine(content.estimateDate);
  addCommand(ALIGN_LEFT);
  addSeparator();

  // === CUSTOMER INFO ===
  addCommand(BOLD_ON);
  addLine('Bill To:');
  addCommand(BOLD_OFF);
  addLine(truncate(content.customerName, lineWidth));
  // Split customer address if too long
  const custAddressLines = splitTextToLines(content.customerAddress, lineWidth);
  custAddressLines.forEach(line => addLine(line));
  addCommand(LINE_FEED);

  // === PREVIOUS PENDING (if any) ===
  if (content.previousPending && content.previousPending > 0) {
    addCommand(ALIGN_CENTER);
    addCommand(BOLD_ON);
    addLine('Previous Pending:');
    addLine(`Rs ${content.previousPending.toFixed(2)}`);
    addCommand(BOLD_OFF);
    addCommand(ALIGN_LEFT);
    addCommand(LINE_FEED);
  }

  addSeparator();

  // === ITEMS HEADER ===
  addCommand(BOLD_ON);
  const itemColWidth = lineWidth - 12; // Reserve 12 chars for amount
  const headerItem = 'Item'.padEnd(itemColWidth, ' ');
  const headerAmount = 'Amount'.padStart(12, ' ');
  addLine(headerItem + headerAmount);
  addCommand(BOLD_OFF);
  addSeparator();

  // === LINE ITEMS ===
  content.lineItems.forEach((item) => {
    // Item name (truncate if needed)
    addLine(truncate(item.description, lineWidth));
    
    // Quantity x Rate = Amount (aligned)
    const qtyRate = `${item.quantity} x Rs ${item.rate.toFixed(2)}`;
    const amount = `Rs ${item.amount.toFixed(2)}`;
    const spacing = lineWidth - qtyRate.length - amount.length;
    const spacer = spacing > 0 ? ' '.repeat(spacing) : ' ';
    addLine(qtyRate + spacer + amount);
    
    // Add spacing between items
    addItemSpacing();
  });

  addSeparator();

  // === TOTALS ===
  addCommand(BOLD_ON);
  addCommand(SIZE_DOUBLE_HEIGHT);
  const totalLabel = 'TOTAL:';
  const totalAmount = `Rs ${content.totalAmount.toFixed(2)}`;
  const totalSpacing = lineWidth - totalLabel.length - totalAmount.length;
  const totalSpacer = totalSpacing > 0 ? ' '.repeat(totalSpacing) : ' ';
  addLine(totalLabel + totalSpacer + totalAmount);
  addCommand(SIZE_NORMAL);
  addCommand(BOLD_OFF);

  // Paid amount
  const paidLabel = 'Paid:';
  const paidAmount = `Rs ${content.paidAmount.toFixed(2)}`;
  const paidSpacing = lineWidth - paidLabel.length - paidAmount.length;
  const paidSpacer = paidSpacing > 0 ? ' '.repeat(paidSpacing) : ' ';
  addLine(paidLabel + paidSpacer + paidAmount);

  // Pending amount
  if (content.pendingAmount > 0) {
    addCommand(BOLD_ON);
    const pendingLabel = 'Pending:';
    const pendingAmount = `Rs ${content.pendingAmount.toFixed(2)}`;
    const pendingSpacing = lineWidth - pendingLabel.length - pendingAmount.length;
    const pendingSpacer = pendingSpacing > 0 ? ' '.repeat(pendingSpacing) : ' ';
    addLine(pendingLabel + pendingSpacer + pendingAmount);
    addCommand(BOLD_OFF);
  }

  // Total pending (if previous pending exists)
  if (content.previousPending && content.previousPending > 0) {
    addCommand(LINE_FEED);
    const prevLabel = 'Prev. Pending:';
    const prevAmount = `Rs ${content.previousPending.toFixed(2)}`;
    const prevSpacing = lineWidth - prevLabel.length - prevAmount.length;
    const prevSpacer = prevSpacing > 0 ? ' '.repeat(prevSpacing) : ' ';
    addLine(prevLabel + prevSpacer + prevAmount);
    
    addCommand(BOLD_ON);
    const totalPendingLabel = 'Total Pending:';
    const totalPendingAmount = `Rs ${(content.pendingAmount + content.previousPending).toFixed(2)}`;
    const totalPendingSpacing = lineWidth - totalPendingLabel.length - totalPendingAmount.length;
    const totalPendingSpacer = totalPendingSpacing > 0 ? ' '.repeat(totalPendingSpacing) : ' ';
    addLine(totalPendingLabel + totalPendingSpacer + totalPendingAmount);
    addCommand(BOLD_OFF);
  }

  addCommand(LINE_FEED);
  addSeparator();

  // === FOOTER ===
  addCommand(ALIGN_CENTER);
  addCommand(BOLD_ON);
  addLine('Thank You!');
  addCommand(BOLD_OFF);

  // Feed and cut
  addCommand(LINE_FEED);
  addCommand(LINE_FEED);
  addCommand(LINE_FEED);
  addCommand(CUT_PAPER);

  return new Uint8Array(commands);
}

/**
 * Split text into multiple lines if it exceeds maxLength
 */
function splitTextToLines(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxLength) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word.length <= maxLength ? word : word.substring(0, maxLength);
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Get computed encoding metadata for diagnostics
 */
export function getEncodingMetadata(settings: ThermalEncoderSettings): {
  paperWidth: string;
  lineWidth: number;
  lineSpacing: number;
  itemSpacing: number;
} {
  const lineWidth = settings.lineWidth || (settings.paperWidth === '58mm' ? 32 : 42);
  return {
    paperWidth: settings.paperWidth,
    lineWidth,
    lineSpacing: settings.lineSpacing,
    itemSpacing: settings.itemSpacing,
  };
}
