# Client-Side PDF Conversion Migration Guide

This document details all file changes made to implement client-side PDF-to-image conversion, moving away from server-side PDF rendering (which doesn't work in Cloudflare Workers).

## Overview

**Problem**: PDF.js cannot work in Cloudflare Workers due to:
- No Canvas API
- No Web Workers support
- WASM limitations

**Solution**: Convert PDFs to images on the client (Expo app) before uploading to the Worker.

## Files Changed

### Backend Changes

#### 1. `backend/parse-doc/index.ts`

**Changes**:
- Added support for `type` field in form data (`"pdf"` or `"images"`)
- Routes requests based on type:
  - `type="pdf"` → calls `handleParseDoc()` (for text-based PDFs)
  - `type="images"` → calls `handleParseImages()` (for pre-converted images)
- Added fallback: if type is missing but file exists, defaults to `"pdf"`
- Added debug logging for form data keys and request type

**Key Code**:
```typescript
// Get request type (pdf or images)
let type = formData.get("type") as string | null;
console.log("[parse-doc:index] Request type:", type, typeof type);

// Fallback: If type is not provided but file exists, assume PDF (backwards compatibility)
if (!type) {
  const file = formData.get("file") as File | null;
  if (file) {
    console.log("[parse-doc:index] Type not provided, but file exists. Defaulting to 'pdf'");
    type = "pdf";
  }
}

if (type === "pdf") {
  // Handle PDF file upload
  const file = formData.get("file") as File | null;
  if (!file) {
    const { response } = createError("No file uploaded", 400);
    return withCors(response);
  }
  const response = await handleParseDoc(file, env);
  return withCors(response);
} else if (type === "images") {
  // Handle pre-converted images from client
  const images: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === "images" && value instanceof File) {
      images.push(value);
    }
  }
  
  if (images.length === 0) {
    const { response } = createError("No images uploaded", 400);
    return withCors(response);
  }
  
  const response = await handleParseImages(images, env);
  return withCors(response);
}
```

#### 2. `backend/parse-doc/handler.ts`

**Changes**:
- Removed import of `renderPdfPagesToImages` (broken function)
- Updated scanned PDF handling: now returns error asking client to convert
- Added new `handleParseImages()` function to process pre-converted images
- Updated imports to remove `renderPdfPagesToImages`

**Key Code - Scanned PDF Handling**:
```typescript
} else {
  // Scanned PDF (no text layer): Client should have converted to images
  // If we receive a PDF with no text, return error asking client to convert
  console.log(`[parse-doc:${requestId}] PDF has no text layer`);
  console.log(`[parse-doc:${requestId}] This PDF appears to be scanned. Client should convert to images first.`);
  const { response } = createError(
    "PDF appears to be scanned. Please convert to images first.",
    400,
    "NO_TEXT_FOUND"
  );
  return response;
}
```

**Key Code - New handleParseImages Function**:
```typescript
/**
 * Handles parsing of pre-converted images from client (for scanned PDFs)
 * Client converts PDF pages to JPEG images before uploading
 */
export async function handleParseImages(
  images: File[],
  env: Env
): Promise<Response> {
  // Validates images, converts to base64, sends to Groq Vision API
  // Returns parsed items
}
```

#### 3. `backend/shared/parsing/pdfExtract.ts`

**Changes**:
- Removed `@embedpdf/pdfium` import (doesn't work in Workers)
- Updated `renderPdfPagesToImages()` to immediately throw error with clear message
- Updated documentation to mark function as deprecated
- Updated file header comment

**Key Code**:
```typescript
// Removed: import { init, DEFAULT_PDFIUM_WASM_URL } from "@embedpdf/pdfium";

/**
 * @deprecated DO NOT USE IN CLOUDFLARE WORKERS
 * 
 * This function attempts to render PDF pages to JPEG images, but it fundamentally
 * cannot work in Cloudflare Workers because:
 * 
 * 1. **No Canvas API**: Workers don't support Canvas rendering
 * 2. **No Web Workers**: PDF.js threading requires Web Workers (not available)
 * 3. **WASM limitations**: PDFium WASM requires features not available in Workers
 * 4. **No native modules**: node-canvas, sharp, etc. don't work in Workers
 * 
 * **Architecture Solution**: PDF-to-image conversion must happen on the client (Expo app)
 * where native device APIs are available. The client should convert scanned PDFs to
 * JPEG images and send them to the Worker with type="images".
 * 
 * This function is kept for reference only and will always throw an error.
 */
export async function renderPdfPagesToImages(
  buffer: ArrayBuffer,
  scale: number = 2.0,
  maxPages: number = 10
): Promise<string[]> {
  // This function cannot work in Cloudflare Workers - always throw
  throw new Error(
    "PDF rendering is not supported in Cloudflare Workers. " +
    "PDF-to-image conversion must be performed on the client (Expo app) using native device APIs. " +
    "Convert scanned PDFs to JPEG images client-side and send them with type='images'."
  );
}
```

#### 4. `backend/parse-doc/package.json`

**Changes**:
- Removed `@embedpdf/pdfium` dependency

**Before**:
```json
"dependencies": {
  "@embedpdf/pdfium": "^1.4.1",
  "groq-sdk": "^0.5.0",
  "pdfjs-dist": "^4.0.379",
  "zod": "^3.22.4"
}
```

**After**:
```json
"dependencies": {
  "groq-sdk": "^0.5.0",
  "pdfjs-dist": "^4.0.379",
  "zod": "^3.22.4"
}
```

### Frontend Changes

#### 5. `restock/lib/api/parseDoc.ts`

**Changes**:
- Added `type` field to form data (determines if PDF or images)
- Updated `parseDocument()` to reject PDFs directly (client must convert first)
- Added progress callback parameter
- Updated to send `type="images"` for image uploads

**Key Code**:
```typescript
export async function parseDocument(
  file: DocumentFile,
  onProgress?: (message: string, progress?: number) => void
): Promise<{ success: true; items: ParsedItem[] } | { success: false; error: string }> {
  // ...
  const isPdf = file.mimeType?.includes('pdf') || file.name?.endsWith('.pdf');
  
  // For PDFs: Client should convert to images first (since PDF.js doesn't work in Workers)
  // This function should NOT be called with PDFs - the upload component handles conversion
  if (isPdf) {
    return {
      success: false,
      error: 'PDF files must be converted to images client-side before calling parseDocument. ' +
        'Use the upload component which handles PDF conversion automatically.',
    };
  }

  // For images: Send directly
  onProgress?.('Uploading images...', 0);
  
  const formData = new FormData();
  formData.append('type', 'images');
  
  formData.append('images', {
    uri: file.uri,
    name: file.name || 'image.jpg',
    type: file.mimeType || 'image/jpeg',
  } as any);
  // ...
}
```

#### 6. `restock/app/upload/index.tsx`

**Major Changes**:
- Added PDF conversion logic using `react-native-pdf` and `react-native-view-shot`
- Added hidden PDF renderer component for off-screen rendering
- Added progress tracking with messages and progress bar
- Updated UI to show conversion progress
- Added state management for PDF conversion process

**New Imports**:
```typescript
import PDF from 'react-native-pdf';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
```

**New State Variables**:
```typescript
const [loadingMessage, setLoadingMessage] = useState<string>('');
const [loadingProgress, setLoadingProgress] = useState<number>(0);
const pdfRef = useRef<PDF>(null);
const pdfViewRef = useRef<View>(null);
const [pdfPage, setPdfPage] = useState<number | null>(null);
const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
const pdfConversionRef = useRef<{
  resolve: (value: string[]) => void;
  reject: (error: Error) => void;
  imageUris: string[];
  maxPages: number;
} | null>(null);
const [pdfConversionState, setPdfConversionState] = useState<{
  isConverting: boolean;
  currentPage: number;
  totalPages: number;
  pdfUri: string | null;
  cacheDir: string;
} | null>(null);
```

**New Functions**:
- `convertPdfToImages()` - Initiates PDF conversion process
- `useEffect` hook - Handles PDF page rendering and capture

**Updated `sendForParsing()` Function**:
- Detects PDFs and converts them to images first
- Shows progress during conversion
- Uploads converted images instead of PDF directly
- Handles errors with clear messages

**New UI Elements**:
- Progress bar in loading button
- Loading messages ("Converting PDF to images...", "Converting page X...", etc.)
- Better error display
- Hidden PDF renderer component (off-screen)

#### 7. `restock/lib/utils/pdfConverter.ts` (NEW FILE)

**Purpose**: Utility functions for PDF conversion (currently placeholder, actual conversion happens in upload component)

**Content**:
- Helper functions for PDF page counting
- Component creation helpers
- Documentation

#### 8. `restock/lib/components/PdfPageRenderer.tsx` (NEW FILE - Optional)

**Purpose**: React component for rendering individual PDF pages (created but may not be used in final implementation)

**Content**:
- PDF page renderer component
- View capture setup
- Off-screen rendering styles

## Required Dependencies

### Backend
No new dependencies (removed `@embedpdf/pdfium`)

### Frontend
Add these to `restock/package.json`:
```json
{
  "dependencies": {
    "react-native-pdf": "^latest",
    "react-native-view-shot": "^latest"
  }
}
```

Install with:
```bash
cd restock
npm install react-native-pdf react-native-view-shot
```

## Migration Steps

1. **Clone fresh repo**
2. **Install frontend dependencies**:
   ```bash
   cd restock
   npm install react-native-pdf react-native-view-shot
   ```

3. **Apply backend changes**:
   - Update `backend/parse-doc/index.ts` with new routing logic
   - Update `backend/parse-doc/handler.ts` with `handleParseImages()` function
   - Update `backend/shared/parsing/pdfExtract.ts` to remove broken PDF rendering
   - Update `backend/parse-doc/package.json` to remove `@embedpdf/pdfium`

4. **Apply frontend changes**:
   - Update `restock/lib/api/parseDoc.ts` to reject PDFs directly
   - Update `restock/app/upload/index.tsx` with PDF conversion logic
   - Create `restock/lib/utils/pdfConverter.ts` (optional utility file)

5. **Deploy backend**:
   ```bash
   cd backend/parse-doc
   wrangler deploy
   ```

6. **Test**:
   - Upload a PDF file
   - Should see "Converting PDF to images..." message
   - Should see progress for each page
   - Should upload images and get parsed results

## Architecture Flow

```
User selects PDF
    ↓
Upload Component detects PDF
    ↓
convertPdfToImages() called
    ↓
Hidden PDF component renders page 1
    ↓
view-shot captures page as JPEG
    ↓
Repeat for all pages (max 10)
    ↓
Upload all images with type="images"
    ↓
Worker receives images
    ↓
Worker sends to Groq Vision API
    ↓
Returns parsed items
```

## Error Handling

- **PDF conversion fails**: Shows error message asking user to convert manually
- **No images generated**: Returns error before upload
- **Worker error**: Shows server error message
- **Timeout**: 60 second timeout on conversion

## Notes

- PDF conversion happens entirely client-side
- Images are saved to cache directory temporarily
- Maximum 10 pages per PDF
- JPEG quality set to 85% (balance of size vs quality)
- Hidden PDF renderer positioned off-screen (-10000px)

## Testing Checklist

- [ ] PDF with text layer → Should convert to images and parse
- [ ] Scanned PDF → Should convert to images and parse
- [ ] Image file (PNG/JPG) → Should upload directly
- [ ] Large PDF (>10MB) → Should show error
- [ ] PDF with >10 pages → Should convert first 10 pages
- [ ] Network error → Should show error message
- [ ] Conversion timeout → Should show timeout error

