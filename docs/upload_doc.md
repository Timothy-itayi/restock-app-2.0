Jarvis, here’s a **clean, surgical prompt** you can feed to NanoBanana, Midjourney, Cursor agents, or whatever design-summoning creature you’re using. It describes the redesign in a way that forces a modern, Mobbin-tier result without hand-holding.

No sarcasm inside the prompt itself, per your rules.

---

# ✔️ **Prompt: Redesign the “Upload Catalog → Scan Results” Screen**

Redesign the “Upload Catalog → Scan Results” screen of a mobile iOS app. The new layout must feel modern, clean, and minimal, similar to design patterns found in Mobbin under categories such as: import flows, scan/parse confirmation screens, review-and-confirm lists, multi-select lists, and editable item rows.

The goal is to reduce visual noise, simplify hierarchy, and make the parsed items list the primary focus. The user has already uploaded a document and is now reviewing parsed items before importing them into a session.

### **Requirements**

**1. Simplify the top summary area**

* Collapse “items found” and “selected count” into a compact summary bar.
* Example structure: “28 items • All selected” with an optional small “Edit” or “Manage” action.
* Remove large colored blocks or heavy shading.

**2. Move the primary action**

* The main CTA “Import to Session” must move into a bottom sticky action bar or bottom-fixed button.
* It should be clean, wide, and unobtrusive until needed.

**3. Downplay secondary actions**
Replace the visible row of buttons (Add Item, Re-parse, Select All, Deselect, Start Over) with either:

* A small toolbar with icons, or
* A 3-dot overflow menu containing the less-used actions.

This prevents secondary actions from competing with the main flow.

**4. Redesign parsed items into clean, modern cards**
Each parsed item should use a compact two-line structure:

* Line 1: Item name
* Line 2: Category or brand + quantity
* Checkbox on the left for selection
* Edit icon on the right
* Balanced spacing, subtle dividers, no heavy boxes

Avoid busy styling. Use thin lines, soft spacing, and neutral backgrounds.

**5. Layout priorities**

* Parsed items list is the primary surface and should dominate the screen.
* Summary bar stays at the top but visually lightweight.
* Sticky CTA at bottom.
* Scrolling should be smooth, with consistent spacing and alignment.

**6. Visual style**

* Mobile-first iOS aesthetic
* Light neutral background
* Soft shadows or none
* Minimal color usage except for accents and selection states
* No borders heavier than 1px
* Avoid any “dashboard-like” blocks

### **Overall Intent**

Create a cleaner, more professional, Mobbin-quality screen that feels modern and comfortable to use. The interface should help the user focus on reviewing items, not on interpreting UI clutter.

---

Page: Upload Catalog – Scan Results
 ├─ Header
 │   ├─ Back Icon
 │   ├─ Title
 │   └─ Divider
 │
 ├─ Summary Bar (Collapsed)
 │   ├─ Count + Selected state
 │   └─ Manage button
 │
 ├─ Utility Row (Icons)
 │   ├─ Add Item
 │   ├─ Re-parse
 │   └─ Start Over
 │
 ├─ List Container (Scrollable)
 │   ├─ Item Row 1
 │   ├─ Item Row 2
 │   ├─ ...
 │   ├─ Item Row N
 │
 └─ Sticky CTA Bar
     └─ Import Button
