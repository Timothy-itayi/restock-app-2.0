# Backend Tests

Test suite for Restock backend workers and shared modules.

## Structure

Tests mirror the backend directory structure:

```
backend/
  tests/
    utils/          # Tests for shared utilities
    validation/     # Tests for validation schemas
    clients/        # Tests for API clients
    send-email/     # Tests for send-email worker
    parse-doc/      # Tests for parse-doc worker
    setup.ts        # Test configuration
```

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- handler.test.ts
```

## Test Framework

- **Vitest**: Modern test runner with TypeScript support
- **Miniflare**: Cloudflare Workers runtime for local testing (via Vitest)

## Coverage

Tests cover:

- ✅ CORS utilities
- ✅ Error handling
- ✅ Email formatting
- ✅ Text normalization
- ✅ Validation schemas (Zod)
- ✅ API clients (Resend, Groq)
- ✅ Worker handlers
- ✅ Error cases and edge cases

## Writing New Tests

1. Create test file in appropriate directory
2. Import functions/modules to test
3. Use Vitest's `describe` and `it` blocks
4. Mock external dependencies (fetch, API clients)
5. Test both success and error paths

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../shared/utils/myModule';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid');
    expect(result).toBe('expected');
  });

  it('should handle invalid input', () => {
    expect(() => myFunction('invalid')).toThrow();
  });
});
```

