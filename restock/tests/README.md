# Test Directory Structure

This directory contains all tests organized by feature/module, matching the source code structure.

## Structure

```
tests/
├── sessions/              # Session-related tests
│   ├── index.test.ts      # Sessions list screen
│   ├── [id].test.ts       # Session detail screen
│   ├── add-product.test.ts
│   ├── edit-product.test.ts
│   ├── email-preview.test.ts
│   ├── review.test.ts
│   ├── sessionStore.test.ts      # Zustand store tests
│   └── sessionStorage.test.ts    # Storage helper tests
├── suppliers/             # Supplier-related tests
│   ├── index.test.ts      # Suppliers screen
│   └── supplierStore.test.ts
├── auth/                  # Authentication/profile tests
│   ├── sender-setup.test.ts
│   ├── senderProfileStore.test.ts
│   └── senderStorage.test.ts
├── settings/              # Settings screen tests
│   └── index.test.ts
├── upload/                # Upload screen tests
│   └── index.test.ts
├── welcome/               # Welcome screen tests
│   └── welcome.test.ts
├── dashboard/             # Dashboard screen tests
│   └── index.test.ts
├── stores/                # Store tests (non-session/supplier)
│   ├── useProductsStore.test.ts
│   └── useThemeStore.test.ts
├── storage/               # Storage utility tests
│   └── utils.test.ts      # Versioned storage utils
├── utils/                 # Utility function tests
│   ├── groupBySupplier.test.ts
│   ├── normalise.test.ts
│   ├── deviceId.test.ts
│   └── pickDocuments.test.ts
├── hooks/                 # React hook tests
│   └── useCrossStoreValidation.test.ts
├── api/                   # API function tests
│   ├── parseDoc.test.ts
│   └── sendEmail.test.ts
└── components/            # Component tests
    └── emails/
        ├── EmailCard.test.ts
        └── EmailEditModal.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Organization Rules

1. **Screens**: Tests in feature directories (e.g., `sessions/`, `suppliers/`)
2. **Stores**: Tests in feature directories with `*Store.test.ts` naming
3. **Storage**: Tests in feature directories with `*Storage.test.ts` naming
4. **Utils/Hooks/API**: Tests in dedicated directories matching source structure
5. **Components**: Tests mirror component directory structure

Each test file should:
- Test all public functions/methods
- Cover edge cases and error scenarios
- Use descriptive test names
- Mock external dependencies (AsyncStorage, API calls, etc.)
