import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Hardcoded working values - bypassing .env file completely
const supabaseUrl = 'https://vnifbgwtqtvzpjoicuip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuaWZiZ3d0cXR2enBqb2ljdWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NTgwNTIsImV4cCI6MjA3MTMzNDA1Mn0.ack3XGrHTn1AiqF0RnH65hBEeG3quU8Wa0z2eiBmZXg';

console.log('✅ Supabase client created with hardcoded values');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length);

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage directly
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Storage bucket name for images
export const STORAGE_BUCKET = 'issue-images';

// Helper function to ensure storage bucket exists
export const ensureStorageBucket = async (): Promise<boolean> => {
  try {
    console.log(`🔍 Checking if bucket '${STORAGE_BUCKET}' exists...`);
    
    // Try to get bucket info
    const { data: bucketInfo, error: bucketError } = await supabase.storage
      .getBucket(STORAGE_BUCKET);
    
    if (bucketError) {
      console.log(`❌ Bucket does not exist: ${bucketError.message}`);
      console.log(`🔧 Attempting to create bucket '${STORAGE_BUCKET}'...`);
      
      // Create the bucket
      const { data: createData, error: createError } = await supabase.storage
        .createBucket(STORAGE_BUCKET, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/*']
        });
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
        console.error('Create error details:', {
          message: createError.message,
          name: createError.name
        });
        return false;
      }
      
      console.log('✅ Bucket created successfully:', createData);
      
      // Verify the bucket was created
      const { data: verifyData, error: verifyError } = await supabase.storage
        .getBucket(STORAGE_BUCKET);
      
      if (verifyError) {
        console.error('❌ Bucket verification failed:', verifyError);
        return false;
      }
      
      console.log('✅ Bucket verification successful:', verifyData);
      return true;
    }
    
    console.log('✅ Bucket already exists:', bucketInfo);
    return true;
  } catch (error: any) {
    console.error('❌ Exception in ensureStorageBucket:', error);
    console.error('Exception details:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace'
    });
    return false;
  }
};

// Helper function to upload image to Supabase Storage
export const uploadImageToStorage = async (file: File | Blob, fileName: string): Promise<string> => {
  try {
    console.log(`Starting upload to bucket: ${STORAGE_BUCKET}`);
    console.log(`File name: ${fileName}`);
    console.log(`File size: ${file.size} bytes`);
    console.log(`File type: ${file.type}`);
    
    // First ensure the bucket exists
    const bucketExists = await ensureStorageBucket();
    if (!bucketExists) {
      throw new Error('Storage bucket is not accessible. Please check your Supabase configuration.');
    }
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });
      throw error;
    }

    console.log('Upload successful, data:', data);

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    console.log('Public URL generated:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    console.error('Full error object:', error);
    throw error;
  }
};

// Helper function to get image URL from storage
export const getImageUrl = (fileName: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return publicUrl;
};

// Helper function to delete image from storage
export const deleteImageFromStorage = async (fileName: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    throw error;
  }
};
