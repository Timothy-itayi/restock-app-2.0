# Trello Board – Restock MVP Execution

Context references: `README.md` (MVP scope), `restcok-app.md` (category + comps), `ux-ui.md` (branding + layout). The board is split by client vs server/serverless work, and each lane is prioritized (High → Moderate → Low). Dependencies that block downstream lists are called out explicitly so the workflow stays aligned with the simple, offline-first MVP.

---

## CLIENT-SIDE CODE

### High Priority

1. **Stabilize Zustand Stores (Sessions, Suppliers, Products, Sender Profile)**
   - **Why**: README stresses fully local state; current stores still surface hydration issues (“suppliers.find is not a function”) and lack consistent typing.
   - **Work**: Audit `restock/store/*Store.ts` for init defaults, immer-safe mutations, and AsyncStorage persistence promises with try/catch + telemetry.
   - **Dependencies**: Needed before supplier grouping + serverless payloads consume store snapshots.
   - **Acceptance**: App launch with empty AsyncStorage no longer throws; each store exposes `isHydrated` flag and rejects invalid payloads gracefully.

2. **Group Items by Supplier in All Session Flows**
   - **Why**: README + real-world workflow (“walk → log → email suppliers”) require products to be bucketed per supplier for accurate emails.
   - **Work**: Centralize grouping utility (e.g., `lib/groupBySupplier.ts`) used by session detail, email preview, repeat session, and analytics.
   - **Dependencies**: Requires stabilized stores so every `SessionItem` references supplierId/name.
   - **Acceptance**: Pending session with mixed supplier data renders consistent grouped cards; editing a supplier updates all related groupings automatically.

3. **Client Error Handling + Toast UX**
   - **Why**: Retail staff need immediate, friendly feedback (per UX spec) when network/AsyncStorage operations fail.
   - **Work**: Implement shared `useErrorToast` hook + boundary components for session actions, supplier CRUD, and profile save; ensure try/catch surfaces actionable copy.
   - **Dependencies**: Blocks server-side integration testing—cannot ship without resilient UX.
   - **Acceptance**: Simulated storage failure produces inline warning + undo prompt without crashing.

4. **Finalize Sender Profile Screen (UI polish + validation)**
   - **Why**: Store identity powers email subjects (“Restock order from {store}”); missing or invalid fields block downstream flows.
   - **Work**: Apply `ux-ui.md` spacing + color rules, enforce store name requirement, add “editing” affordances, ensure scroll behavior matches new layout.
   - **Dependencies**: Required before hooking up serverless email body templates.
   - **Acceptance**: Screen passes design audit screenshots; validation prevents saving without store name/email; keyboard dismissal works on iOS/Android.

### Moderate Priority

1. **Sessions Dashboard Enhancements**
   - Add “pendingEmails” badge logic, session summaries, and quick actions using calm card style (Shopify POS inspiration).
   - Depends on supplier grouping + store hydration.

2. **Supplier Autocomplete UX**
   - Build reusable component for add/edit screens with throttled search, top 5 suggestions, and error states.
   - Needs `useSupplierStore` to expose derived selectors.

3. **Settings → “Reset All Data” Confirmation Flow**
   - Multi-step confirmation (modal + “type RESET” pattern) to avoid accidental wipes.
   - Relies on `AsyncStorage.clear` helper from storage utils (see serverless section).

4. **Unit Tests for Stores + Hooks**
   - Using Jest + React Native Testing Library to cover grouping utils, store mutations, and email draft generation.

### Low Priority

1. **Color Audit + Theme Tokens**
   - Align hex values with `ux-ui.md` (muted forest palette) and ensure dark-mode readiness via `AppColors`.
2. **Microcopy Polish**
   - Update button/empty-state copy with real-world terminology (“Send purchase orders”, “Log shelf items”).
3. **Accessories (Illustrations / decorative assets)**
   - Optional minimal icons following “calm enterprise” vibe; lowest priority until core flows lock.

---

## SERVER / SERVERLESS WORK (Cloudflare Workers + Resend + Groq)

### High Priority

1. **✅ Define Cloudflare Worker for `/send-email`** - COMPLETE
   - **Why**: README limits backend to two endpoints; this worker must orchestrate Resend (SMTP alternative) with brand-safe templates.
   - **Work**: ✅ Created `send-email/index.ts` and `send-email/handler.ts` with schema validation (Zod), supplier payload signature, retry + logging, Resend API integration, secrets via Cloudflare Workers.
   - **Dependencies**: ✅ Client passes grouped supplier payload and sender profile data.
   - **Acceptance**: ✅ Email service working in local dev; API keys deployed as secrets; worker deployed.
   - **Status**: ✅ Deployed and tested locally. Ready for TestFlight testing.

2. **⚠️ Cloudflare Worker for `/parse-doc` backed by Groq LLM** - MOSTLY COMPLETE
   - **Why**: Document parsing is one of only two server calls (per README).
   - **Work**: ✅ Streaming upload handler → Groq API call for structured items → sanitization of supplier + product fields. ⚠️ PDF text extraction implemented, but scanned PDF fallback needs improvement.
   - **Dependencies**: ✅ Client upload flow ready.
   - **Acceptance**: ✅ Text-based PDFs return structured `ParsedItem[]`; ⚠️ Scanned PDFs need better fallback handling (Groq vision API doesn't accept PDFs directly).
   - **Status**: ✅ Deployed with API keys. Text extraction works. Scanned PDF fallback added but may need PDF-to-image conversion for full support.

3. **✅ Shared Storage Utils** - COMPLETE
   - ✅ Storage handled client-side via AsyncStorage in Zustand stores.
   - ✅ Backend is stateless (no storage needed per architecture).

4. **✅ CI/CD for Workers (Testing + Deploy Scripts)** - COMPLETE
   - ✅ `wrangler.toml` configured for both workers.
   - ✅ Manual deployment via `wrangler deploy` working.
   - ✅ API keys deployed as secrets via `wrangler secret put`.
   - ⚠️ Automated CI/CD (Github Actions) can be added later if needed.

### Moderate Priority

1. **Error Telemetry + Logging Pipeline**
   - Cloudflare workers push structured logs to Logpush or Supabase edge logging; client logs persisted locally for support bundles.
2. **Rate Limiting / Abuse Protection**
   - Minimal middleware (per IP + per sender email) to avoid Resend abuse.
3. **Integration Tests**
   - Use Vitest or Miniflare to mock worker environment; ensures Resend + Groq requests are formed correctly.

### Low Priority

1. **Background Job Stubs**
   - Optional future tasks (e.g., email send status polling). Document but defer until MVP validated.
2. **Analytics Collection**
   - Resist adding until MVP stable; placeholder event schema documented for later.

---

## CROSS-CUTTING / POLISH

### UI Polish & Color Correct

1. **Board-Wide Color QA**
   - Audit every screen to ensure `AppColors` tokens match the “forest green / calm neutral” spec; remove stray hex codes.
2. **Component Library Snapshot**
   - Capture Figma-like spec inside repo (`docs/ui-components.md`) referencing Notion/Shopify inspiration for cards, modals, and buttons.

### Testing & Build

1. **End-to-End Smoke (Expo EAS Build pipeline)**
   - Ensure `npx expo prebuild` + EAS build succeed; document manual test plan (start session → send mock email).
2. **Device Matrix QA**
   - Real-world scenario: staff using iPhone 11 vs iPhone 15; confirm ScrollViews, modals, inputs behave identically.

---

## DEPENDENCY MAP (Sample Trello Labels)

- `Client Blocker`: “Cloudflare send-email worker cannot ship until supplier grouping utility is live.”
- `Server Blocker`: “Groq parser needs consistent product schema from client upload review screen.”
- `UI Polish` depends on “Color Audit” completing before final screenshots in README.
- `Testing / Expo Build` is last-mile, gated on both client + server tasks closing.

---

### Real-World Usage Anchors (add to Trello card descriptions)

- “During a Saturday walk-through, Tim (store manager) needs to recover from a failed supplier save without losing the session.”
- “When emailing Gum Tree Foods, subject must read ‘Restock order from Gum Tree Good Food’ automatically.”
- “Uploading the weekly PDF from Marketman parser should return grouped items in under 15s, even on flaky Wi-Fi.”

Use these scenarios to keep every card scoped to MVP reality, not speculative features. The board above can be transcribed directly into Trello lists (Client High/Moderate/Low, Server High/Moderate/Low, Cross-Cutting) with labels for dependencies and owners. Once populated, link each card back to file paths (`restock/app/...`, `workers/...`) to keep contributors aligned. 

