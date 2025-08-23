import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload image to Supabase Storage with proper conversion
 * @param imageUri - The image URI from ImagePicker/Camera (file:// or content://)
 * @param fileName - The filename to use for the upload
 * @param onProgress - Optional progress callback
 * @returns Promise<UploadResult>
 */
export const uploadImage = async (
  imageUri: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    console.log('🚀 Starting image upload process...');
    console.log('📱 Image URI:', imageUri);
    console.log('📁 File name:', fileName);

    // Step 1: Convert image URI to base64 using expo-file-system
    console.log('🔄 Converting image to base64...');
    if (onProgress) onProgress(10);

    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64Data) {
      throw new Error('Failed to read image data');
    }

    console.log('✅ Base64 conversion successful, length:', base64Data.length);
    if (onProgress) onProgress(30);

    // Step 2: Convert base64 to ArrayBuffer
    console.log('🔄 Converting base64 to ArrayBuffer...');
    const arrayBuffer = decode(base64Data);
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Failed to convert base64 to ArrayBuffer');
    }

    console.log('✅ ArrayBuffer created, size:', arrayBuffer.byteLength, 'bytes');
    if (onProgress) onProgress(50);

    // Step 3: Upload to Supabase Storage
    console.log('📤 Uploading to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from('urbaneye-issues')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    console.log('✅ Upload successful!');
    if (onProgress) onProgress(80);

    // Step 4: Get public URL
    console.log('🔗 Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('urbaneye-issues')
      .getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('✅ Public URL obtained:', publicUrl);
    if (onProgress) onProgress(100);

    return {
      success: true,
      publicUrl,
    };

  } catch (error) {
    console.error('💥 Image upload failed:', error);
    
    let errorMessage = 'Unknown upload error';
    
    if (error instanceof Error) {
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('bucket')) {
        errorMessage = 'Storage bucket not accessible. Please check your Supabase configuration.';
      } else if (error.message.includes('permission') || error.message.includes('security policy')) {
        errorMessage = 'Permission denied. Please ensure you are logged in.';
      } else if (error.message.includes('Invalid image data')) {
        errorMessage = 'Invalid image data. Please try taking the photo again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Generate a unique filename for the image
 * @param originalUri - The original image URI
 * @returns string - A unique filename
 */
export const generateUniqueFileName = (originalUri: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalUri.split('.').pop() || 'jpg';
  return `issue-${timestamp}-${randomString}.${extension}`;
};

/**
 * Validate image URI format
 * @param uri - The image URI to validate
 * @returns boolean - Whether the URI is valid
 */
export const isValidImageUri = (uri: string): boolean => {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:');
};
