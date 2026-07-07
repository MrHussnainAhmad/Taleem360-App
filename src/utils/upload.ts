import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from './api';

export async function uploadImageToCloudinary(uri: string): Promise<string> {
  try {
    // 1. Get signature and upload params from backend
    const signaturePayload = await apiClient('/api/upload/signature', { method: 'POST' });
    
    if (!signaturePayload.signature || !signaturePayload.timestamp || !signaturePayload.cloudName || !signaturePayload.apiKey) {
      throw new Error(signaturePayload.error || 'Upload service is not configured');
    }

    // 2. Prepare upload task using expo-file-system
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`;
    
    const response = await FileSystem.uploadAsync(uploadUrl, uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: 1 as any, // 1 is FileSystemUploadType.MULTIPART
      parameters: {
        api_key: signaturePayload.apiKey,
        timestamp: signaturePayload.timestamp.toString(),
        signature: signaturePayload.signature,
        folder: 'lms-uploads'
      }
    });

    const result = JSON.parse(response.body);
    
    if (response.status !== 200 || !result.secure_url) {
      throw new Error(result.error?.message || 'Cloudinary rejected the picture upload');
    }

    return result.secure_url;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload image');
  }
}
