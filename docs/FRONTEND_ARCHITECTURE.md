

***

# 🖥️ Frontend Architecture — Warehouse OPs v4

## 1. Core UI Philosophy & Tech Stack
The v4 frontend moves away from "building everything from scratch" and relies on headless, battle-tested libraries. The goal is to maximize performance on large datasets and eliminate cross-browser styling bugs.

*   **Framework:** Next.js 15 (App Router) + React 19
*   **Styling:** Tailwind CSS v4
*   **Component Library:** `shadcn/ui` (Powered by Radix UI primitives)
*   **Data Tables:** TanStack Table v8 (`@tanstack/react-table`)
*   **Virtualization:** TanStack Virtual (`@tanstack/react-virtual`)
*   **State & URL:** `nuqs` (Type-safe URL search params)

---

## 2. Solving the v3 UI Bugs

### A. Winning the Z-Index War (Radix UI)
**The v3 Problem:** Custom dropdowns inside tables fought with sticky headers, requiring manual `dropUp` math and insane `z-[999]` hacks.
**The v4 Solution:** We use Shadcn's `<Select>`, `<DropdownMenu>`, and `<Popover>`. 
*   **React Portals:** When opened, Radix injects the dropdown into the `<body>` tag, completely escaping the table's HTML structure. It will *never* be clipped by an `overflow: hidden` container again.
*   **Floating UI Engine:** Radix automatically calculates window boundaries. If the dropdown is near the bottom of the screen, it auto-flips upwards. Zero manual math required.

### B. Curing the Event Listener Memory Leak (TanStack Table)
**The v3 Problem:** A table with 100 rows rendered 400+ custom dropdowns, attaching 400+ `document.addEventListener("mousedown")` events.
**The v4 Solution:** The "View / Edit Mode" Pattern + Virtualization.
1.  **View Mode:** By default, cells render pure text (e.g., `<div className="px-2">John Doe</div>`). This costs 0 event listeners and is instantly fast.
2.  **Edit Mode:** When a dispatcher clicks the cell, it seamlessly swaps to the Shadcn `<Select>` component. We only render the heavy dropdown component when it is actively being used.
3.  **Virtualization:** Using `@tanstack/react-virtual`, a table with 1,000 tickets will only mount the 20 rows currently visible on the screen. Scrolling will feel like 60 FPS natively.

### C. Fixing the Snapshot "Theme Flash"
**The v3 Problem:** Exporting a dashboard card temporarily swapped the global `<html class="dark">` to `light`, flashing the user's entire screen.
**The v4 Solution:** Off-Screen DOM Cloning.
When the user clicks "Export", we don't touch the global theme. Instead, we use `html-to-image` on a hidden, off-screen wrapper:
```tsx
// Wraps the component meant for export in an isolated light theme scope
<div ref={exportRef} className="print-wrapper bg-white text-slate-900 absolute left-[-9999px]">
   <CrewDayCard data={data} />
</div>
```
The snapshot is taken silently in the background, and the user's screen never flickers.

---

## 3. Strict Design Tokens (Tailwind v4)

To prevent developers from guessing z-indexes or writing duplicate CSS, we establish strict tokens in our global CSS.

**1. The Z-Index Scale**
No more arbitrary `z-[60]` or `z-[200]`. If it's not on this list, it's not allowed.
```css
@theme {
  --z-index-base: 0;
  --z-index-sticky: 10;       /* Table headers, sticky columns */
  --z-index-dropdown: 50;     /* Radix Popovers */
  --z-index-header: 100;      /* Top navigation */
  --z-index-backdrop: 200;    /* Modal dimming overlay */
  --z-index-modal: 300;       /* Dialogs, Google Places Modal */
  --z-index-toast: 400;       /* Notifications */
}
```

**2. The Missing Custom Scrollbar**
We define `.custom-scrollbar` globally so horizontal tables look elegant on Windows machines.
```css
@layer utilities {
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: 10px;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: var(--color-muted-foreground);
  }
}
```

---

## 4. Component Architecture (Dismantling God Components)

The v3 `DashboardClient.tsx` was 960 lines long because it held state, fetched data, rendered charts, and mapped heatmaps all in one file. 

In v4, we use the **Container / Presentational** pattern.

### Example: The Analytics Dashboard
```text
src/app/admin/dashboard/
├── page.tsx                     // SERVER: Fetches data via Services, passes to Client
├── DashboardContainer.tsx       // CLIENT: Manages tabs and layout wrapper
└── _components/
    ├── KpiFunnelGrid.tsx        // UI: The 4 top metric cards
    ├── ChartFutureWorkload.tsx  // UI: Recharts implementation
    ├── HeatmapFleet.tsx         // UI: Renders TanStack Table for vehicles
    └── HeatmapGround.tsx        // UI: Renders TanStack Table for GT
```

*   **Pages (`page.tsx`)** only handle Server-Side logic (checking roles, calling the Database Services).
*   **Containers** only handle React State (e.g., "Which tab is active?").
*   **Components** are "dumb". They just take `props` (data) and render beautiful UI. This makes them highly reusable and easy to read.

---

## 5. State Management: URL-First State

In v3, table filters (like searching for a Ticket ID or picking a Date) were trapped in React `useState`. If a dispatcher refreshed the page, they lost all their filters. If they wanted to share a specific view with another supervisor, they couldn't.

**The v4 Solution:** URL as the Single Source of Truth.
We will use a library called `nuqs` (Next Use Query State) or native Next.js `useSearchParams`.

When a dispatcher filters the Schedule by "Driver: John Doe" and "Date: Today":
*   **v3 Behavior:** Internal React state updates. URL stays `/admin/schedule`.
*   **v4 Behavior:** URL instantly updates to `/admin/schedule?driver=john_doe&date=2026-06-28`.
*   **Why it's elite:** 
    1. The URL can be copied and pasted in Slack.
    2. Hitting "Refresh" keeps the exact same view.
    3. The Next.js Server Component can read these parameters *before* it renders, meaning the page loads already filtered. No loading spinners!

---
