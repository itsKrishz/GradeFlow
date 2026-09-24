import { Submission } from '../types';

const DB_NAME = 'gradeflow_pdf_db';
const STORE_NAME = 'pdf_files';
const DB_VERSION = 2; // Bump version to ensure clean store

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

// In-memory cache for Object URLs to avoid leaking or re-fetching repeatedly
const memoryUrlCache = new Map<string, string>();

/**
 * Save an uploaded PDF File, Blob, or ArrayBuffer to persistent browser IndexedDB
 * Converts all files to ArrayBuffer so they clone safely without DataCloneError.
 */
export async function savePdfFile(key: string, data: Blob | File | ArrayBuffer | string): Promise<void> {
  try {
    const db = await getDB();
    let buffer: ArrayBuffer;
    let mimeType = 'application/pdf';

    if (data instanceof Blob) {
      mimeType = data.type || 'application/pdf';
      buffer = await data.arrayBuffer();
    } else if (data instanceof ArrayBuffer) {
      buffer = data;
    } else if (typeof data === 'string' && data.startsWith('data:') && data.includes(';base64,')) {
      const parts = data.split(',');
      const meta = parts[0];
      const base64 = parts[1];
      const mimeMatch = meta.match(/data:([^;]+)/);
      if (mimeMatch) mimeType = mimeMatch[1];
      const byteChars = atob(base64);
      const uint8 = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        uint8[i] = byteChars.charCodeAt(i);
      }
      buffer = uint8.buffer;
    } else {
      console.warn('Unknown PDF data format for key:', key);
      return;
    }

    const payload = {
      buffer,
      type: mimeType,
      size: buffer.byteLength,
      timestamp: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Update in-memory URL cache with fresh blob
    if (memoryUrlCache.has(key)) {
      try {
        URL.revokeObjectURL(memoryUrlCache.get(key)!);
      } catch (_) {}
    }
    const blob = new Blob([buffer], { type: mimeType });
    memoryUrlCache.set(key, URL.createObjectURL(blob));
  } catch (err) {
    console.warn('Failed to store PDF in IndexedDB:', err);
  }
}

/**
 * Retrieve a stored PDF Blob from IndexedDB
 */
export async function getPdfBlob(key: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    const data = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (!data) return null;

    // Structured storage with ArrayBuffer
    if (data.buffer && (data.buffer instanceof ArrayBuffer || ArrayBuffer.isView(data.buffer))) {
      return new Blob([data.buffer], { type: data.type || 'application/pdf' });
    }
    if (data instanceof Blob) return data;
    if (data instanceof ArrayBuffer) return new Blob([data], { type: 'application/pdf' });
    if (typeof data === 'string' && data.startsWith('data:') && data.includes(';base64,')) {
      const parts = data.split(',');
      const base64 = parts[1];
      if (base64) {
        const byteChars = atob(base64);
        const uint8 = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          uint8[i] = byteChars.charCodeAt(i);
        }
        return new Blob([uint8], { type: 'application/pdf' });
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get an active Blob URL for the given PDF key (either from memory cache or IndexedDB)
 */
export async function getPdfBlobUrl(key: string): Promise<string | null> {
  if (memoryUrlCache.has(key)) {
    return memoryUrlCache.get(key)!;
  }
  const blob = await getPdfBlob(key);
  if (blob) {
    const url = URL.createObjectURL(blob);
    memoryUrlCache.set(key, url);
    return url;
  }
  return null;
}

/**
 * Resolve the real student-uploaded PDF URL.
 * Only returns genuine student files. Does NOT synthesize fake documents.
 */
export async function getOrGeneratePdfUrl(submission: Submission): Promise<string | null> {
  // 1. Direct fileUrl if available (e.g. Data URL or persistent blob)
  if (submission.fileUrl && (submission.fileUrl.startsWith('data:') || submission.fileUrl.startsWith('blob:') || submission.fileUrl.startsWith('http'))) {
    return submission.fileUrl;
  }

  const subKey = `sub_${submission.id}`;

  // 2. Try by submission key
  let url = await getPdfBlobUrl(subKey);
  if (url) return url;

  // 3. Try by custom storage key if set
  if (submission.pdfStorageKey && submission.pdfStorageKey !== subKey) {
    url = await getPdfBlobUrl(submission.pdfStorageKey);
    if (url) return url;
  }

  // 4. Try by file hash
  if (submission.fileHash) {
    url = await getPdfBlobUrl(`hash_${submission.fileHash}`);
    if (url) return url;
  }

  // 5. Try by fileName
  if (submission.fileName) {
    url = await getPdfBlobUrl(`name_${submission.fileName}`);
    if (url) return url;
  }

  // Return null if no real PDF has been cached yet for this submission
  return null;
}

/**
 * Purge old synthetic dummy PDFs from v1 database if they exist
 */
export async function purgeSyntheticPdfs(): Promise<void> {
  try {
    memoryUrlCache.clear();
    const req = indexedDB.deleteDatabase('gradeflow_pdf_db');
    req.onsuccess = () => console.log('Cleaned old PDF cache');
  } catch (_) {}
}
