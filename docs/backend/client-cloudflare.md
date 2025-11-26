# Client-Side PDF Conversion Architecture

## Overview

This document describes the architecture for handling PDF files in the Restock app by performing PDF-to-image conversion on the client (Expo app) rather than in Cloudflare Workers. This approach bypasses the fundamental limitations of Workers (no Canvas API, no native modules) by leveraging the device's native capabilities.

---

## Why Client-Side Conversion?

### The Problem

Cloudflare Workers cannot render PDF pages to images because:

- No Canvas API available
- No Web Workers (for PDF.js threading)
- No native modules (node-canvas, sharp, etc.)
- WASM-based solutions for PDF rendering don't exist or don't work

### The Solution

Move PDF-to-image conversion to the Expo app where:

- Native device APIs are available
- Canvas rendering works (via react-native libraries)
- No cold-start latency for heavy PDF processing
- Better user experience (progress feedback)

---

## Architecture Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         EXPO APP (CLIENT)                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌──────────────┐                                                 │
│   │ User selects │                                                 │
│   │   PDF file   │                                                 │
│   └──────┬───────┘                                                 │
│          │                                                         │
│          ▼                                                         │
│   ┌──────────────────┐                                             │
│   │ Detect PDF type  │                                             │
│   │ (text/scanned)   │                                             │
│   └──────┬───────────┘                                             │
│          │                                                         │
│          ├─────────────────────┐                                   │
│          │                     │                                   │
│          ▼                     ▼                                   │
│   ┌─────────────┐       ┌─────────────────┐                        │
│   │ Has text    │       │ Scanned/No text │                        │
│   │ (Digital)   │       │ (Image-based)   │                        │
│   └──────┬──────┘       └───────┬─────────┘                        │
│          │                      │                                  │
│          │                      ▼                                  │
│          │              ┌───────────────────┐                      │
│          │              │ Convert each page │                      │
│          │              │ to JPEG image     │                      │
│          │              │ (react-native-pdf │                      │
│          │              │  + canvas)        │                      │
│          │              └─────────┬─────────┘                      │
│          │                        │                                │
│          │                        ▼                                │
│          │              ┌───────────────────┐                      │
│          │              │ Show progress UI  │                      │
│          │              │ "Converting..."   │                      │
│          │              └─────────┬─────────┘                      │
│          │                        │                                │
│          ▼                        ▼                                │
│   ┌─────────────────────────────────────────┐                      │
│   │     Upload to Cloudflare Worker         │                      │
│   │  (PDF with text OR converted images)    │                      │
│   └──────────────────┬──────────────────────┘                      │
│                      │                                             │
└──────────────────────┼─────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKER (BACKEND)                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌──────────────────┐                                             │
│   │ Receive request  │                                             │
│   │ (PDF or images)  │                                             │
│   └────────┬─────────┘                                             │
│            │                                                       │
│            ├─────────────────────┐                                 │
│            │                     │                                 │
│            ▼                     ▼                                 │
│   ┌─────────────────┐   ┌─────────────────┐                        │
│   │ PDF received    │   │ Images received │                        │
│   └────────┬────────┘   └────────┬────────┘                        │
│            │                     │                                 │
│            ▼                     │                                 │
│   ┌─────────────────┐            │                                 │
│   │ Extract text    │            │                                 │
│   │ using unpdf     │            │                                 │
│   └────────┬────────┘            │                                 │
│            │                     │                                 │
│            ▼                     ▼                                 │
│   ┌─────────────────┐   ┌─────────────────┐                        │
│   │ Groq Chat API   │   │ Groq Vision API │                        │
│   │ (text prompt)   │   │ (image input)   │                        │
│   └────────┬────────┘   └────────┬────────┘                        │
│            │                     │                                 │
│            └──────────┬──────────┘                                 │
│                       │                                            │
│                       ▼                                            │
│            ┌─────────────────────┐                                 │
│            │ Parse & normalize   │                                 │
│            │ JSON response       │                                 │
│            └─────────────────────┘                                 │
│                       │                                            │
│                       ▼                                            │
│            ┌─────────────────────┐                                 │
│            │ Return items to app │                                 │
│            └─────────────────────┘                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Implementation Steps

### Step 1: PDF Selection

User picks a PDF using `expo-document-picker`:

```typescript
import * as DocumentPicker from 'expo-document-picker';

const result = await DocumentPicker.getDocumentAsync({
  type: 'application/pdf',
  copyToCacheDirectory: true,
});
```

### Step 2: PDF Type Detection

Attempt to extract text from the first page. If text exists, it's a digital PDF. If not, it's scanned.

```typescript
// Quick text check using a lightweight PDF parser
// If text.length > threshold → digital PDF
// If text.length === 0 → scanned PDF
```

### Step 3: Conditional Processing

```
IF digital PDF:
  → Send PDF directly to Worker
  → Worker extracts text with unpdf
  → Worker sends to Groq Chat API

IF scanned PDF:
  → Convert pages to JPEG images (client-side)
  → Send images to Worker
  → Worker sends to Groq Vision API
```

### Step 4: Client-Side Page Rendering (Scanned PDFs Only)

Using `react-native-pdf-renderer` or similar:

```typescript
// Pseudocode for page rendering
for (let page = 1; page <= totalPages; page++) {
  const imageUri = await renderPdfPage(pdfUri, page, {
    scale: 2.0,      // 2x resolution for better OCR
    format: 'jpeg',
    quality: 0.85,
  });
  images.push(imageUri);
  
  // Update progress UI
  setProgress(page / totalPages);
}
```

### Step 5: Upload to Worker

```typescript
const formData = new FormData();

if (isScannedPdf) {
  // Upload images
  images.forEach((uri, index) => {
    formData.append('images', {
      uri,
      type: 'image/jpeg',
      name: `page-${index + 1}.jpg`,
    });
  });
  formData.append('type', 'images');
} else {
  // Upload original PDF
  formData.append('file', {
    uri: pdfUri,
    type: 'application/pdf',
    name: 'document.pdf',
  });
  formData.append('type', 'pdf');
}

const response = await fetch(WORKER_URL, {
  method: 'POST',
  body: formData,
});
```

---

## File Structure

```
app/
├── services/
│   └── documentParser/
│       ├── index.ts              # Main export
│       ├── pdfDetector.ts        # Detect PDF type (text/scanned)
│       ├── pdfRenderer.ts        # Convert PDF pages to images
│       ├── uploadService.ts      # Handle uploads to Worker
│       └── types.ts              # TypeScript interfaces
├── components/
│   └── DocumentUpload/
│       ├── index.tsx             # Main upload component
│       ├── ProgressModal.tsx     # Shows conversion progress
│       └── ErrorDisplay.tsx      # Error handling UI
```

---

## Library Options for PDF Rendering

### Option A: react-native-pdf + ViewShot

Render PDF in a view, then capture as image.

```bash
npm install react-native-pdf react-native-view-shot
```

Pros: Well-maintained, good compatibility
Cons: Requires rendering to screen (can be hidden)

### Option B: react-native-blob-util + Native Module

Use native PDF rendering APIs directly.

```bash
npm install react-native-blob-util
```

Pros: Direct native access
Cons: More complex setup, platform-specific code

### Option C: expo-print (Workaround)

Convert PDF to HTML, then screenshot.

Pros: Works with Expo managed workflow
Cons: Limited quality, complex

### Recommended: Option A

`react-native-pdf` with `react-native-view-shot` provides the best balance of reliability and ease of implementation.

---

## Worker Endpoint Changes

The Worker needs to handle both PDFs and images:

```typescript
// backend/parse-doc/handler.ts

export async function handleRequest(request: Request, env: Env) {
  const formData = await request.formData();
  const type = formData.get('type') as string;
  
  if (type === 'pdf') {
    // Handle PDF with text
    const file = formData.get('file') as File;
    const buffer = await file.arrayBuffer();
    const text = await extractPdfText(buffer);
    
    if (!text) {
      return new Response(JSON.stringify({
        error: 'NO_TEXT_FOUND',
        message: 'PDF appears to be scanned. Please convert to images first.',
      }), { status: 400 });
    }
    
    return await processWithChatApi(text, env);
    
  } else if (type === 'images') {
    // Handle pre-converted images
    const images: string[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File) {
        const buffer = await value.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        images.push(`data:image/jpeg;base64,${base64}`);
      }
    }
    
    return await processWithVisionApi(images, env);
  }
  
  return new Response('Invalid request type', { status: 400 });
}
```

---

## User Experience Flow

```
┌─────────────────────────────────────┐
│         Document Upload Screen       │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │    📄 Tap to select file    │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   Supported: PDF, PNG, JPG          │
│                                     │
└─────────────────────────────────────┘
              │
              │ User selects PDF
              ▼
┌─────────────────────────────────────┐
│         Processing Modal            │
├─────────────────────────────────────┤
│                                     │
│        Analyzing document...        │
│                                     │
│        ████████░░░░░░░ 60%          │
│                                     │
│   Converting page 3 of 5            │
│                                     │
└─────────────────────────────────────┘
              │
              │ Conversion complete
              ▼
┌─────────────────────────────────────┐
│         Processing Modal            │
├─────────────────────────────────────┤
│                                     │
│        Extracting items...          │
│                                     │
│        ░░░░░░░░░░░░░░░░             │
│                                     │
│   Sending to server                 │
│                                     │
└─────────────────────────────────────┘
              │
              │ Server responds
              ▼
┌─────────────────────────────────────┐
│         Results Screen              │
├─────────────────────────────────────┤
│                                     │
│   Found 12 items:                   │
│                                     │
│   ☑ Milk (2 gallons)                │
│   ☑ Bread (1 loaf)                  │
│   ☑ Eggs (1 dozen)                  │
│   ...                               │
│                                     │
│   [Add to Inventory]                │
│                                     │
└─────────────────────────────────────┘
```

---

## Error Handling

### Client-Side Errors

| Error | User Message | Recovery Action |
|-------|--------------|-----------------|
| PDF too large (>10MB) | "File is too large. Max 10MB." | Ask user to use smaller file |
| PDF corrupted | "Unable to read PDF file." | Ask user to try different file |
| Conversion failed | "Failed to process page X." | Retry or skip page |
| Too many pages (>10) | "PDF has too many pages. Max 10." | Ask user to split PDF |

### Server-Side Errors

| Error | User Message | Recovery Action |
|-------|--------------|-----------------|
| No text found | "PDF appears to be scanned." | Trigger client-side conversion |
| Vision API failed | "Unable to read document." | Retry with different quality |
| Rate limited | "Too many requests." | Show retry countdown |

---

## Performance Considerations

### Client-Side

- **Memory**: Process one page at a time, release memory between pages
- **CPU**: Use reasonable scale (2.0 max) to balance quality vs speed
- **Storage**: Use cache directory, clean up after upload

### Network

- **Compression**: JPEG at 85% quality balances size and readability
- **Chunking**: For large documents, consider uploading pages in batches
- **Timeout**: Set reasonable timeout (30s) for uploads

### Server-Side

- **Limits**: Max 10 pages, max 10MB total
- **Caching**: Cache parsed results by document hash

---

## Testing Checklist

| Scenario | Expected Result |
|----------|-----------------|
| Digital PDF (has text layer) | Sent directly, text extracted server-side |
| Scanned PDF (no text) | Converted to images client-side, Vision API used |
| Mixed PDF (some pages scanned) | Converted to images to ensure all content captured |
| Multi-page PDF (5 pages) | All pages processed, progress shown |
| Large PDF (8MB) | Processed successfully |
| Oversized PDF (15MB) | Rejected with clear error |
| Corrupted PDF | Graceful error message |
| Network failure mid-upload | Retry option shown |

---

## Summary

This client-side conversion approach:

1. **Solves the core problem**: PDF-to-image conversion happens where it's actually possible (on device)
2. **Improves UX**: Users see progress and get immediate feedback
3. **Reduces server load**: Heavy processing happens on client
4. **Maintains flexibility**: Worker still handles text PDFs efficiently
5. **Is reliable**: No dependency on non-existent or unstable Worker packages

The trade-off is slightly more client-side code, but this is far more maintainable than fighting against fundamental platform limitations.