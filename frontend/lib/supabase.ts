import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}



// Create Supabase client with React Native specific configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'urbaneye-react-native',
      'User-Agent': 'UrbanEye/1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Use the bucket that exists
export const STORAGE_BUCKET = 'urbaneye-issues';

// Super simple, bulletproof upload function
export const uploadImageToStorage = async (
  file: File | Blob | string,
  fileName: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🚀 Starting upload for:', fileName);
  
  try {
    // Step 1: Convert React Native URI to blob
    let uploadFile: Blob;
    if (typeof file === 'string') {
      console.log('📱 Converting React Native URI to blob...');
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      uploadFile = await response.blob();
      console.log('✅ Blob created, size:', uploadFile.size);
    } else {
      uploadFile = file;
    }
    
    if (onProgress) onProgress(25);
    
    // Step 2: Upload to Supabase
    console.log('📤 Uploading to Supabase...');
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, uploadFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }
    
    console.log('✅ Upload successful!');
    if (onProgress) onProgress(75);
    
    // Step 3: Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);
    
    console.log('🔗 Public URL:', publicUrl);
    if (onProgress) onProgress(100);
    
    return publicUrl;
    
  } catch (error) {
    console.error('💥 Upload failed:', error);
    
    // Super simple error messages
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new Error('Image processing failed. Please try again.');
      } else if (error.message.includes('bucket')) {
        throw new Error('Storage not accessible. Please check your login.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
    
    throw new Error('Upload failed. Please try again.');
  }
};

// Helper function to get image URL
export const getImageUrl = (fileName: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return publicUrl;
};

// Helper function to delete image
export const deleteImageFromStorage = async (fileName: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

// Test function to verify storage connection
export const testStorageConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1 });
    
    if (error) {
      console.error('Storage test error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Storage test exception:', error);
    return false;
  }
};

// Test function to verify basic Supabase connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Test basic connection by trying to list storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1 });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Function to check if we're online
export const checkOnlineStatus = async (): Promise<boolean> => {
  try {
    // Use a simple, reliable network test that doesn't depend on Supabase
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('https://httpbin.org/status/200', {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // If any error occurs, assume we're offline
    return false;
  }
};

// Debug function to test step by step
export const debugSupabaseConnection = async (): Promise<void> => {
  console.log('🔍 Debugging Supabase connection...');
  
  try {
    // Test 1: Basic client creation
    console.log('✅ Supabase client created');
    console.log('🔗 URL:', supabaseUrl);
    console.log('🔑 Key length:', supabaseAnonKey ? supabaseAnonKey.length : 'Missing');
    
    // Test 2: Check if we can reach Supabase
    console.log('📡 Testing connection...');
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1 });
    
    if (error) {
      console.error('❌ Storage error:', error);
      console.error('❌ Error message:', error.message);
    } else {
      console.log('✅ Storage connection successful');
      console.log('📁 Bucket contents:', data);
    }
    
  } catch (error) {
    console.error('💥 Connection failed:', error);
  }
};





