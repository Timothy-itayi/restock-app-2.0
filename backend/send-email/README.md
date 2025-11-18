# Send Email Serverless Function

## Purpose
Process outbound email safely without exposing API keys using Resend.

## Setup

1. Install dependencies:
```bash
npm install resend
```

2. Set environment variables:
```
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=your-verified-domain@yourdomain.com
```

3. Deploy to your serverless platform (Vercel, Netlify, AWS Lambda, etc.)

## API Specification

### Endpoint
`POST /send-email`

### Request Body
```json
{
  "to": "supplier@example.com",
  "replyTo": "sender@example.com",
  "subject": "Order Request",
  "text": "Email body text",
  "deviceId": "device-123456" // Optional, for rate limiting
}
```

### Response
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## Features

- ✅ Server-side email validation
- ✅ Rate limiting by device ID (10 emails per minute)
- ✅ Resend API integration
- ✅ Graceful error handling
- ✅ Invalid email format blocking

## Rate Limiting

- Maximum: 10 emails per minute per device
- Window: 60 seconds
- Returns `RATE_LIMIT_EXCEEDED` error if exceeded

## Error Codes

- `MISSING_FIELDS` - Required fields missing
- `INVALID_EMAIL` - Invalid supplier email format
- `INVALID_REPLY_TO` - Invalid reply-to email format
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `RESEND_ERROR` - Resend API error
- `INVALID_SUPPLIER_EMAIL` - Supplier email rejected by Resend
- `UNKNOWN_ERROR` - Unexpected error

