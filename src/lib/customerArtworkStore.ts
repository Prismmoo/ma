import type { CustomerArtworkUpload } from '../types';

const DB_NAME = 'prism-customer-artwork';
const DB_VERSION = 1;
const STORE = 'drafts';

export type CustomerArtworkContext = 'painting' | 'sticker';

interface StoredDraft {
  id: string;
  context: CustomerArtworkContext;
  asset: CustomerArtworkUpload;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open image drafts.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('context', 'context', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('Image draft operation failed.'));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveCustomerArtworkDraft(
  context: CustomerArtworkContext,
  asset: CustomerArtworkUpload,
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id: asset.id, context, asset, savedAt: Date.now() } satisfies StoredDraft);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not save image draft.'));
      tx.onabort = () => reject(tx.error ?? new Error('Image draft save was aborted.'));
    });
  } finally {
    db.close();
  }
}

export async function loadLatestCustomerArtworkDraft(
  context: CustomerArtworkContext,
): Promise<CustomerArtworkUpload | null> {
  const db = await openDb();
  try {
    const all = await requestResult(
      db.transaction(STORE, 'readonly').objectStore(STORE).index('context').getAll(context),
    ) as StoredDraft[];
    all.sort((a, b) => b.savedAt - a.savedAt);
    return all[0]?.asset ?? null;
  } finally {
    db.close();
  }
}

export async function deleteCustomerArtworkDraft(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not remove image draft.'));
    });
  } finally {
    db.close();
  }
}

export async function clearCustomerArtworkDrafts(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not clear image drafts.'));
    });
  } finally {
    db.close();
  }
}
