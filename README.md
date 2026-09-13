# MSC Tools — Tooling Advisor

**Interactive prototype · MSC Tools, a sub-brand of MSC · v11 · September 2026**

A working mock of a tooling-advisor application for CAM programmers: guided
tool selection, competitor cross-reference, shop-crib inventory, Autodesk
tool-library exchange, and a staged commerce flow in one docked panel. Built to
show the end-to-end flow, not to pilot it. Every SKU, part number, price, stock
count, account number, and document number is fictional, in realistic formats.
A persistent **SIMULATED DATA** badge sits in the header.

v11 applies the September 2026 refinement spec: brand palette and type scale,
the official MSC logo, a narrow-first layout for a docked Fusion or Inventor
palette, an in-panel product page modeled on mscdirect.com, inline forms in
place of native dialogs, Autodesk-only export targets, and a data / mock-API /
state separation.

---

## 1. The concept

MSC Tools is an *advisor first, store second*. A machinist or CAM programmer has
a job in front of them — a material, an operation, a size — and somewhere in a
multi-million-SKU catalog are the three tools that fit it. The application
collapses that search into a few confirmations, and makes switching from a
competitor's tooling easy by showing the evidence: matched specs, price deltas,
lead times.

Everything converges on two destinations:

- **The staging cart** (commerce): a priced what-if that becomes an order or a
  quote only on explicit action. Nothing is purchased by browsing, matching,
  importing, or auditing. Staging is explicit.
- **My Library** (CAM data): the single handoff point where selected tools, with
  geometry and material-matched feeds/speeds presets, export to Autodesk Fusion
  or Autodesk Inventor.

Each tab works semi-independently. Brand preferences are one shared setting,
editable on Find, Match, and Library, and stay in sync everywhere.

---

## 2. Application anatomy

| Region | Contents |
|---|---|
| **Header** | MSC logo (red) · "MSC Tools" product name with the red cursor-bar sub-brand device · "Tooling advisor" sub-line · catalog search (an MSC # opens its product page directly; a keyword runs Find) · account and crib status (wide layout) · SIMULATED DATA badge |
| **Rail** | Five sections — Find, Match, Crib, Library, Cart. Icon rail with labels on hover in the docked layout; icons with labels when undocked (≥ 720 px). Live count badges on Library and Cart. Arrow keys move between tabs. |
| **Content** | The active tab's workspace, or the product page. Internal scroll region; header and status bar never scroll away. |
| **Status bar** | Small white MSC logo · staging-cart item count and running total · Review button. Pulses when the cart changes. |
| **Toasts** | Bottom-center confirmations; cart additions carry **Undo**. |
| **Product page** | Full-height in-panel view with a back control to the originating tab — see §8 |

**Design system (spec §3).** Bold Blue `#0057B8` for primary actions, active
tab, links, fit %, the preferred-brand star, and the cursor bar beside each
panel headline. Dark Blue `#012169` for the status bar and the Import & Match
roll-up band. Bright Blue `#00A3E0` for the savings figure on dark surfaces.
Blue tint `#EAF0FB` for cards and callouts. Red `#FF3333` only for the MSC
logo, the sub-brand cursor bar, and below-minimum crib rows. Green for
in-stock and savings chips; a slate chip for price increases. ISO material
colors are the industry convention. Type: Arial for all UI (Bold, all caps, for
headlines and section labels), a system monospace stack (Consolas, Menlo,
Courier New) for part numbers, prices, and cutting parameters. One type scale:
headline 16, section label 11 caps, body 13, secondary 11.5, data 12 mono.
Controls are 32 px tall with a 4 px radius and have hover, focus, and disabled
states. No font network requests.

---

## 3. Find — guided selection

**Purpose:** narrow the catalog to the right tools through four questions.

**Flow.** A four-step wizard with a clickable step rail (arrow keys move
between steps). Every value is user-entered; the app never reads part
geometry or CAM features (§11).

1. **Materials** — six ISO-group tiles (P Steel · M Stainless · K Cast iron ·
   N Non-ferrous · S Superalloys/Ti · H Hardened). Multi-select.
2. **Process** — six operation tiles with pictograms.
3. **Preferred brands** — toggle chips (Accupro, Hertel, SGS, Niagara,
   Kennametal, OSG) or "No preference". A shared setting; see §7.
4. **Size & limits** — optional diameter, cut depth/LOC, corner radius, holder.

Under the wizard, **Know the MSC #?** opens a product page directly, with a
**recent searches** row of the last five lookups.

**Results logic.**

- The result set is chosen per material using the **most conservative group
  selected** (priority H → S → K → M → P → N). When more than one material is
  selected, the results header states which group governs.
- **"Top 3 of 127"** with a sort control (best fit · lowest price · fastest)
  and a Cards / Compare toggle. In the docked layout the comparison collapses
  to stacked spec cards; undocked, it is a spec-by-spec table.
- Preferred brands are starred and rank first; the chosen sort applies within.
- **"See all 127 results"** expands compact rows in batches of six; when the
  demo's rows are exhausted a note reads "Tighten size or process to narrow
  the list."
- Every result offers **+ Library** and **+ Cart**; its name or image opens
  the product page.

---

## 4. Match — alternatives explorer

**Purpose:** paste any competitor part number and explore MSC alternatives
with evidence.

1. A brand-preference chip bar sits above the input, so Match works standalone.
2. Paste a part number (pre-filled with a fictional Sandvik-format number) and
   hit **Match**.
3. The identified part renders as a quiet **"Your part" reference card**: name,
   part number, spec line, price, lead time. No versus framing.
4. **Four MSC alternatives, ranked by fit**, each a product card with render,
   specs, lead time, a green **"Save $X · −N%"** chip (or a slate **"+N%"**
   when the match costs more), price, fit %, and **+ Compare**, **+ Library**,
   **+ Cart**. "See all 16 alternatives" expands compact rows.

**Compare.** Toggle Compare on any alternatives and a table (or stacked cards
when docked) builds below: your part first, each selection beside it, with
price and savings, lead, diameter, flutes, LOC, coating, and fit. Spec cells
are marked ✓ exact or ~ different. **Compare another MSC #** adds any catalog
SKU as an extra column; manually added SKUs show "—" for fit.

**Recent matches** re-run with one click. Every alternative opens its product
page.

---

## 5. Crib — virtual shop inventory

- **Named profiles** ("Bay 2 — Haas VF-2", "Bay 1 — DMG Mori"). Rename, New
  profile, and Add SKU open **inline forms** in the panel (no native dialogs;
  Add SKU validates against the catalog).
- A **summary strip**: SKUs tracked, lines below minimum, cost to replenish,
  plus a live filter box.
- Each line: MSC # (opens its product page), name, on-hand stepper, minimum,
  and an MSC / OTHER source badge. Lines below minimum flag red. Docked, lines
  render as cards; undocked, as a table.
- **Generate PO — MSC SKUs only** drafts a purchase order from below-minimum
  MSC lines, reordering each to 2× its minimum. Non-MSC lines are listed as
  excluded: "Match these on the Match tab to include them." The PO card offers
  **Send to purchasing** and **Add to staging cart**.
- Crib data surfaces elsewhere: Find results and product pages show "N in
  your crib," and the Cart runs a crib check before checkout (§7).

---

## 6. Library — Autodesk exchange (My Library + Import & Match)

**My Library (outbound).** Every "Add to Library" lands here with its
material-matched preset. **Export** writes the whole set to the selected
target: **Autodesk Fusion (.tools)** or **Autodesk Inventor**. Items can be
removed; "Add all to cart" bridges the other direction.

**Import & Match (inbound).** Sources:

- **Load from Fusion library** — simulates reading the tool library inside a
  Fusion document: six tools with generic and supplier part numbers, five
  matchable plus one custom form tool.
- **Import .tools / .csv** (file picker or drop zone) and **Load sample list**
  — simulate a file import.
- **Load from Inventor library** — shown disabled until the Inventor path is
  defined; the mock API rejects the call with that message.

**Audit logic.** Matched lines offer radio-selectable alternatives with brand,
fit %, price, and a price-delta chip. Per-line checkboxes include or exclude
lines; the **roll-up band** (Dark Blue, savings in Bright Blue) recomputes
live. Unmatched customs route to **Request quote**. **Add selected to Library
+ cart** stages everything at once; the copy states that nothing is ordered by
importing.

---

## 7. Shared systems

**Brand preferences.** One setting, three doors: Find's wizard step, a chip bar
on Match, a chip bar on Import & Match. Changing it anywhere re-ranks every
ranked surface on screen and syncs the other bars.

**Staging cart.** Line items carry a render, quantity stepper, per-line total,
and remove. Below them: a **crib check** for every cart SKU with crib stock on
hand ("Use crib stock" reduces the order quantity), an **order summary**
(subtotal, FREE next-day shipping, order by 8 p.m. ET, tax at order), and
three exits: *Add all to Library* · **Checkout** · *Save quote*.

**Quotes and orders (simulated).** *Save quote* creates a numbered quote
(Q-2026-04xx) in a **Saved quotes** list; each reopens into the cart.
**Checkout** renders a confirmation (SO-2026-07xx, items, ship-to on file,
next-day delivery, total, marked simulated) and clears the cart. Quotes
survive checkout.

**Keyboard.** Arrow keys move along the tab rail and the wizard step rail;
Escape closes the product page and returns focus to the element that opened
it; the product title receives focus on open; every control has a visible
focus ring.

---

## 8. Product page ("PDP light")

A registry of **29 fictional products** (23 cutting tools plus a holder,
collets, and a cutting fluid) backs the app. Clicking any product's name or
image — Find cards, compare columns, expanded rows, Match alternatives, Library
items, cart lines, Crib SKU cells, recent-search chips, or the header search —
opens the product page as a full-height in-panel view with **← Back to
[originating tab]**. Structure, modeled on mscdirect.com:

1. **Header block:** brand eyebrow, product title with the cursor bar, one-line
   description, MSC # and Mfr #. Render at right undocked, above the title
   docked.
2. **Buy panel:** price "/each," quantity stepper (typed or stepped), **Add to
   cart** (Bold Blue) and **Add to Library**, "In stock · N" with "Ships today,
   order by 8 p.m. ET," an "N in your crib" line when applicable, free
   next-day note. Sticky on scroll in the wide layout.
3. **Specifications:** the two-column bordered table — cutting diameter
   (fraction and decimal), flutes, material, length of cut (fraction and
   decimal), shank, overall length, coating/finish, helix or point angle,
   centercutting, cutting direction — with **Show all specifications** for
   the long tail (series, end type, shank type, corner radius, and so on).
4. **Feeds and speeds:** SFM, RPM, chip load, and feed for all six ISO groups,
   computed from the tool's own geometry (§9), labeled as the starting
   parameters that export with the tool. The row for the group currently
   selected in Find is highlighted.
5. **Tool geometry and CAM data:** Export to Autodesk Fusion (.tools) or
   Autodesk Inventor, with a note that geometry and presets are included.
6. **Alternatives** (three ranked alternates with fit %, same tool type and
   diameter) and **Often bought with** (holder, collet sized to the shank,
   cutting fluid). Both open their own product pages.

**Product renders.** No photography. Tools render as shaded SVG pseudo-renders
with coating-accurate flute colors (AlTiN violet-grey, TiAlN dark, TiN gold,
TiCN blue-grey, ZrN pale gold, bright carbide) and silhouettes per tool type.

---

## 9. Material and parameter logic

**Coating correctness.** Result sets are chosen so coatings make metallurgical
sense: N — ZrN or polished uncoated, never AlTiN; P — AlTiN, TiAlN, TiCN;
M — AlTiN, TiAlN; K — TiCN, AlTiN, uncoated roughers; S and H — AlTiN, TiAlN.

**Governing group.** With multiple materials selected, presets and coatings
follow the most conservative group, priority H → S → K → M → P → N. The
results header states which group is governing.

**Feeds and speeds** (simplified, directionally honest, computed per tool):

```
RPM       = SFM × 3.82 ÷ cut diameter          (rounded to 10s)
chip load = 0.0008 + diameter × 0.0028          (inches/tooth)
feed IPM  = RPM × flutes × chip load
SFM table = N 900 · K 300 · P 350 · M 240 · H 150 · S 120  (drills lower)
```

---

## 10. Simulated-data policy

- **Account:** `#0000-DEMO`, "Bay 2 crib ✓ connected"
- **MSC SKUs:** fictional `0999xxxx` range (29 products)
- **Competitor / document part numbers:** invented formats
  (`CM-2F340-0500-DEMO`, `GEN-EM-500-4F`, `SUP-BN-375`, `CUSTOM-FORM-12`)
- **Document numbers:** `PO-2026-MMDD-DEMO`, `Q-2026-04xx`, `SO-2026-07xx`,
  `RFQ-…-DEMO`
- **Prices, stock, lead times, fit percentages:** representative only
- Checkout, quote, export, and import flows say "simulated" on screen.

Brand names (Accupro, Hertel, SGS, Niagara, Kennametal, OSG) are retained as
MSC-carried brands; they are what makes the brand-agnostic advisor credible.

---

## 11. Deliberate scope decisions

- **No part/feature reading.** The app never reads CAD geometry, CAM setups,
  or selected features. The only inbound paths are explicit imports. The
  context-reading elements from earlier builds sit behind
  `MSC.flags.contextRead` (default `false`) in `js/state.js`; the deck
  presents Fusion API context as the 2027 horizon.
- **No persistence.** State resets on refresh.
- **Simulated integrations.** Catalog, pricing, cross-reference, cart and
  quote, crib, Fusion and Inventor library read/write, file parsing, and PO
  transmission are all mocked in `js/api.js` with realistic behavior.
- **Parked:** authentication, multi-user crib sync, punchout/e-procurement,
  quantity price breaks, tool-assembly builder.

---

## 12. Repository and deployment

```
index.html              application shell and the five tab views + product-page view
css/style.css           design system: tokens, type scale, controls, narrow-first layout
js/state.js             single source of truth (brands, cart, library, crib, quotes, UI) + feature flags
js/api.js               mock API layer: catalog.search/detail/lookup/crossRef/alternatives/oftenWith,
                        pricing.availability, cart.submit/saveQuote/requestQuote, crib.profiles/save/
                        draftPO/sendPO, fusion.readLibrary/writeLibrary, inventor.readLibrary/writeLibrary,
                        files.parseToolList
js/app.js               views and interactions (vanilla JS, no dependencies)
data/catalog.json       product registry, result sets, SFM tables, "often bought with" map
data/match.json         reference part, fit table, ranked alternative lists
data/cribs.json         crib profiles
data/imports.json       Fusion-library and sample-file import fixtures
data/fixtures.js        generated bundle of the JSON above, used only when opened from file://
assets/msc-logo.svg     official MSC logo, red (header)
assets/msc-logo-white.svg  official MSC logo, white (status bar)
tools/build_fixtures.py regenerates data/*.json and data/fixtures.js
tools/smoke.py          headless Playwright walkthrough of every workflow at 440 and 900 px
```

No build step and no runtime network dependency. The JSON fixtures load with
`fetch`, so serve the folder (GitHub Pages, `python3 -m http.server`, VS Code
Live Server). Opening `index.html` directly from disk falls back to
`data/fixtures.js` automatically. To change fixture data, edit
`tools/build_fixtures.py` and run it.

**GitHub Pages:** push all files and folders to the repo root on `main`;
Settings → Pages → deploy from `main` / root. Open the site root URL.
Hard-refresh (Ctrl/Cmd+Shift+R) after pushing; Pages caches aggressively.

---

## 13. Suggested walkthrough

1. **Find** — select Aluminum, then add Steel and watch the header say ISO P
   governs. Flip Cards / Compare, sort by price, expand "See all," open a
   product page from a card, then open an alternative from that page.
2. **Match** — run the pre-filled part number, point out the reference card and
   the savings chips, toggle two alternatives into Compare, add your own MSC #
   as a third column.
3. **Library** — Load from Fusion library, flip an alternative and watch the
   roll-up recompute, note the honest +8% line, add selected to Library +
   cart, then Export to Fusion or Inventor.
4. **Crib** — switch profiles, filter, note the reds and the summary strip,
   add a SKU with the inline form, Generate PO and show the excluded lines.
5. **Cart** — honor the crib check, Save quote, Checkout to the confirmation,
   reopen the saved quote.
