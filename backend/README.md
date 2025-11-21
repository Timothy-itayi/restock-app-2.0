# Restock Backend

Modular backend implementation for Restock app, built on Cloudflare Workers.

## Structure

```
backend/
  shared/              # Shared modules used by all workers
    utils/             # CORS, errors, email formatting, normalization
    clients/           # Resend and Groq API wrappers
    validation/        # Zod schemas for request/response validation
    parsing/           # PDF extraction and LLM prompt building
  
  send-email/          # Email sending worker
    index.ts          # Entry point (routing, CORS)
    handler.ts        # Business logic
    wrangler.toml     # Worker configuration
  
  parse-doc/           # PDF parsing worker
    index.ts          # Entry point (file upload handling)
    handler.ts        # Parsing pipeline
    wrangler.toml     # Worker configuration
```

## Setup

### Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Install dependencies:
```bash
cd backend
npm install
```

### Configuration

#### Send Email Worker

1. Set Resend API key:
```bash
cd send-email
wrangler secret put RESEND_API_KEY
```

2. Update `wrangler.toml` with your email configuration:
```toml
[vars]
EMAIL_FROM_ADDRESS = "Restock App <noreply@restockapp.email>"
EMAIL_PROVIDER_URL = "https://api.resend.com/emails"
```

#### Parse Doc Worker

1. Set Groq API key:
```bash
cd parse-doc
wrangler secret put GROQ_API_KEY
```

2. (Optional) Create KV namespace for debug logs:
```bash
wrangler kv:namespace create "PARSE_DEBUG"
# Then add the namespace ID to wrangler.toml
```

## Development

### Local Development

```bash
# Send email worker
cd send-email
npm run dev

# Parse doc worker
cd parse-doc
npm run dev
```

### Deployment

```bash
# Deploy both workers
cd backend
npm run deploy:all

# Or deploy individually
npm run deploy:send-email
npm run deploy:parse-doc
```

## API Endpoints

### POST /send-email

Sends supplier order emails via Resend.

**Request:**
```json
{
  "to": "supplier@example.com",
  "replyTo": "sender@example.com",
  "subject": "Order Request",
  "body": "Please send the following items...",
  "items": [
    { "productName": "Product A", "quantity": 10 }
  ],
  "storeName": "My Store"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "resend_abc123"
}
```

### POST /parse-doc

Parses PDF documents and extracts structured product data.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (PDF or image file, max 10MB)

**Response:**
```json
{
  "items": [
    {
      "id": "parsed-1234567890-0",
      "supplier": "Supplier Name",
      "product": "Product Name",
      "quantity": 5
    }
  ]
}
```

## Implementation Notes

### PDF Text Extraction

The `shared/parsing/pdfExtract.ts` module currently returns `null` to trigger fallback to vision API. To implement actual PDF.js text extraction:

1. Add `pdfjs-dist` dependency (note: requires special setup for Cloudflare Workers)
2. Implement text extraction in `extractPdfText()`
3. Update `hasTextLayer()` to detect text layers

For now, all PDFs are processed via Groq vision API, which works for both text-based and scanned PDFs.

### Error Handling

All errors are sanitized to prevent stack trace leakage. Error responses follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### CORS

All endpoints support CORS with default configuration:
- Origin: `*` (configure per environment)
- Methods: `GET, POST, OPTIONS`
- Headers: `Content-Type, Authorization`

## Testing

See `docs/backend/backend_TODOS.md` for testing requirements and completion criteria.

## Architecture Decisions

- **Modular design**: Shared modules prevent code duplication and ensure consistency
- **Zod validation**: Type-safe request/response validation
- **Retry logic**: Resend client includes exponential backoff for transient failures
- **Hybrid parsing**: Attempts text extraction first, falls back to vision API
- **No state**: Workers are stateless; no database or persistent storage

