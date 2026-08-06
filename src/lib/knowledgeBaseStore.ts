import type { SavedKnowledgeBaseDoc } from "@/lib/workspaceTypes";

/**
 * Knowledge-base storage for v1: IndexedDB, in the browser, keyed per Google account.
 *
 * IndexedDB rather than localStorage because extracted text is large — at 200,000
 * characters per document stored as UTF-16, ten documents is roughly 4 MB against a
 * typical 5 MB localStorage quota, before run history.
 *
 * Every record carries `userSub` and every read filters on it. Two people signing in
 * on one machine must never see each other's documents.
 * See docs/decisions/0001-browser-scoped-persistence.md.
 */

const DB_NAME = "tcg";
const DB_VERSION = 1;
const STORE = "knowledgeBase";
const USER_INDEX = "userSub";

interface StoredKnowledgeBaseDoc extends SavedKnowledgeBaseDoc {
  userSub: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not support local storage of documents."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex(USER_INDEX, "userSub", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = work(transaction.objectStore(STORE));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Local storage request failed."));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error("Local storage transaction aborted."));
      }),
  );
}

function stripUser(record: StoredKnowledgeBaseDoc): SavedKnowledgeBaseDoc {
  const { userSub: _userSub, ...doc } = record;
  return doc;
}

export async function listKnowledgeBaseDocs(userSub: string): Promise<SavedKnowledgeBaseDoc[]> {
  const records = await runTransaction<StoredKnowledgeBaseDoc[]>("readonly", (store) =>
    store.index(USER_INDEX).getAll(IDBKeyRange.only(userSub)),
  );

  return records
    .map(stripUser)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export async function addKnowledgeBaseDocs(
  userSub: string,
  documents: SavedKnowledgeBaseDoc[],
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);

    for (const document of documents) {
      store.put({ ...document, userSub } satisfies StoredKnowledgeBaseDoc);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not save documents locally."));
    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error("Could not save documents locally — your browser storage may be full."),
      );
  });
}

export async function deleteKnowledgeBaseDoc(userSub: string, id: string): Promise<void> {
  const existing = await runTransaction<StoredKnowledgeBaseDoc | undefined>("readonly", (store) =>
    store.get(id),
  );

  // Never delete across accounts, even with a guessed id.
  if (!existing || existing.userSub !== userSub) {
    return;
  }

  await runTransaction("readwrite", (store) => store.delete(id));
}

export async function clearKnowledgeBase(userSub: string): Promise<void> {
  const records = await runTransaction<StoredKnowledgeBaseDoc[]>("readonly", (store) =>
    store.index(USER_INDEX).getAll(IDBKeyRange.only(userSub)),
  );

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    for (const record of records) {
      store.delete(record.id);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear documents."));
  });
}
