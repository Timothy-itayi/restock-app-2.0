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

### Moderate Priority

1. **✅ Sessions Dashboard Enhancements** - COMPLETE
   - **Status**: ✅ Active sessions gauge added. ✅ Quick actions available.

2. **✅ Onboarding & Welcome UX** - COMPLETE
   - **Work**: ✅ Full-screen immersive images. ✅ Modern text overlays. ✅ Smooth transition to Setup.
   - **Status**: ✅ Completed.

3. **Settings → “Reset All Data” Confirmation Flow**
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

### Moderate Priority

1. **Error Telemetry + Logging Pipeline**
   - **Status**: ⚠️ Basic console logging implemented.

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
