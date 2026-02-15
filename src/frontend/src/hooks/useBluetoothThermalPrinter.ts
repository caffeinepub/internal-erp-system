import { useState, useCallback, useRef, useEffect } from 'react';

interface BluetoothPrinterState {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  error: string | null;
  isConnecting: boolean;
  isPrinting: boolean;
}

interface BluetoothPrinterHook extends BluetoothPrinterState {
  connect: () => Promise<void>;
  disconnect: () => void;
  print: (data: Uint8Array) => Promise<void>;
  clearError: () => void;
}

export function useBluetoothThermalPrinter(): BluetoothPrinterHook {
  const [state, setState] = useState<BluetoothPrinterState>({
    isSupported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    isConnected: false,
    deviceName: null,
    error: null,
    isConnecting: false,
    isPrinting: false,
  });

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // Handle device disconnection
  const handleDisconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      deviceName: null,
    }));
    deviceRef.current = null;
    characteristicRef.current = null;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Bluetooth is not supported in this browser.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request device with common thermal printer services
      const device = await navigator.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Common printer service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Another common service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Xprinter service
        ],
      });

      if (!device.gatt) {
        throw new Error('Device does not support GATT');
      }

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', handleDisconnect);

      // Connect to GATT server
      const server = await device.gatt.connect();

      // Try to find a writable characteristic
      let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
      const services = await server.getPrimaryServices();

      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              characteristic = char;
              break;
            }
          }
          if (characteristic) break;
        } catch (err) {
          // Service might not be accessible, continue
          console.warn('Could not access service:', err);
        }
      }

      if (!characteristic) {
        throw new Error('No writable characteristic found. Make sure the printer is in pairing mode.');
      }

      deviceRef.current = device;
      characteristicRef.current = characteristic;

      setState((prev) => ({
        ...prev,
        isConnected: true,
        deviceName: device.name || 'Unknown Printer',
        isConnecting: false,
        error: null,
      }));
    } catch (err: any) {
      let errorMessage = 'Failed to connect to printer';

      if (err.name === 'NotFoundError') {
        errorMessage = 'No device selected. Please try again.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Bluetooth access denied. Please check browser permissions.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));

      // Clean up on error
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
      deviceRef.current = null;
      characteristicRef.current = null;
    }
  }, [state.isSupported, handleDisconnect]);

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnect);
      deviceRef.current.gatt.disconnect();
    }
    handleDisconnect();
  }, [handleDisconnect]);

  const print = useCallback(async (data: Uint8Array) => {
    if (!state.isConnected || !characteristicRef.current) {
      setState((prev) => ({
        ...prev,
        error: 'No printer connected. Please connect to a printer first.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isPrinting: true, error: null }));

    try {
      // Improved chunking strategy for long receipts
      const chunkSize = 256; // Smaller chunks for better reliability
      const delayBetweenChunks = 80; // Longer delay for full receipt delivery

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
        await characteristicRef.current.writeValue(chunk);
        
        // Delay between chunks to ensure sequential completion
        if (i + chunkSize < data.length) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenChunks));
        }
      }

      // Extra delay before final feed/cut to ensure all content is sent
      await new Promise((resolve) => setTimeout(resolve, 200));

      setState((prev) => ({ ...prev, isPrinting: false }));
    } catch (err: any) {
      let errorMessage = 'Failed to print';

      if (err.name === 'NetworkError') {
        errorMessage = 'Printer disconnected. Please reconnect and try again.';
        handleDisconnect();
      } else if (err.message) {
        errorMessage = err.message;
      }

      setState((prev) => ({
        ...prev,
        isPrinting: false,
        error: errorMessage,
      }));
    }
  }, [state.isConnected, handleDisconnect]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    print,
    clearError,
  };
}
