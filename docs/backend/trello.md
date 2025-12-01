# Trello Board – Restock MVP Execution

Context references: `README.md` (MVP scope), `restcok-app.md` (category + comps), `ux-ui.md` (branding + layout). The board is split by client vs server/serverless work, and each lane is prioritized (High → Moderate → Low). Dependencies that block downstream lists are called out explicitly so the workflow stays aligned with the simple, offline-first MVP.

---

## CLIENT-SIDE CODE

### High Priority

1. **✅ Stabilize Zustand Stores (Sessions, Suppliers, Products, Sender Profile)** - COMPLETE
   - **Why**: README stresses fully local state; persistence logic solidified.
   - **Work**: ✅ `useSenderProfileStore` updated to persist to AsyncStorage on save. ✅ `sender-setup.tsx` now saves to storage.
   - **Status**: ✅ Completed.

2. **✅ Group Items by Supplier in All Session Flows** - COMPLETE
   - **Why**: Essential for email workflow.
   - **Work**: ✅ `groupBySupplier.ts` implemented and used in `[id].tsx` and `email-preview.tsx`.
   - **Status**: ✅ Completed.

3. **✅ Client Error Handling + Toast UX** - COMPLETE
   - **Why**: Retail staff need immediate, friendly feedback (per UX spec).
   - **Work**: ✅ `useToast` hook implemented. ✅ Integrated into Email Preview for success/error states.
   - **Status**: ✅ Completed.

4. **✅ Finalize Sender Profile Screen (UI polish + validation)** - COMPLETE
   - **Why**: Store identity powers email subjects.
   - **Work**: ✅ Validation added. ✅ Persistence fixed. ✅ UI polished (Back button outside scroll, centered layout).
   - **Status**: ✅ Completed.

5. **✅ Backend API URLs Verified** - COMPLETE
   - **Why**: Workers.dev URLs must match deployed endpoints.
   - **Work**: Verified URLs in `lib/api/parseDoc.ts` and `lib/api/sendEmail.ts` match Cloudflare dashboard.
   - **URLs**:
     - `https://restock-parse-doc.parse-doc.workers.dev`
     - `https://restock-send-email.parse-doc.workers.dev`
   - **Status**: ✅ Verified correct.

### Moderate Priority

1. **✅ Sessions Dashboard Enhancements** - COMPLETE
   - **Status**: ✅ Active sessions gauge added. ✅ Quick actions available.

2. **✅ Onboarding & Welcome UX** - COMPLETE
   - **Work**: ✅ Full-screen immersive images. ✅ Modern text overlays. ✅ Smooth transition to Setup.
   - **Status**: ✅ Completed.

3. **Settings → "Reset All Data" Confirmation Flow**
   - **Status**: ✅ Basic reset flow implemented in Settings.

4. **Unit Tests for Stores + Hooks**
   - **Status**: ⚠️ Pending (Next Step).

### Low Priority

1. **Color Audit + Theme Tokens**
   - **Status**: ⚠️ Ongoing.
2. **Microcopy Polish**
   - **Status**: ⚠️ Ongoing.

---

## SERVER / SERVERLESS WORK (Cloudflare Workers + Resend + Groq)

### High Priority

1. **✅ Define Cloudflare Worker for `/send-email`** - COMPLETE
   - **Status**: ✅ Deployed and ready.
   - **Update**: ✅ Added HTML branding (Logo, Banner) and professional Table layout.

2. **✅ Cloudflare Worker for `/parse-doc` backed by Groq LLM** - COMPLETE
   - **Why**: Document parsing is the core magic.
   - **Work**:
     - ✅ Switched to **Llama 4 Maverick** (128 experts) for superior accuracy.
     - ✅ Implemented **image-only workflow** (removed flaky PDF conversion).
     - ✅ Refined prompts for strict JSON extraction without hallucinations.
     - ✅ Added validation to filter metadata/garbage.
   - **Status**: ✅ Deployed and working.

3. **✅ Shared Storage Utils** - COMPLETE
   - **Status**: ✅ Complete.

4. **✅ CI/CD for Workers (Testing + Deploy Scripts)** - COMPLETE
   - **Status**: ✅ Complete.

5. **✅ Production Deployment Verification** - COMPLETE
   - **Why**: Workers must be deployed with secrets before TestFlight.
   - **Work**:
     - [x] Deploy `parse-doc` worker → `https://restock-parse-doc.parse-doc.workers.dev`
     - [x] Set parse-doc secret: `GROQ_API_KEY` (encrypted)
     - [x] Deploy `send-email` worker → `https://restock-send-email.parse-doc.workers.dev`
     - [x] Set send-email secret: `RESEND_API_KEY` (encrypted)
     - [x] Verified client API URLs match deployed endpoints
     - [ ] Smoke test both endpoints from curl/Postman (recommended before TestFlight)
   - **Status**: ✅ Deployed and configured. Smoke test recommended.

### Moderate Priority

1. **Error Telemetry + Logging Pipeline**
   - **Status**: ⚠️ Basic console logging implemented.

---

## TESTFLIGHT / EAS BUILD READINESS

### High Priority

1. **✅ Create app.json for EAS** - COMPLETE
   - **Work**: Full Expo config with bundleIdentifier, icon, splash, plugins.
   - **Status**: ✅ Created.

2. **✅ Create eas.json build profiles** - COMPLETE
   - **Work**: development (simulator), preview (internal), production (store) profiles.
   - **Status**: ✅ Created.

3. **✅ EAS Project Setup** - COMPLETE
   - **Work**:
     - [x] Run `npx eas-cli login` (authenticate with Expo)
     - [x] Run `npx eas-cli init` (links project, gets projectId)
     - [x] Update `app.json` extra.eas.projectId with actual ID (`855519b7-bda3-4211-ba09-dea4d811f30a`)
     - [x] Run `npx eas-cli build:configure` (optional, validates setup)
   - **Status**: ✅ Completed.

4. **✅ Apple Developer Account Setup** - COMPLETE
   - **Work**:
     - [x] Verify Apple Developer Program membership is active
     - [x] Create App ID in Apple Developer portal (if not auto-created by EAS)
     - [x] Update `eas.json` submit section with appleId, ascAppId, appleTeamId
   - **Status**: ✅ Completed.

5. **🟡 TestFlight Build** - IN PROGRESS
   - **Work**:
     - [x] Run `npx expo prebuild` (regenerate native projects)
     - [ ] Run `npx eas-cli build --platform ios --profile production`
     - [ ] Submit to TestFlight: `npx eas-cli submit --platform ios`
     - [ ] Add internal testers in App Store Connect
   - **Status**: ⚠️ Prebuild running, TestFlight build next.

6. **🟡 UI Polish: Oh Cypress Theme** - IN PROGRESS
   - **Work**:
     - [x] Create `docs/theme.md` with design system documentation
     - [ ] Add `cypress` token group to color files
     - [ ] Update supplier headers to use deep olive
     - [ ] Update empty states to use pale/frost tones
     - [ ] Audit all screens for consistent token usage
   - **Status**: ⚠️ Theme documented, implementation pending.

---

## CROSS-CUTTING / POLISH

### UI Polish & Color Correct

1. **✅ Session Details UX** - COMPLETE
   - **Work**: ✅ Sticky action bar. ✅ Indented supplier grouping with color-coded headers (`[ SUPPLIER ]`).
   - **Status**: ✅ Complete.

2. **✅ Upload Flow UX** - COMPLETE
   - **Work**: ✅ Image-only flow. ✅ "Found X items" summary. ✅ Selection UI improved.
   - **Status**: ✅ Complete.

3. **✅ Navigation Resilience** - COMPLETE
   - **Work**: ✅ Fixed "Zombie Back Button" issues. Deleting/Completing a session now clears the stack and routes to Dashboard.
   - **Status**: ✅ Complete.

### Testing & Build

1. **End-to-End Smoke (Expo EAS Build pipeline)**
   - **Status**: ⚠️ Next step.

2. **Device Matrix QA**
   - **Status**: ⚠️ Next step.

---

## 🛑 PIVOTS & DECISIONS LOG

### 1. PDF to Image Conversion
- **Initial Plan**: Convert PDF pages to images on client using `react-native-pdf` + `view-shot`.
- **Reality**: Native module linking issues in managed workflow + unreliable rendering of large catalogs.
- **Pivot**: Drop PDF support entirely. Support **Images Only**.
- **Why**: Faster, reliable, matches user behavior (taking photos of clipboards).

### 2. LLM Model Selection
- **Initial Plan**: Llama 3.2 Vision (Scout).
- **Reality**: Hallucinated products ("Pesto & Garlic") that didn't exist.
- **Pivot**: Upgraded to **Llama 4 Maverick**.
- **Why**: 128-expert model provides the precision needed for dense inventory lists.

### 3. Navigation Architecture
- **Initial Plan**: Standard `router.push` / `router.back`.
- **Reality**: Deleting a session left the user in a state where "Back" went to the deleted session.
- **Fix**: Implemented `router.dismissAll()` + `router.replace('/')` for "destructive" or "completing" actions to ensure a clean stack.

---

## 🔧 BACKEND PRODUCTION SETUP

### Wrangler Configuration
Both workers are configured correctly. No changes needed to `wrangler.toml` files for production.

**parse-doc/wrangler.toml:**
- Name: `restock-parse-doc`
- Compatibility flags: `nodejs_compat` (required for PDF/image processing)
- Secrets: `GROQ_API_KEY` (set via `wrangler secret put`)

**send-email/wrangler.toml:**
- Name: `restock-send-email`
- Vars: `EMAIL_FROM_ADDRESS`, `EMAIL_PROVIDER_URL` (non-sensitive, in toml)
- Secrets: `RESEND_API_KEY` (set via `wrangler secret put`)

### Deployment Checklist
```bash
# 1. Deploy parse-doc
cd backend/parse-doc
wrangler deploy
# Note the URL: https://restock-parse-doc.<subdomain>.workers.dev

# 2. Set GROQ secret
wrangler secret put GROQ_API_KEY
# Paste your Groq API key when prompted

# 3. Deploy send-email
cd ../send-email
wrangler deploy
# Note the URL: https://restock-send-email.<subdomain>.workers.dev

# 4. Set RESEND secret
wrangler secret put RESEND_API_KEY
# Paste your Resend API key when prompted

# 5. Smoke test
curl -X POST https://restock-parse-doc.<subdomain>.workers.dev \
  -F "type=images" \
  -F "images=@test-image.jpg"

curl -X POST https://restock-send-email.<subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","replyTo":"you@example.com","subject":"Test","text":"Hello"}'
```

### URL Configuration
After deployment, update the client files:
- `restock/lib/api/parseDoc.ts` line 22
- `restock/lib/api/sendEmail.ts` line 75

Replace the placeholder URLs with actual deployed worker URLs.
