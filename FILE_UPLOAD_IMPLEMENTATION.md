# File Upload Implementation for Product Images

## Overview
The product admin panel now supports **local file uploads** for product images instead of requiring URL inputs. Users can upload image files directly through the product form.

## Changes Made

### 1. Backend Implementation

#### File Upload Endpoint: `POST /api/upload`
- **Location**: `server/routes.ts`
- **Multer Configuration**:
  - Stores uploads in `public/images/` directory
  - Generates unique filenames with timestamps
  - Supports: JPEG, PNG, GIF, WebP
  - Max file size: 10MB per file
- **Response**: Returns JSON with uploaded file URL: `{ url: "/images/filename.jpg" }`

#### Static File Serving
- **Location**: `server/index.ts`
- Serves uploaded images via `/images/*` static route
- Works in both development and production

### 2. Frontend Implementation

#### New Hook: `useUploadFile()`
- **Location**: `client/src/hooks/use-upload-file.ts`
- Handles file uploads to `/api/upload` endpoint
- Provides `uploadFile(file)` function that returns the file URL
- Includes error handling and loading state

#### Updated ProductFormDialog Component
- **Location**: `client/src/components/admin/ProductFormDialog.tsx`
- Replaced URL input fields with file upload inputs
- Features:
  - Image preview for both primary and secondary images
  - Hidden file input with styled upload button
  - Shows selected filename
  - Validates that primary image is provided
  - Automatically uploads files when form is submitted
  - Displays "Uploading..." status during upload

### 3. Dependencies Installed
- `multer@^1.4.5` - Handles multipart file uploads
- `@types/multer` - TypeScript type definitions

## How to Use

### Adding a Product with Images

1. Click the Admin button (red floating button in bottom-right)
2. Click "Add Product" in the Products tab
3. Fill in product details (name, price, type, metal, stone, etc.)
4. Click "Upload Primary Image" button → select an image file
5. (Optional) Click "Upload Secondary Image" → select a second image for hover effect
6. See live previews of your selected images
7. Click "Save Product"
   - Images upload to server automatically
   - Product is saved with image URLs

### Editing a Product

- Existing product images are displayed as previews
- You can replace either image by clicking "Change [Primary/Secondary] Image"
- Unchanged images keep their original URLs
- New images are uploaded when you save

### Supported Image Formats
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

### File Size Limit
- Maximum 10MB per image

## Technical Details

### Image Storage Path
```
public/images/
├── 1739690400000-123456789.jpg  (Primary image)
├── 1739690401000-987654321.png  (Secondary image)
└── ...
```

### File URL Format
Uploaded files are accessible at:
```
/images/{timestamp}-{randomNumber}.{extension}
```

Example: `/images/1739690400000-123456789.jpg`

### Form Data Flow
1. User selects image file(s)
2. Preview shown immediately (client-side FileReader)
3. On form submit:
   - Files uploaded to `/api/upload`
   - Server returns file URLs
   - Product saved with file URLs in database
   - Client resets form and closes dialog

## Error Handling

- **Invalid file type**: Error message shown, form not submitted
- **File size too large**: Multer rejects with error
- **Upload failure**: Error message displayed to user
- **Missing primary image**: Form validation prevents submission

## Security Features

- File type validation (MIME type checking)
- File size limits
- Unique filename generation (prevents overwriting)
- Files stored outside the client directory

## Next Steps (Optional)

### Image Optimization
Consider adding image optimization before upload:
```typescript
// Could add compression or resizing with:
// - sharp (Node.js image processing)
// - imagemin (minimize file size)
```

### Cloud Storage
For production, consider migrating to cloud storage:
- AWS S3
- Google Cloud Storage
- Cloudinary
- Supabase Storage

This would:
- Remove disk storage limitations
- Enable CDN distribution
- Reduce server load
- Provide automatic backups

### Progress Bar
Could add upload progress tracking with:
```typescript
// Fetch with XMLHttpRequest for progress events
// Or use ReadableStream for real-time tracking
```

## Troubleshooting

### "Failed to upload file" error
- Check file size (must be under 10MB)
- Verify file format is supported
- Check server logs for details

### Images not displaying
- Check browser console for 404 errors
- Verify public/images/ directory exists
- Check file permissions

### Port 5000 in use
```bash
# On Windows, find and kill the process:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Then restart dev server:
npm run dev
```

## Testing

Run the development server:
```bash
npm run dev
```

Then:
1. Navigate to http://localhost:5000
2. Click Admin button (bottom-right)
3. Click "Add Product"
4. Upload test images and save
5. Verify images appear on product cards
6. Check /images folder for uploaded files
