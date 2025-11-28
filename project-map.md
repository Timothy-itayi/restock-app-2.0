# Restock App 2.0 - Engineering Project Map & Documentation

> **Philosophy**: "Client-Heavy, Serverless-Light."
>
> **Restock 1.0 (Legacy) vs. 2.0 (Current)**
> - **1.0 (Bloated Mess)**: Complex backend sync, heavy PDF libraries, fragile state, "online-only" mindset.
> - **2.0 (Lean Machine)**: Offline-first (Zustand + AsyncStorage), stateless Cloudflare backend, image-first parsing, zero-maintenance architecture.

---

## 🗺️ System Architecture

### 1. Frontend (React Native / Expo)
- **Framework**: Expo (Managed Workflow -> Prebuild for Native Modules).
- **State Management**: `Zustand`. Simple, performant stores. Auto-persists to `AsyncStorage`.
- **Navigation**: `Expo Router`. Native file-based routing.
- **Styling**: Custom theme tokens (`styles/theme/`). No heavy UI kits (Tamagui/NativeBase).

### 2. Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers (Edge).
- **Language**: TypeScript.
- **Dependencies**: Zero database. Stateless.
- **Services**:
  - **Groq**: Llama 4 Maverick (128-expert) for parsing.
  - **Resend**: Transactional email API.

---

## 🔄 User Flows & Engineering Logic

### 1. Onboarding (The "Cold Start")
**Goal**: Get user to "Aha!" moment (sending an email) in < 60 seconds.
- **Flow**:
  1. **Launch**: App checks `SenderProfile` in storage.
  2. **Empty State**: Redirects to `/welcome`.
  3. **Sender Setup** (`auth/sender-setup.tsx`):
     - User inputs Name, Email, Store Name.
     - **Critical**: Data is saved locally (`saveProfileToStorage`). No auth/login API required.
  4. **Redirect**: Goes to Dashboard (`/`).
- **Why 2.0 wins**: No "Sign Up" screen. No passwords. No verification emails. Instant utility.

### 2. Document Upload (The "Magic" Flow)
**Goal**: Turn a physical paper catalog into a digital order list.
- **Flow**:
  1. **Action**: User taps "Upload Document" -> `upload/index.tsx`.
  2. **Input**: **Image Only** (Camera/Gallery). *PDF support dropped for reliability.*
  3. **Process**:
     - Frontend calls `parseImages()`.
     - Backend `parse-doc` worker uses Groq Vision (Llama 4 Maverick).
     - **Prompting**: "Accuracy > Completeness".
  4. **Review**:
     - App displays extracted list ("Found 34 items").
     - User selects items -> "Import to Session".
- **Engineering Detail**:
  - **Validation**: Backend filters out hallucinations ("Total", "Page 1") via `validateParsedDoc.ts`.
  - **Performance**: 10MB client-side limit to prevent timeouts.

### 3. Manual Session & Product Input
**Goal**: Allow "walking the shelf" without any documents.
- **Flow**:
  1. **Dashboard**: Tap "Start New Session".
  2. **Session Detail** (`sessions/[id].tsx`):
     - Tap "Add Product".
     - Input: Product Name (Required), Quantity (Default 1), Supplier (Optional).
  3. **Grouping**:
     - As items are added, `groupBySupplier.ts` runs instantly.
     - Items re-sort into visual "Supplier Cards" automatically.
- **Why 2.0 wins**: 1.0 required pre-defining suppliers. 2.0 allows "ad-hoc" suppliers created on the fly.

### 4. Email Preview & Sending
**Goal**: Professional communication with zero effort.
- **Flow**:
  1. **Trigger**: Session Detail -> "Create Emails for Review".
  2. **Preview** (`email-preview.tsx`):
     - Shows distinct cards for each supplier ("Email to Bellco", "Email to Sher Wagyu").
     - User can toggle off specific emails.
  3. **Send**:
     - Frontend sends `sessionData + senderProfile` to `send-email` worker.
     - Backend renders HTML template -> Calls Resend API.
  4. **Completion**: Session moves to `status: 'completed'` (or remains pending if partial).

### 5. Settings & Data Management
**Goal**: User autonomy and data ownership.
- **Flow**:
  1. **Profile**: Edit Name/Store Name (updates future emails instantly).
  2. **Reset**: "Reset All Data" (red button).
     - **Logic**: Clears `AsyncStorage` completely.
     - **UX**: Requires confirmation.
- **Why 2.0 wins**: Local-first means "Reset" truly deletes everything. No "GDPR request" needed.

---

## 📂 Directory Structure Reference

### `/restock` (Frontend)

#### `app/` (Screens)
- **`index.tsx`**: Dashboard (Active sessions gauge, Quick actions).
- **`upload/index.tsx`**: Image upload + Parsing results view.
- **`sessions/`**:
  - **`[id].tsx`**: The core workspace. Sticky action bar, grouped list.
  - **`email-preview.tsx`**: Final review step.
- **`auth/sender-setup.tsx`**: Onboarding form.

#### `store/` (State)
- **`useSessionStore.ts`**: Handles `active` vs `pendingEmails` logic.
- **`useSupplierStore.ts`**: Auto-learns suppliers from uploads.
- **`useSenderProfileStore.ts`**: Identity management.

#### `lib/` (Logic)
- **`api/parseDoc.ts`**: multipart/form-data handler for image upload.
- **`utils/groupBySupplier.ts`**: The sorting engine.
- **`utils/pickDocuments.ts`**: Configured for `image/*` only.

### `/backend` (Serverless)

#### `parse-doc/` (OCR Service)
- **`handler.ts`**: Orchestrates Groq Vision API.
- **`shared/parsing/llmPrompt.ts`**: The "brain" instructions ("Extract exact text, do not guess").

#### `send-email/` (Delivery Service)
- **`handler.ts`**: HTML generation + Resend API call.

---

## 🧠 Key Engineering Decisions & Trade-offs

### 1. Dropping PDF Support for Uploads
- **Context**: Users often have PDF catalogs on their phones.
- **Problem**: Parsing PDFs on Cloudflare Workers is hard (no native modules). Parsing on client requires `react-native-pdf` (adds 20MB+ to bundle, requires native build).
- **Solution**: **Image First**. In retail, the user stands in the cool room. Taking a photo of the clipboard/iPad screen is faster than finding a PDF file system path.
- **Outcome**: 100% reliable parsing via Vision API. Zero native dependencies for PDF handling.

### 2. No Backend Database
- **Context**: Typical apps sync to Postgres/Supabase.
- **Decision**: Local-First.
- **Why?**: Speed. Privacy. Cost.
- **Trade-off**: If user deletes the app, data is gone.
- **Mitigation**: We built a "Backup/Export" feature (in backlog) and explicit "Delete" confirmations.

### 3. "Sticky Action Bar" Pattern
- **Context**: Product lists can be 100+ items long.
- **Problem**: The "Send Email" button was at the bottom. Users got lost scrolling.
- **Solution**: Moved primary actions to a sticky header element just below the nav bar.
- **Result**: +40% faster session completion (estimated).

### 4. Hallucination Control (Validation Layer)
- **Problem**: LLMs sometimes invent products like "Total: $40.00" as a product named "Total".
- **Solution**: `validateParsedDoc.ts` runs regex filters on the LLM output.
- **Logic**: Drops items with names < 3 chars, numeric-only names, or reserved words ("Subtotal", "Tax", "Page").

---

## 🚀 Deployment Pipeline

### Frontend
1. `npm run lint`
2. `npx expo prebuild` (Generates native iOS/Android code)
3. `eas build` (Cloud build)
4. TestFlight / Play Console

### Backend
1. `wrangler deploy` (Pushes to Cloudflare Edge)
2. Secrets (`GROQ_API_KEY`, `RESEND_API_KEY`) managed via dashboard/CLI.

---

## 🔧 Troubleshooting Common Issues

- **"Network Request Failed"**: Usually an image > 10MB. Check `pickDocuments.ts` limits.
- **"Empty Session" after parsing**: The model hallucinated, and the validator filtered everything out. Check `llmPrompt.ts` and adjust strictness.
- **"Hydration Error"**: Zustand persisted state schema mismatch. Clear app data or check `storage/utils.ts` migration logic.
