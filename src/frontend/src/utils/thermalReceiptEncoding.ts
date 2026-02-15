import type { EstimatePrintData } from '../backend';

interface EncoderSettings {
  paperWidth: '58mm' | '80mm';
  lineSpacing: number;
  itemSpacing: number;
  lineWidth: number;
}

interface ThermalReceiptData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  estimateDate: string;
  estimateNumber: string;
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
}

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;

function initPrinter(): number[] {
  return [
    ESC, 0x40, // Initialize printer (reset)
    ESC, 0x54, 0x00, // Set print direction (left to right)
    ESC, 0x21, 0x00, // Reset print mode
  ];
}

function setAlignment(align: 'left' | 'center' | 'right'): number[] {
  const code = align === 'left' ? 0 : align === 'center' ? 1 : 2;
  return [ESC, 0x61, code];
}

function setBold(enabled: boolean): number[] {
  return [ESC, 0x45, enabled ? 1 : 0];
}

function setDoubleWidth(enabled: boolean): number[] {
  return [ESC, 0x21, enabled ? 0x20 : 0x00];
}

function feedLines(lines: number): number[] {
  return [ESC, 0x64, lines];
}

function cutPaper(): number[] {
  return [GS, 0x56, 0x00]; // Full cut
}

function printLine(text: string, maxWidth: number): number[] {
  const truncated = text.length > maxWidth ? text.substring(0, maxWidth) : text;
  const bytes = new TextEncoder().encode(truncated + '\n');
  return Array.from(bytes);
}

function printSeparator(char: string, width: number): number[] {
  return printLine(char.repeat(width), width);
}

function printTwoColumn(left: string, right: string, width: number): number[] {
  const rightLen = right.length;
  const leftLen = Math.max(0, width - rightLen - 1);
  const leftTrunc = left.length > leftLen ? left.substring(0, leftLen) : left.padEnd(leftLen);
  return printLine(leftTrunc + ' ' + right, width);
}

export function encodeThermalReceipt(
  data: ThermalReceiptData,
  settings: EncoderSettings
): Uint8Array {
  const lineWidth = settings.lineWidth;

  let bytes: number[] = [];

  // Initialize printer
  bytes.push(...initPrinter());

  // Header: Shop Name (centered, bold, double-width)
  bytes.push(...setAlignment('center'));
  bytes.push(...setBold(true));
  bytes.push(...setDoubleWidth(true));
  bytes.push(...printLine(data.companyName, Math.floor(lineWidth / 2)));
  bytes.push(...setDoubleWidth(false));
  bytes.push(...setBold(false));

  // Address (centered)
  bytes.push(...setAlignment('center'));
  bytes.push(...printLine(data.companyAddress, lineWidth));

  // Phone (centered, bold)
  bytes.push(...setBold(true));
  bytes.push(...printLine(`Ph.No.: ${data.companyPhone}`, lineWidth));
  bytes.push(...setBold(false));

  // Separator
  bytes.push(...printSeparator('-', lineWidth));

  // Customer Info (left-aligned)
  bytes.push(...setAlignment('left'));
  bytes.push(...setBold(true));
  bytes.push(...printLine('Bill To:', lineWidth));
  bytes.push(...setBold(false));
  bytes.push(...printLine(data.customerName, lineWidth));
  if (data.customerAddress) {
    bytes.push(...printLine(data.customerAddress, lineWidth));
  }

  // Previous pending if exists
  if (data.previousPending && data.previousPending > 0) {
    bytes.push(...printTwoColumn('Previous Pending:', `Rs${data.previousPending.toFixed(2)}`, lineWidth));
  }

  // Separator
  bytes.push(...printSeparator('-', lineWidth));

  // Date & Time (centered)
  bytes.push(...setAlignment('center'));
  bytes.push(...printLine(`Date: ${data.estimateDate}`, lineWidth));

  // Estimate Number (centered, bold)
  bytes.push(...setBold(true));
  bytes.push(...printLine(`Invoice No: ${data.estimateNumber}`, lineWidth));
  bytes.push(...setBold(false));

  // Separator
  bytes.push(...setAlignment('left'));
  bytes.push(...printSeparator('=', lineWidth));

  // Product Lines - Two-line format (ALL items, no deduplication)
  data.lineItems.forEach((item, index) => {
    // Line 1: Product Name (bold)
    bytes.push(...setBold(true));
    const itemName = `${index + 1}. ${item.description}`;
    bytes.push(...printLine(itemName, lineWidth));
    bytes.push(...setBold(false));

    // Line 2: Qty x Rate = Amount
    const qtyRate = `${item.quantity} x Rs${item.rate.toFixed(2)}`;
    const amount = `Rs${item.amount.toFixed(2)}`;
    bytes.push(...printTwoColumn(qtyRate, amount, lineWidth));

    // Item spacing
    if (index < data.lineItems.length - 1) {
      bytes.push(...feedLines(settings.itemSpacing));
    }
  });

  // Separator
  bytes.push(...printSeparator('=', lineWidth));

  // Totals
  bytes.push(...printTwoColumn('Sub Total:', `Rs${data.totalAmount.toFixed(2)}`, lineWidth));

  bytes.push(...setBold(true));
  bytes.push(...printTwoColumn('Current Bal.:', `Rs${data.totalAmount.toFixed(2)}`, lineWidth));
  bytes.push(...setBold(false));

  bytes.push(...printSeparator('-', lineWidth));

  const totalPending = (data.previousPending || 0) + data.pendingAmount;
  bytes.push(...setBold(true));
  bytes.push(...printTwoColumn('Total Pending:', `Rs${totalPending.toFixed(2)}`, lineWidth));
  bytes.push(...setBold(false));

  // Footer: Thank You (centered)
  bytes.push(...setAlignment('center'));
  bytes.push(...feedLines(1));
  bytes.push(...setBold(true));
  bytes.push(...printLine('Thank You', lineWidth));
  bytes.push(...setBold(false));
  bytes.push(...printLine('Visit Again', lineWidth));

  // Feed sufficient lines before cut
  bytes.push(...feedLines(4));
  
  // Cut paper
  bytes.push(...cutPaper());

  return new Uint8Array(bytes);
}

export function getEncodingMetadata(settings: EncoderSettings) {
  return {
    paperWidth: settings.paperWidth,
    lineWidth: settings.lineWidth,
    lineSpacing: settings.lineSpacing,
    itemSpacing: settings.itemSpacing,
  };
}
