import { saveOriginalImageBlob } from '../services/db';
import { ArtifactImageFile, PhotoAngle } from '../types/artifact';

const TARGET_MAX_BYTES = 500 * 1024; // 500 KB

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể đọc tệp ảnh được chọn.'));
    img.src = src;
  });
}

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

export function formatPhotoFileName(artifactIdentifier: string, sequenceIndex: number): string {
  const idx = String(sequenceIndex).padStart(2, '0');
  return `${artifactIdentifier}-anh-${idx}.jpg`;
}

export async function processArtifactPhoto(params: {
  file: File;
  artifactIdentifier: string;
  sequenceIndex: number;
  angle: PhotoAngle;
  caption: string;
  photographerOrSource: string;
  captureDate: string;
  usagePermission: string;
  isPermittedForPublic: boolean;
}): Promise<ArtifactImageFile> {
  const {
    file,
    artifactIdentifier,
    sequenceIndex,
    angle,
    caption,
    photographerOrSource,
    captureDate,
    usagePermission,
    isPermittedForPublic,
  } = params;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const naturalWidth = img.naturalWidth || 1200;
    const naturalHeight = img.naturalHeight || 900;

    // 1. Save untouched original image blob separately in IndexedDB
    const originalImageId = `orig-${artifactIdentifier}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await saveOriginalImageBlob({
      id: originalImageId,
      artifactId: artifactIdentifier,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      sizeBytes: file.size,
      blob: file,
      createdAt: new Date().toISOString(),
    });

    // 2. Generate optimized display version (< 500 KB) without overwriting original
    const maxDimensions = [1600, 1280, 1024, 800];
    const qualities = [0.85, 0.72, 0.6, 0.48];
    let bestDataUrl = '';
    let bestBytes = Infinity;

    for (const maxDim of maxDimensions) {
      const scale = Math.min(1, maxDim / Math.max(naturalWidth, naturalHeight));
      const targetW = Math.max(1, Math.round(naturalWidth * scale));
      const targetH = Math.max(1, Math.round(naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Trình duyệt không hỗ trợ xử lý ảnh Canvas.');
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      for (const q of qualities) {
        const dataUrl = canvas.toDataURL('image/jpeg', q);
        const bytes = dataUrlByteLength(dataUrl);
        bestDataUrl = dataUrl;
        bestBytes = bytes;
        if (bytes <= TARGET_MAX_BYTES) {
          break;
        }
      }
      if (bestBytes <= TARGET_MAX_BYTES) {
        break;
      }
    }

    const standardizedName = formatPhotoFileName(artifactIdentifier, sequenceIndex);

    return {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: standardizedName,
      angle,
      displayDataUrl: bestDataUrl,
      displaySizeBytes: bestBytes,
      originalImageId,
      originalFileName: file.name,
      originalMimeType: file.type || 'image/jpeg',
      originalSizeBytes: file.size,
      width: naturalWidth,
      height: naturalHeight,
      caption: caption.trim(),
      photographerOrSource: photographerOrSource.trim(),
      captureDate: captureDate.trim(),
      usagePermission: usagePermission.trim(),
      isPermittedForPublic,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
