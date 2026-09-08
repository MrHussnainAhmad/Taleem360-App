import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export const MAX_CONTENT_UPLOAD_BYTES = 5 * 1024 * 1024;

type PickedAsset = { uri: string; name: string; mimeType?: string | null; size?: number | null };
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'txt']);

export async function preparePickedContent(asset: PickedAsset): Promise<PickedAsset> {
  const mimeType = (asset.mimeType || '').toLowerCase();
  const extension = asset.name.toLowerCase().split('.').pop() || '';
  if (!ALLOWED_MIMES.has(mimeType) || !ALLOWED_EXTENSIONS.has(extension)) throw new Error('Only JPG, PNG, WebP, PDF, DOCX, or TXT files are allowed.');

  if (mimeType.startsWith('image/')) {
    for (const quality of [0.78, 0.62, 0.48]) {
      const compressed = await ImageManipulator.manipulateAsync(asset.uri, [], { compress: quality, format: ImageManipulator.SaveFormat.WEBP });
      const info = await FileSystem.getInfoAsync(compressed.uri);
      if (info.exists && typeof info.size === 'number' && info.size <= MAX_CONTENT_UPLOAD_BYTES) {
        return { uri: compressed.uri, name: `${asset.name.replace(/\.[^.]+$/, '') || 'image'}.webp`, mimeType: 'image/webp', size: info.size };
      }
    }
    throw new Error('Image remains larger than 5 MB after compression. Choose a smaller image.');
  }

  const info = await FileSystem.getInfoAsync(asset.uri);
  const size = asset.size ?? (info.exists ? info.size : undefined);
  if (typeof size !== 'number' || size <= 0 || size > MAX_CONTENT_UPLOAD_BYTES) throw new Error('File must be 5 MB or smaller.');
  return { ...asset, size };
}
