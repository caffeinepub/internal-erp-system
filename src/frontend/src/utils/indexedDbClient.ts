import type { Estimate, Product, Contact, Purchase, CompanyBranding, UserProfile } from '../backend';

const DB_NAME = 'pn_trading_db';
const DB_VERSION = 1;

interface DBSchema {
  estimates: Estimate;
  products: Product;
  contacts: Contact;
  purchases: Purchase;
  companyBranding: CompanyBranding;
  userProfiles: { principal: string; profile: UserProfile };
}

class IndexedDBClient {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('estimates')) {
          db.createObjectStore('estimates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('contacts')) {
          db.createObjectStore('contacts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('purchases')) {
          db.createObjectStore('purchases', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('companyBranding')) {
          db.createObjectStore('companyBranding');
        }
        if (!db.objectStoreNames.contains('userProfiles')) {
          db.createObjectStore('userProfiles', { keyPath: 'principal' });
        }
      };
    });
  }

  async getAll<K extends keyof DBSchema>(storeName: K): Promise<DBSchema[K][]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get<K extends keyof DBSchema>(storeName: K, key: any): Promise<DBSchema[K] | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<K extends keyof DBSchema>(storeName: K, value: DBSchema[K], key?: any): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = key !== undefined ? store.put(value, key) : store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putMany<K extends keyof DBSchema>(storeName: K, values: DBSchema[K][]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      const total = values.length;

      if (total === 0) {
        resolve();
        return;
      }

      values.forEach((value) => {
        const request = store.put(value);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clear<K extends keyof DBSchema>(storeName: K): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    await this.clear('estimates');
    await this.clear('products');
    await this.clear('contacts');
    await this.clear('purchases');
    await this.clear('companyBranding');
    await this.clear('userProfiles');
  }
}

export const indexedDB = new IndexedDBClient();
