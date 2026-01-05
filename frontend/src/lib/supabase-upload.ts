import { supabase } from './supabase';

export interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

export interface SupabaseUploadOptions {
  bucket: string;
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

/**
 * Uploads a file to Supabase storage with progress tracking
 */
export async function uploadToSupabase(
  file: File,
  options: SupabaseUploadOptions
): Promise<string> {
  const { bucket, folder = 'uploads', onProgress, signal } = options;

  // Generate unique file name
  const fileExt = file.name.split('.').pop() || '';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  // Check if signal is already aborted
  if (signal?.aborted) {
    throw new Error('Upload was aborted');
  }

  // Simulate progress tracking since Supabase JS SDK doesn't provide progress callbacks
  // In a real implementation, you might want to use XMLHttpRequest for better progress tracking
  if (onProgress) {
    const progressInterval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(progressInterval);
        return;
      }
      // Simulate progress (in real implementation, this would be based on actual upload progress)
      const progress = Math.random() * 80; // Cap at 80% until completion
      onProgress({ 
        progress, 
        loaded: Math.floor(file.size * progress / 100), 
        total: file.size 
      });
    }, 100);

    // Clear interval after upload completes
    setTimeout(() => {
      clearInterval(progressInterval);
      onProgress({ 
        progress: 100, 
        loaded: file.size, 
        total: file.size 
      });
    }, 1000);
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error('Upload failed: No file path returned');
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    // Final progress update
    if (onProgress) {
      onProgress({ 
        progress: 100, 
        loaded: file.size, 
        total: file.size 
      });
    }

    return publicUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Upload failed: Unknown error');
  }
}

/**
 * Default upload handler for Tiptap image uploads
 */
export const handleImageUpload = async (
  file: File,
  onProgress: (event: { progress: number }) => void,
  signal: AbortSignal
): Promise<string> => {
  try {
    const url = await uploadToSupabase(file, {
      bucket: 'images',
      folder: 'editor-images',
      onProgress: (progress) => {
        onProgress({ progress: progress.progress });
      },
      signal,
    });

    return url;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from Supabase storage
 */
export async function deleteFromSupabase(
  bucket: string,
  filePath: string
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}
