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
    ESC, 0x40, // Initialize printer
  ];
}

function feedLines(lines: number): number[] {
  return [ESC, 0x64, lines];
}

function cutPaper(): number[] {
  return [GS, 0x56, 0x00]; // Full cut
}

/**
 * Render receipt to canvas and convert to raster bitmap for ESC/POS printing
 */
async function renderReceiptToCanvas(
  data: ThermalReceiptData,
  settings: EncoderSettings
): Promise<HTMLCanvasElement> {
  const pixelWidth = settings.paperWidth === '58mm' ? 384 : 576;
  const fontSize = 12;
  const lineHeight = 16;
  const padding = 8;

  // Create temporary canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set canvas width
  canvas.width = pixelWidth;

  // Measure content height
  let y = padding;
  const lines: string[] = [];

  // Helper to add line
  const addLine = (text: string, bold = false, center = false, doubleHeight = false) => {
    lines.push(JSON.stringify({ text, bold, center, doubleHeight }));
    y += doubleHeight ? lineHeight * 2 : lineHeight;
  };

  // Build content
  addLine(data.companyName, true, true, true);
  addLine(data.companyAddress, false, true);
  addLine(`Ph.No.: ${data.companyPhone}`, true, true);
  addLine('-'.repeat(40), false, false);
  addLine('Bill To:', true, false);
  addLine(data.customerName, false, false);
  if (data.customerAddress) {
    addLine(data.customerAddress, false, false);
  }
  if (data.previousPending && data.previousPending > 0) {
    addLine(`Previous Pending: Rs${data.previousPending.toFixed(2)}`, false, false);
  }
  addLine('-'.repeat(40), false, false);
  addLine(`Date: ${data.estimateDate}`, false, true);
  addLine(`Invoice No: ${data.estimateNumber}`, true, true);
  addLine('='.repeat(40), false, false);

  data.lineItems.forEach((item, index) => {
    addLine(`${index + 1}. ${item.description}`, true, false);
    addLine(`${item.quantity} x Rs${item.rate.toFixed(2)} = Rs${item.amount.toFixed(2)}`, false, false);
    y += settings.itemSpacing * lineHeight;
  });

  addLine('='.repeat(40), false, false);
  addLine(`Sub Total: Rs${data.totalAmount.toFixed(2)}`, false, false);
  addLine(`Current Bal.: Rs${data.totalAmount.toFixed(2)}`, true, false);
  addLine('-'.repeat(40), false, false);
  const totalPending = (data.previousPending || 0) + data.pendingAmount;
  addLine(`Total Pending: Rs${totalPending.toFixed(2)}`, true, false);
  addLine('', false, false);
  addLine('Thank You', true, true);
  addLine('Visit Again', false, true);

  y += padding;

  // Set canvas height
  canvas.height = y;

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw content
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  y = padding;
  for (const lineStr of lines) {
    const line = JSON.parse(lineStr);
    const font = `${line.bold ? 'bold' : 'normal'} ${line.doubleHeight ? fontSize * 2 : fontSize}px "Courier New", monospace`;
    ctx.font = font;

    const textWidth = ctx.measureText(line.text).width;
    const x = line.center ? (canvas.width - textWidth) / 2 : padding;

    ctx.fillText(line.text, x, y);
    y += line.doubleHeight ? lineHeight * 2 : lineHeight;
  }

  return canvas;
}

/**
 * Convert canvas to ESC/POS raster bitmap (GS v 0 format)
 */
function canvasToRasterBytes(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const width = canvas.width;
  const height = canvas.height;

  // Convert to 1-bit monochrome
  const bytesPerLine = Math.ceil(width / 8);
  const rasterData: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < bytesPerLine; x++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const pixelX = x * 8 + bit;
        if (pixelX < width) {
          const offset = (y * width + pixelX) * 4;
          const r = pixels[offset];
          const g = pixels[offset + 1];
          const b = pixels[offset + 2];
          const brightness = (r + g + b) / 3;
          if (brightness < 128) {
            byte |= 1 << (7 - bit);
          }
        }
      }
      rasterData.push(byte);
    }
  }

  // Build ESC/POS raster command (GS v 0)
  const xL = bytesPerLine & 0xff;
  const xH = (bytesPerLine >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  const command = [
    GS, 0x76, 0x30, 0x00, // GS v 0 m
    xL, xH, // xL xH
    yL, yH, // yL yH
  ];

  return [...command, ...rasterData];
}

/**
 * Encode thermal receipt as raster image for Gujarati/Unicode support
 */
export async function encodeThermalReceiptRaster(
  data: ThermalReceiptData,
  settings: EncoderSettings
): Promise<Uint8Array> {
  let bytes: number[] = [];

  // Initialize printer
  bytes.push(...initPrinter());

  // Render receipt to canvas
  const canvas = await renderReceiptToCanvas(data, settings);

  // Convert to raster bytes
  const rasterBytes = canvasToRasterBytes(canvas);
  bytes.push(...rasterBytes);

  // Feed and cut
  bytes.push(...feedLines(4));
  bytes.push(...cutPaper());

  return new Uint8Array(bytes);
}
