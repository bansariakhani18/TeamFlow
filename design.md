# TeamFlow UI/UX Design System Specification (`design.md`)

## 1. Aesthetic Vision & Core Philosophy
TeamFlow blends a **Warm Modern Executive Dashboard** aesthetic with **Tactile 3D Micro-interactions**.
- **Dashboard Tone:** High-clarity, spacious, structured SaaS layout with clean cards, soft borders, subtle shadows, and neutral canvas tones (inspired by modern HR/Project workspaces like Workable).
- **Auth & Landing Page Tone:** Interactive 3D "Project Binder / Book Flip" physics, giving authentication pages a tactile, high-end feel.
- **Logo Policy:** STRICT BAN on generic AI/magic/sparkle icons, gradient glowing brains, or floating nodes. Use only crisp, geometric typographic logomarks or minimal monochrome SVG icons.

---

## 2. Design Tokens & Color Palette

### Light Mode (Primary Canvas)
- **Background Canvas:** `#F9FAFB` (Tailwind `bg-slate-50`) or Soft Warm Cream `#FAF9F6`
- **Surface / Cards:** `#FFFFFF` with `border border-slate-200/80` and `shadow-sm`
- **Primary Brand Accent:** Deep Forest Teal `#0D5C46` / Slate Blue `#0F172A`
- **Primary Hover:** `#094232`
- **Secondary Accent:** Muted Sage `#E6F0EC` / Soft Slate `#F1F5F9`
- **Text Primary:** `#0F172A` (Tailwind `text-slate-900`)
- **Text Muted:** `#64748B` (Tailwind `text-slate-500`)
- **Border Default:** `#E2E8F0` (Tailwind `border-slate-200`)

### Status Badges & Pill Indicators
- **Active / Published:** Background `#ECFDF5`, Text `#047857` (Emerald)
- **Pending / In Progress:** Background `#FEF3C7`, Text `#B45309` (Amber)
- **Archived / Danger:** Background `#FEF2F2`, Text `#B91C1C` (Rose)

---

## 3. Typography & Hierarchy
- **Font Family:** Inter, System UI, sans-serif (`font-sans`)
- **Headings:** `font-semibold` / `font-bold` tracking-tight
- **Body Text:** `text-sm` or `text-base` with generous line height (`leading-relaxed`)

---

## 4. Interactive 3D "Book Flip" Auth Experience (Login & Register)
The authentication container acts as a tactile 3D notebook/binder:
- **Perspective Container:** `perspective: 1200px` parent wrapper.
- **Card Flip Transition:** Smooth 3D Y-axis rotation (`transform-style: preserve-3d`, `transition-transform duration-700 ease-in-out`).
- **Binder Spine Visual:** Decorative left border accent resembling a hardcover binder spine with realistic depth shadow (`shadow-xl`).
- **Toggle Action:** Switching between "Sign In" and "Create Account" flips the binder cover to reveal the alternate form smoothly.

---

## 5. Dashboard & Workspace Components (Workable Style)
- **Top Header:** Clean, minimal top bar with search trigger, status indicators, user avatar pill, and semantic navigation.
- **Sidebar & Cards:** Generous padding (`p-6`), rounded corners (`rounded-2xl` or `rounded-xl`), soft dividers, clean horizontal lists for tasks/projects.
- **Buttons:**
  - **Primary:** Solid Deep Forest Teal (`bg-[#0D5C46] text-white hover:bg-[#094232] rounded-lg shadow-sm font-medium transition-all`).
  - **Secondary / Ghost:** Soft grey outline or subtle tinted fill (`bg-slate-100 text-slate-700 hover:bg-slate-200`).