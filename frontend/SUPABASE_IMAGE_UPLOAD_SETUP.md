# Supabase Image Upload Setup

This document explains how to set up and use the Supabase image upload functionality in the Tiptap editor.

## Overview

The image upload node now integrates with Supabase Storage to store uploaded images. Images are uploaded to a specified bucket and the public URL is returned to the editor.

## Setup Instructions

### 1. Configure Supabase Environment Variables

Add your Supabase credentials to your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to Storage section
3. Create a new bucket named `images`
4. Set up the appropriate RLS (Row Level Security) policies

### 3. Set Up RLS Policies

Create the following policies in your Supabase SQL editor:

```sql
-- Allow users to upload images
CREATE POLICY "Allow image uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated'
);

-- Allow users to view their own images
CREATE POLICY "Allow users to view images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images'
);

-- Allow users to update their own images
CREATE POLICY "Allow users to update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Usage

### Basic Usage

The image upload node is already configured to use Supabase storage. When users upload images through the Tiptap editor:

1. Images are uploaded to the `images` bucket
2. Files are stored in the `editor-images` folder
3. Each file gets a unique name with timestamp and random string
4. Public URL is returned and inserted into the editor

### Configuration Options

You can customize the upload behavior by modifying the `handleImageUpload` function in `src/lib/supabase-upload.ts`:

```typescript
export const handleImageUpload = async (
  file: File,
  onProgress: (event: { progress: number }) => void,
  signal: AbortSignal
): Promise<string> => {
  const url = await uploadToSupabase(file, {
    bucket: 'images',           // Change bucket name
    folder: 'editor-images',   // Change folder path
    onProgress: (progress) => {
      onProgress({ progress: progress.progress });
    },
    signal,
  });

  return url;
};
```

### File Upload Features

- **Progress Tracking**: Shows upload progress to users
- **Abort Support**: Users can cancel uploads
- **Error Handling**: Comprehensive error messages
- **File Validation**: Checks file size and type
- **Unique Naming**: Prevents filename conflicts

## File Structure

```
frontend/src/
├── lib/
│   ├── supabase.ts              # Supabase client configuration
│   ├── supabase-upload.ts       # Upload utility functions
│   └── tiptap-utils.ts          # Updated with Supabase integration
└── components/
    └── tiptap-node/
        └── image-upload-node/   # Image upload component (unchanged)
```

## API Reference

### uploadToSupabase(file, options)

Uploads a file to Supabase storage.

**Parameters:**
- `file: File` - The file to upload
- `options: SupabaseUploadOptions`
  - `bucket: string` - Storage bucket name
  - `folder?: string` - Folder path within bucket
  - `onProgress?: (progress: UploadProgress) => void` - Progress callback
  - `signal?: AbortSignal` - Abort signal for cancellation

**Returns:** `Promise<string>` - Public URL of uploaded file

### deleteFromSupabase(bucket, filePath)

Deletes a file from Supabase storage.

**Parameters:**
- `bucket: string` - Storage bucket name
- `filePath: string` - Path to file within bucket

**Returns:** `Promise<void>`

## Error Handling

The upload system handles various error scenarios:

- **File size exceeded**: Shows maximum allowed size error
- **Network issues**: Displays connection error messages
- **Permission denied**: Shows authentication/authorization errors
- **Storage limits**: Handles bucket quota exceeded errors
- **Invalid file types**: Validates against accepted file types

## Security Considerations

1. **RLS Policies**: Ensure proper Row Level Security policies are in place
2. **File Size Limits**: Configure appropriate size limits
3. **File Type Validation**: Only allow image file types
4. **Authentication**: Require user authentication for uploads
5. **Public Access**: Be mindful of public URL accessibility

## Troubleshooting

### Common Issues

1. **Upload fails with permission error**
   - Check RLS policies are correctly configured
   - Verify user is authenticated
   - Ensure bucket exists

2. **Images not displaying**
   - Check bucket is set to public
   - Verify CORS settings
   - Ensure public URLs are accessible

3. **Progress not updating**
   - Progress is simulated since Supabase SDK doesn't provide real-time progress
   - For accurate progress, consider using XMLHttpRequest directly

### Debug Mode

To enable debug logging, modify the upload function to add console.log statements for troubleshooting.

## Future Enhancements

Potential improvements to consider:

1. **Real Progress Tracking**: Implement XMLHttpRequest for accurate progress
2. **Image Optimization**: Compress images before upload
3. **Multiple Bucket Support**: Support different buckets for different content types
4. **CDN Integration**: Use CDN for faster image delivery
5. **Image Resizing**: Create multiple image sizes on upload
