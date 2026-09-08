import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { apiClient } from './api';

export async function uploadImageToCloudinary(uri: string): Promise<string> {
  try {
    let prepared = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.78, format: ImageManipulator.SaveFormat.WEBP });
    let fileInfo = await FileSystem.getInfoAsync(prepared.uri);
    if (fileInfo.exists && typeof fileInfo.size === 'number' && fileInfo.size > 5 * 1024 * 1024) {
      prepared = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.55, format: ImageManipulator.SaveFormat.WEBP });
      fileInfo = await FileSystem.getInfoAsync(prepared.uri);
    }
    if (!fileInfo.exists || (typeof fileInfo.size === 'number' && fileInfo.size > 5 * 1024 * 1024)) {
      throw new Error('Image must be 5 MB or smaller after compression');
    }
    // 1. Get signature and upload params from backend
    const signaturePayload = await apiClient('/api/upload/signature', { method: 'POST' });
    
    if (!signaturePayload.signature || !signaturePayload.timestamp || !signaturePayload.cloudName || !signaturePayload.apiKey || !signaturePayload.folder) {
      throw new Error(signaturePayload.error || 'Upload service is not configured');
    }

    // 2. Prepare upload task using expo-file-system
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`;
    
    const response = await FileSystem.uploadAsync(uploadUrl, prepared.uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: 1 as any, // 1 is FileSystemUploadType.MULTIPART
      parameters: {
        api_key: signaturePayload.apiKey,
        timestamp: signaturePayload.timestamp.toString(),
        signature: signaturePayload.signature,
        folder: signaturePayload.folder,
        allowed_formats: signaturePayload.allowedFormats,
      }
    });

    const result = JSON.parse(response.body);
    
    if (response.status !== 200 || !result.public_id) {
      throw new Error(result.error?.message || 'Cloudinary rejected the picture upload');
    }
    const completed = await apiClient('/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ publicId: result.public_id, resourceType: result.resource_type, imageOnly: true }),
    });
    return completed.url;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload image');
  }
}
