# Supabase Storage Setup Guide

## Overview
This file storage system provides 1GB of free storage per user using Supabase Storage.

## Prerequisites
- Supabase project configured (already done)
- Supabase Storage enabled

## Setup Steps

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name:** `user-files`
   - **Public bucket:** ❌ Unchecked (private)
   - **File size limit:** 100 MB
   - **Allowed MIME types:** Leave empty (allows all types)

### 2. Set Up Storage Policies (Row Level Security)

Go to **Storage** → **Policies** → `user-files` bucket

#### Policy 1: Users can upload their own files
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Users can read their own files
```sql
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Users can delete their own files
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Users can update their own files
```sql
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Verify Setup

1. The bucket should be created and visible in Storage
2. Policies should be active (green checkmark)
3. Test by uploading a file from the file storage page

## File Structure

Files are stored in Supabase Storage with the following structure:
```
user-files/
  └── {user_id}/
      └── {timestamp}_{filename}
```

Example:
```
user-files/
  └── 12345678-1234-1234-1234-123456789abc/
      └── 1703123456789_document.pdf
```

## Storage Limits

- **Per User:** 1 GB
- **Per File:** 100 MB
- **Total Files:** Unlimited (within storage limit)

## Security

- Files are stored in user-specific folders
- Users can only access their own files
- All operations require authentication
- File paths are validated to prevent directory traversal

## Troubleshooting

### "Bucket does not exist" error
- Make sure the bucket `user-files` is created in Supabase Dashboard
- Check that the bucket name matches exactly

### "Permission denied" error
- Verify that RLS policies are set up correctly
- Check that the user is authenticated
- Ensure policies allow the operation (INSERT, SELECT, DELETE, UPDATE)

### Files not appearing
- Check browser console for errors
- Verify user is logged in
- Check Supabase Storage logs in dashboard

### Upload fails
- Check file size (must be < 100MB)
- Verify storage quota (must be < 1GB)
- Check network connection
- Review Supabase Storage logs

## Notes

- Files are stored permanently until deleted by the user
- Storage usage is calculated from file metadata
- File names are sanitized to prevent XSS attacks
- All file operations are logged in Supabase

