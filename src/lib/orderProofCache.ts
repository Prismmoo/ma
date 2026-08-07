import type { RenderRecipeV2 } from './renderRecipe';

const DB_NAME = 'prism-order-proofs';
const DB_VERSION = 1;
const STORE = 'proofs';

export interface CachedOrderProof {
  key: string; // clientRequestId:itemId:updatedAt
  clientRequestId: string;
  itemId: string;
  personalizationUpdatedAt: number;
  recipe: RenderRecipeV2;
  proofBlob: Blob;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open proof cache.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('clientRequestId', 'clientRequestId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getCachedProof(key: string): Promise<CachedOrderProof | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    return await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function putCachedProof(value: CachedOrderProof): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function deleteProofsForRequest(clientRequestId: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const index = store.index('clientRequestId');
    const keys = await new Promise<string[]>((resolve, reject) => {
      const request = index.getAllKeys(clientRequestId);
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
    
    for (const key of keys) {
      store.delete(key);
    }
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function pruneProofCache(maxEntries = 50): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const index = store.index('createdAt');
    const count = await new Promise<number>((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (count > maxEntries) {
      const toDelete = count - maxEntries;
      const request = index.openCursor();
      let deleted = 0;
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor && deleted < toDelete) {
          store.delete(cursor.primaryKey);
          deleted++;
          cursor.continue();
        }
      };
    }
  } finally {
    db.close();
  }
}
