import {
  DEFAULT_FAMILY_PROFILE,
  INITIAL_REFERENCE_SOURCES,
} from '../data/constants';
import {
  FamilyArchiveProfile,
  FamilyArtifact,
  ReferenceSourceRegistryItem,
} from '../types/artifact';

const DB_NAME = 'HoSoKyVatGiaDinh_C03_DB';
const DB_VERSION = 1;

const STORE_ARTIFACTS = 'artifacts';
const STORE_ORIGINAL_IMAGES = 'originalImages';
const STORE_SOURCES = 'sources';
const STORE_META = 'meta';

export interface OriginalImageRecord {
  id: string;
  artifactId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  createdAt: string;
}

interface SequenceMeta {
  key: 'sequence';
  nextNumber: number;
}

interface ProfileMeta {
  key: 'familyProfile';
  profile: FamilyArchiveProfile;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_ARTIFACTS)) {
        db.createObjectStore(STORE_ARTIFACTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ORIGINAL_IMAGES)) {
        db.createObjectStore(STORE_ORIGINAL_IMAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SOURCES)) {
        db.createObjectStore(STORE_SOURCES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Không thể mở IndexedDB.'));
  });
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Lỗi truy vấn IndexedDB.'));
  });
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Lỗi giao dịch IndexedDB.'));
    tx.onabort = () => reject(tx.error ?? new Error('Giao dịch IndexedDB bị hủy.'));
  });
}

export function formatArtifactCode(num: number): string {
  return `C03-${String(num).padStart(5, '0')}`;
}

export async function initDatabase(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_SOURCES, STORE_META], 'readwrite');
  const sourceStore = tx.objectStore(STORE_SOURCES);
  const metaStore = tx.objectStore(STORE_META);

  const existingSources = await promisifyRequest<ReferenceSourceRegistryItem[]>(
    sourceStore.getAll()
  );
  if (existingSources.length === 0) {
    for (const src of INITIAL_REFERENCE_SOURCES) {
      sourceStore.put(src);
    }
  }

  const seqMeta = await promisifyRequest<SequenceMeta | undefined>(
    metaStore.get('sequence')
  );
  if (!seqMeta) {
    metaStore.put({ key: 'sequence', nextNumber: 1 } satisfies SequenceMeta);
  }

  const profMeta = await promisifyRequest<ProfileMeta | undefined>(
    metaStore.get('familyProfile')
  );
  if (!profMeta) {
    metaStore.put({
      key: 'familyProfile',
      profile: DEFAULT_FAMILY_PROFILE,
    } satisfies ProfileMeta);
  }

  await promisifyTransaction(tx);
  db.close();
}

export async function getAllArtifacts(): Promise<FamilyArtifact[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_ARTIFACTS, 'readonly');
  const items = await promisifyRequest<FamilyArtifact[]>(
    tx.objectStore(STORE_ARTIFACTS).getAll()
  );
  await promisifyTransaction(tx);
  db.close();
  return items
    .filter((item) => !item.isDemo)
    .sort((a, b) => a.identifier.localeCompare(b.identifier));
}

export async function getArtifactById(id: string): Promise<FamilyArtifact | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE_ARTIFACTS, 'readonly');
  const item = await promisifyRequest<FamilyArtifact | undefined>(
    tx.objectStore(STORE_ARTIFACTS).get(id)
  );
  await promisifyTransaction(tx);
  db.close();
  return item;
}

export async function saveArtifact(artifact: FamilyArtifact): Promise<void> {
  if (artifact.isDemo) {
    throw new Error('Không được lưu bản ghi DEMO vào kho dữ liệu thực tế.');
  }
  const db = await openDB();
  const tx = db.transaction([STORE_ARTIFACTS, STORE_META], 'readwrite');
  const artifactStore = tx.objectStore(STORE_ARTIFACTS);
  const metaStore = tx.objectStore(STORE_META);

  artifactStore.put(artifact);

  // Ensure monotonic sequence never falls behind manually imported/template codes
  const match = /^C03-(\d{5,})$/.exec(artifact.identifier);
  if (match) {
    const codeNum = parseInt(match[1], 10);
    const seq = await promisifyRequest<SequenceMeta | undefined>(
      metaStore.get('sequence')
    );
    const currentNext = seq?.nextNumber ?? 1;
    if (codeNum >= currentNext) {
      metaStore.put({
        key: 'sequence',
        nextNumber: codeNum + 1,
      } satisfies SequenceMeta);
    }
  }

  await promisifyTransaction(tx);
  db.close();
}

export async function deleteArtifact(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_ARTIFACTS, STORE_ORIGINAL_IMAGES], 'readwrite');
  const artifactStore = tx.objectStore(STORE_ARTIFACTS);
  const imgStore = tx.objectStore(STORE_ORIGINAL_IMAGES);

  const existing = await promisifyRequest<FamilyArtifact | undefined>(
    artifactStore.get(id)
  );
  if (existing) {
    for (const img of existing.imageFiles) {
      if (img.originalImageId) {
        imgStore.delete(img.originalImageId);
      }
    }
  }
  artifactStore.delete(id);
  // Note: sequence number in meta is deliberately NOT decremented so deleted codes are never reused.
  await promisifyTransaction(tx);
  db.close();
}

export async function peekNextIdentifier(): Promise<string> {
  const db = await openDB();
  const tx = db.transaction([STORE_META, STORE_ARTIFACTS], 'readonly');
  const seq = await promisifyRequest<SequenceMeta | undefined>(
    tx.objectStore(STORE_META).get('sequence')
  );
  const artifacts = await promisifyRequest<FamilyArtifact[]>(
    tx.objectStore(STORE_ARTIFACTS).getAll()
  );
  await promisifyTransaction(tx);
  db.close();

  let candidate = seq?.nextNumber ?? 1;
  const used = new Set(artifacts.map((a) => a.identifier));
  while (used.has(formatArtifactCode(candidate))) {
    candidate += 1;
  }
  return formatArtifactCode(candidate);
}

export async function saveOriginalImageBlob(record: OriginalImageRecord): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_ORIGINAL_IMAGES, 'readwrite');
  tx.objectStore(STORE_ORIGINAL_IMAGES).put(record);
  await promisifyTransaction(tx);
  db.close();
}

export async function getOriginalImageBlob(
  id: string
): Promise<OriginalImageRecord | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE_ORIGINAL_IMAGES, 'readonly');
  const res = await promisifyRequest<OriginalImageRecord | undefined>(
    tx.objectStore(STORE_ORIGINAL_IMAGES).get(id)
  );
  await promisifyTransaction(tx);
  db.close();
  return res;
}

export async function deleteOriginalImageBlob(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_ORIGINAL_IMAGES, 'readwrite');
  tx.objectStore(STORE_ORIGINAL_IMAGES).delete(id);
  await promisifyTransaction(tx);
  db.close();
}

export async function getFamilyProfile(): Promise<FamilyArchiveProfile> {
  const db = await openDB();
  const tx = db.transaction(STORE_META, 'readonly');
  const res = await promisifyRequest<ProfileMeta | undefined>(
    tx.objectStore(STORE_META).get('familyProfile')
  );
  await promisifyTransaction(tx);
  db.close();
  return res?.profile ?? DEFAULT_FAMILY_PROFILE;
}

export async function saveFamilyProfile(profile: FamilyArchiveProfile): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_META, 'readwrite');
  tx.objectStore(STORE_META).put({
    key: 'familyProfile',
    profile,
  } satisfies ProfileMeta);
  await promisifyTransaction(tx);
  db.close();
}

export async function getAllSources(): Promise<ReferenceSourceRegistryItem[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_SOURCES, 'readonly');
  const items = await promisifyRequest<ReferenceSourceRegistryItem[]>(
    tx.objectStore(STORE_SOURCES).getAll()
  );
  await promisifyTransaction(tx);
  db.close();
  return items;
}

export async function saveSource(source: ReferenceSourceRegistryItem): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_SOURCES, 'readwrite');
  tx.objectStore(STORE_SOURCES).put(source);
  await promisifyTransaction(tx);
  db.close();
}

export async function deleteSource(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_SOURCES, 'readwrite');
  tx.objectStore(STORE_SOURCES).delete(id);
  await promisifyTransaction(tx);
  db.close();
}
