import type { BackupData } from '../backend';
import { Principal } from '@dfinity/principal';
import { indexedDB } from './indexedDbClient';

export async function exportBackupToFile(): Promise<void> {
  try {
    // Gather all data from IndexedDB
    const [estimates, products, contacts, purchases, userProfiles] = await Promise.all([
      indexedDB.getAll('estimates'),
      indexedDB.getAll('products'),
      indexedDB.getAll('contacts'),
      indexedDB.getAll('purchases'),
      indexedDB.getAll('userProfiles'),
    ]);

    const companyBranding = await indexedDB.get('companyBranding', 'default');

    // Convert to BackupData format
    const backupData: BackupData = {
      estimates: estimates.map((e) => [e.id, e]),
      products: products.map((p) => [p.id, p]),
      contacts: contacts.map((c) => [c.id, c]),
      purchases: purchases.map((p) => [p.id, p]),
      userProfiles: userProfiles.map((up) => [Principal.fromText(up.principal), up.profile]),
      priceOverrideRequests: [],
      inventory: [], // Empty inventory array as we don't store inventory separately in IndexedDB
      companyBranding: companyBranding || undefined,
    };

    // Serialize with BigInt support
    const jsonString = JSON.stringify(backupData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );

    const blob = new Blob([jsonString], { type: 'application/json' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pn-trading-backup-${timestamp}.json`;

    // Try File System Access API first
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'JSON Backup File',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Backup cancelled');
        }
        // Fall through to download fallback
      }
    }

    // Fallback: standard download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error: any) {
    throw new Error(`Failed to export backup: ${error.message}`);
  }
}

export async function importBackupFromFile(file: File): Promise<void> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text, (key, value) => {
      // Convert string numbers back to BigInt for id fields
      if (
        (key === 'id' ||
          key === 'productId' ||
          key === 'contactId' ||
          key === 'estimateId' ||
          key === 'purchaseId' ||
          key === 'quantity' ||
          key === 'stockQuantity' ||
          key === 'createdAt' ||
          key === 'purchaseDate' ||
          key === 'lastUpdated' ||
          key === 'paymentReceivedTimestamp' ||
          key === 'requestedAt' ||
          key === 'referenceId') &&
        typeof value === 'string' &&
        /^\d+$/.test(value)
      ) {
        return BigInt(value);
      }
      return value;
    });

    const backupData = parsed as BackupData;

    // Clear existing data
    await indexedDB.clearAll();

    // Restore data
    if (backupData.estimates && backupData.estimates.length > 0) {
      await indexedDB.putMany(
        'estimates',
        backupData.estimates.map(([_, e]) => e)
      );
    }

    if (backupData.products && backupData.products.length > 0) {
      await indexedDB.putMany(
        'products',
        backupData.products.map(([_, p]) => p)
      );
    }

    if (backupData.contacts && backupData.contacts.length > 0) {
      await indexedDB.putMany(
        'contacts',
        backupData.contacts.map(([_, c]) => c)
      );
    }

    if (backupData.purchases && backupData.purchases.length > 0) {
      await indexedDB.putMany(
        'purchases',
        backupData.purchases.map(([_, p]) => p)
      );
    }

    if (backupData.userProfiles && backupData.userProfiles.length > 0) {
      await indexedDB.putMany(
        'userProfiles',
        backupData.userProfiles.map(([principal, profile]) => ({
          principal: principal.toString(),
          profile,
        }))
      );
    }

    if (backupData.companyBranding) {
      await indexedDB.put('companyBranding', backupData.companyBranding, 'default');
    }

    // Note: inventory is not restored to IndexedDB as it's managed by the backend
  } catch (error: any) {
    throw new Error(`Failed to import backup: ${error.message}`);
  }
}
