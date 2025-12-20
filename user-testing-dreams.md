# User Testing Dreams — Future Feature Requests

> **Status**: 🎯 **Aspirational / Backlog**  
> **Date**: December 2025  
> **Context**: User testing feedback from MVP beta testers

This document captures feature requests and "dreams" from user testing sessions. These represent **significant architectural shifts** from the current MVP scope. Each feature requires careful engineering analysis before implementation.

---

## 🏪 Feature 1: Multi-Store Cross-Referencing

### User Request
> "A manager at GTKB (Gumtree Kitchen - Brighton branch) wants to cross-reference the order list with the Albert Park branch. Since Gumtree is the brand company, it has branches around Melbourne. We want to change the layout to cycle through multiple stores of the same brand."

### Current State
- **MVP**: Single-store, single-user. No concept of "Brand" or "Store" hierarchy.
- **Data Model**: `Session` has no `storeId` or `brandId` fields.
- **Storage**: All data is local-only (`AsyncStorage`).

### Engineering Challenges

#### 1. Data Model Expansion
**Required Changes**:
```typescript
// Current
type Session = {
  id: string;
  createdAt: number;
  status: 'active' | 'completed' | 'cancelled' | 'pendingEmails';
  items: SessionItem[];
};

// Needed
type Brand = {
  id: string;
  name: string; // "Gumtree Kitchen"
  stores: Store[];
};

type Store = {
  id: string;
  brandId: string;
  name: string; // "Brighton", "Albert Park"
  address?: string;
};

type Session = {
  id: string;
  storeId: string; // NEW
  brandId: string; // NEW
  createdAt: number;
  status: 'active' | 'completed' | 'cancelled' | 'pendingEmails';
  items: SessionItem[];
};
```

#### 2. Data Isolation & Access Control
- **Problem**: How does a Brighton manager "see" Albert Park's orders?
- **Options**:
  - **Option A**: All stores under same brand share data (no isolation)
  - **Option B**: Store-level permissions (manager can only see their store + "shared" sessions)
  - **Option C**: Brand-level admin can see all stores

#### 3. Storage Architecture
- **Current**: `AsyncStorage` is device-local. Cannot share data across devices.
- **Required**: 
  - **Cloud Database** (Supabase/Postgres) for multi-device access
  - **Sync Engine** to keep local cache in sync
  - **Offline Support** becomes more complex (conflict resolution)

#### 4. UI/UX Changes
- **Store Selector**: Dropdown/picker to switch between stores
- **Cross-Reference View**: Side-by-side comparison of orders from different stores
- **Brand Dashboard**: Aggregate view across all stores in a brand

### Implementation Complexity
- **Effort**: 🔴 **High** (6-8 weeks)
- **Breaking Changes**: Yes — requires migration of existing sessions
- **Infrastructure**: Requires database + auth + sync layer

### Recommendation
**Don't hack this with local storage.** This is a **multi-tenant** feature that requires:
1. Backend database (Supabase recommended)
2. Brand/Store data model
3. Permission system (who can see which stores)
4. Sync engine for offline support

**Alternative MVP**: Start with "Store Selector" UI that filters local sessions by a `storeId` field. This allows single-user, multi-store workflows without cloud sync. Add cross-device sync later.

---

## 👥 Feature 2: Real-Time Multi-User Collaboration

### User Request
> "Implement multiple users to interact with the app at the same time, similar to Figma or Canva on the same server. The idea is that the manager and owner can both check the order list before sending. Managers create a session list, and the owner can add emails. We should track changes and who made them. This might require an actual auth implementation, but we'll see."

### Current State
- **MVP**: Single-user, local-only. No concept of "users" or "collaboration."
- **State Management**: Zustand + AsyncStorage (device-local only).
- **No Conflict Resolution**: Last write wins (implicit, since only one user).

### Engineering Challenges

#### 1. Real-Time Sync Architecture
**Current**: Stateless Cloudflare Workers (cannot maintain WebSocket connections).

**Required**:
- **Option A**: Cloudflare Durable Objects (stateful Workers)
  - Pros: Stays in Cloudflare ecosystem
  - Cons: Complex, requires WebSocket handling, limited ecosystem
- **Option B**: Supabase Realtime (Postgres + WebSocket layer)
  - Pros: Battle-tested, handles presence, subscriptions, conflict resolution
  - Cons: Requires moving off Workers for stateful operations
- **Option C**: Custom WebSocket server (Node.js/Deno)
  - Pros: Full control
  - Cons: Infrastructure overhead, scaling complexity

#### 2. Conflict Resolution
**Problem**: Two users edit the same item simultaneously. Who wins?

**Strategies**:
- **Last Write Wins**: Simple but loses data
- **Operational Transform (OT)**: Complex, requires careful implementation
- **CRDTs (Conflict-Free Replicated Data Types)**: Best for offline-first, but heavy
- **Locking**: Prevent simultaneous edits (bad UX)

**Recommendation**: Start with **optimistic locking** (show conflicts, let user resolve) or **event sourcing** (track all changes, replay to resolve).

#### 3. Authentication & Authorization
**Current**: No auth. Profile is just local data.

**Required**:
- **User Accounts**: Email/password or OAuth (Google/Apple)
- **Session Sharing**: How do users "join" a session?
  - Share link? (security risk)
  - Invite by email? (requires email verification)
  - QR code? (device proximity)
- **Permissions**: 
  - Manager: Can create/edit sessions
  - Owner: Can add emails, approve sending
  - Viewer: Read-only access

**Recommendation**: Use **Supabase Auth** or **Clerk** for auth. Both handle email verification, password reset, and session management.

#### 4. Change Tracking & Audit Log
**Required Data Model**:
```typescript
type SessionChange = {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  timestamp: number;
  action: 'create' | 'update' | 'delete' | 'add_item' | 'remove_item';
  itemId?: string;
  oldValue?: any;
  newValue?: any;
};

type Session = {
  id: string;
  createdAt: number;
  createdBy: string; // userId
  collaborators: string[]; // userIds
  changes: SessionChange[]; // Audit log
  // ... rest
};
```

**UI Requirements**:
- "Who's viewing" indicator (presence)
- Change history sidebar
- "Last edited by X at Y" timestamps
- Conflict warnings when editing

#### 5. Offline-First + Real-Time = Hard
**Problem**: How do you sync when users go offline?

**Solution**: 
- **Optimistic Updates**: Apply changes locally immediately
- **Queue for Sync**: Store pending changes when offline
- **Conflict Resolution**: When back online, merge or show conflicts
- **CRDTs**: Best long-term solution, but requires significant refactoring

### Implementation Complexity
- **Effort**: 🔴 **Very High** (10-12 weeks)
- **Breaking Changes**: Yes — entire state management layer needs refactor
- **Infrastructure**: Requires database + auth + real-time sync + WebSocket server

### Recommendation
**This is a complete architectural pivot.** The MVP is "local-first, single-user." This feature requires "cloud-first, multi-user."

**Phased Approach**:
1. **Phase 1**: Add auth + database (Supabase). Sessions stored in cloud, but still single-user per session.
2. **Phase 2**: Add "Share Session" link. Owner can invite manager via email. Manager gets read-only access.
3. **Phase 3**: Add real-time sync. Both users can edit, with conflict resolution.
4. **Phase 4**: Add change tracking and audit log.

**Don't try to build this on Cloudflare Workers alone.** You need a stateful backend (Supabase, Firebase, or custom Node.js server).

---

## 🔍 Feature 3: Improved OCR Accuracy (Tesseract vs. LLM)

### User Request
> "The doc parse is missing some things at the moment. I was recommended a module called Tesseract Python for reading and parsing image files. We can use the Groq LLM to help with learning user habits instead of doing the heavy lifting. I believe Tesseract Python uses a worker to do the job, so it might work with our backend architecture using Wrangler."

### Current State
- **MVP**: Uses Groq Vision API (Llama 4 Scout 17B) for OCR
- **Accuracy**: ~90-95% on clear printed documents
- **Issues**: Missing some items, especially in complex layouts or poor image quality

### Engineering Analysis

#### 1. Tesseract Python on Cloudflare Workers
**The Reality Check**:
- **Tesseract is C++**: Requires native compilation, OS-level dependencies
- **Python Wrapper**: `pytesseract` is a Python wrapper around the C++ binary
- **Cloudflare Workers**: Run JavaScript/WASM only. **Cannot run Python or C++ binaries.**
- **WASM Port**: There is `tesseract.js` (WASM), but:
  - **Size**: ~5MB+ bundle (huge for Workers)
  - **Performance**: Slower than native Tesseract
  - **Memory**: High memory usage (Workers have 128MB limit)
  - **Accuracy**: Often worse than modern Vision LLMs

**Verdict**: ❌ **Tesseract will NOT work on Cloudflare Workers.**

#### 2. Why Is the LLM Missing Items?
**Possible Causes**:
1. **Image Quality**: Blurry, low-resolution, poor lighting
2. **Prompt Issues**: LLM prompt not handling edge cases
3. **Layout Complexity**: Multi-column, tables, handwritten annotations
4. **Token Limits**: Large images may be truncated
5. **Model Limitations**: Llama 4 Scout may not be the best for dense text

**Diagnosis Steps**:
- Log failed extractions with image samples
- Analyze which items are consistently missed
- Test with different image resolutions/preprocessing
- Try different Vision models (GPT-4 Vision, Claude Vision)

#### 3. Hybrid Approach: Tesseract + LLM
**Concept**: Use Tesseract for raw OCR, LLM for structured extraction.

**Architecture**:
```
Image → Tesseract (raw text) → LLM (structured JSON)
```

**Problems**:
- **Where to run Tesseract?** Not on Workers. Options:
  - **Separate Node.js service** (Vercel/Netlify Functions, Railway, Fly.io)
  - **Client-side** (tesseract.js in React Native — adds 5MB+ to bundle)
  - **Dedicated OCR service** (AWS Textract, Google Vision API)

**Recommendation**: Use **AWS Textract** or **Google Vision API** instead of Tesseract. They're:
- More accurate than Tesseract
- Better at complex layouts
- Already cloud-hosted (no deployment complexity)
- Have free tiers for testing

#### 4. Learning from User Habits
**User's Idea**: "Use Groq LLM to help with learning user habits instead of doing heavy lifting."

**Interpretation**: 
- Track user corrections (items added/removed after parsing)
- Build a "confidence score" for each extraction
- Learn common patterns (supplier names, product formats)
- Fine-tune prompts based on user feedback

**Implementation**:
```typescript
// Track corrections
type ParsingCorrection = {
  sessionId: string;
  originalExtraction: ParsedItem[];
  userCorrections: {
    added: ParsedItem[];
    removed: string[]; // item IDs
    modified: { id: string; changes: Partial<ParsedItem> }[];
  };
  imageHash: string; // For learning similar images
};

// Store in database (requires backend)
// Use for:
// 1. Confidence scoring
// 2. Prompt fine-tuning
// 3. Pre-filling suggestions
```

**Challenge**: Requires **database** to store corrections. Cannot do this with local-only storage.

### Implementation Complexity
- **Effort**: 🟡 **Medium** (3-4 weeks for improved prompts + confidence scoring)
- **Breaking Changes**: No (can be additive)
- **Infrastructure**: Requires database for learning (optional)

### Recommendation
**Don't use Tesseract on Workers.** Instead:

1. **Improve Current LLM Pipeline**:
   - Add image preprocessing (contrast, sharpening, resolution upscaling)
   - Test different Vision models (GPT-4 Vision, Claude Vision)
   - Refine prompts based on failure cases
   - Add confidence scores to UI (flag uncertain extractions)

2. **Add Correction Tracking** (requires database):
   - Store user corrections
   - Build confidence model
   - Suggest corrections for low-confidence items

3. **Consider Alternative OCR Services** (if LLM still fails):
   - AWS Textract (best for tables/forms)
   - Google Vision API (best for general OCR)
   - Keep Groq LLM for structured extraction after OCR

**The LLM approach is likely better than Tesseract for this use case.** The issue is probably **prompt engineering** or **image quality**, not the model choice.

---

## 📊 Feature Priority Matrix

| Feature | User Value | Engineering Effort | Infrastructure Impact | Recommendation |
|---------|------------|-------------------|---------------------|----------------|
| Multi-Store Cross-Reference | 🟢 High | 🔴 Very High | 🔴 Requires DB + Auth | Phase 2 (after collaboration) |
| Real-Time Collaboration | 🟢 Very High | 🔴 Very High | 🔴 Requires DB + Auth + Realtime | Phase 1 (core feature) |
| Improved OCR Accuracy | 🟡 Medium | 🟡 Medium | 🟢 Optional (DB for learning) | Quick wins first (prompts) |

---

## 🎯 Recommended Implementation Order

### Phase 1: Foundation (Weeks 1-4)
1. **Add Supabase** (database + auth)
2. **Migrate Sessions to Cloud** (keep local cache for offline)
3. **Add User Authentication** (email/password or OAuth)
4. **Basic Session Sharing** (share link, read-only access)

### Phase 2: Collaboration (Weeks 5-8)
1. **Real-Time Sync** (Supabase Realtime)
2. **Change Tracking** (audit log)
3. **Presence Indicators** ("X is viewing")
4. **Conflict Resolution** (optimistic locking)

### Phase 3: Multi-Store (Weeks 9-12)
1. **Brand/Store Data Model**
2. **Store Selector UI**
3. **Cross-Store Comparison View**
4. **Permission System** (who can see which stores)

### Phase 4: OCR Improvements (Ongoing)
1. **Image Preprocessing** (client-side)
2. **Confidence Scoring** (UI feedback)
3. **Correction Tracking** (database)
4. **Prompt Fine-Tuning** (based on corrections)

---

## ⚠️ Critical Warnings

1. **Don't Hack Multi-User with Local Storage**: Real-time collaboration requires a stateful backend. Cloudflare Workers alone won't work.

2. **Tesseract Won't Work on Workers**: Use cloud OCR services (AWS Textract, Google Vision) or improve LLM prompts instead.

3. **These Features Are Not "Additions"**: They're **architectural pivots**. The MVP is "local-first, single-user." These features require "cloud-first, multi-user."

4. **Start with Auth + Database**: Everything else depends on this foundation. Don't try to build collaboration on top of AsyncStorage.

---

## 💡 Alternative: "Good Enough" Versions

If full implementation is too complex, consider these lighter alternatives:

### Multi-Store (Lite)
- **Store Selector**: Filter local sessions by `storeId` (no cloud sync)
- **Export/Import**: Export session as JSON, import on another device
- **Manual Comparison**: User manually compares exports in spreadsheet

### Collaboration (Lite)
- **Share as PDF**: Export session as PDF, email to owner for review
- **Read-Only Link**: Generate shareable link (no real-time, but owner can view)
- **Email Approval**: Owner receives email with "Approve" button

### OCR Improvements (Lite)
- **Confidence Indicators**: Show "uncertain" items in UI (user can verify)
- **Manual Override**: Easy "add missing item" button
- **Image Quality Warnings**: Prompt user to retake photo if quality is poor

---

## 📝 Conclusion

These "dreams" are **valid user needs**, but they represent a **fundamental shift** from the MVP architecture. The MVP is intentionally minimal (local-first, single-user) to maximize speed and simplicity.

**To implement these features, you must:**
1. Add a backend database (Supabase recommended)
2. Add authentication (Supabase Auth or Clerk)
3. Add real-time sync (Supabase Realtime or custom WebSocket)
4. Refactor state management (Zustand → Supabase client)

**This is a 3-4 month project, not a "quick addition."**

Consider whether these features are **must-haves** for your target market, or if the MVP's simplicity is actually a competitive advantage.

