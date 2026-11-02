# TeamFlow UI/UX Design System Specification (`design.md`)

## 1. Aesthetic Vision & Core Philosophy
TeamFlow merges a **Warm Collaborative Pinboard & Modern SaaS** aesthetic with **Tactile 3D Micro-interactions**.
- **Global Canvas:** Warm Natural Linen `#F4F3EF` (Tailwind `bg-[#F4F3EF]`)
- **Primary Brand Color:** Soft Pastel Sage `#4E8765` (Hover: `#3B6B50`, Tint: `#E8F2EC`)
- **Card Surfaces:** Pure White `#FFFFFF` with `border border-stone-200/80` and `shadow-md`
- **Text:** Deep Slate `#1F2937` for headings, `#6B7280` for body text.
- **Accents:**
  - Pastel Coral: `#FFE5D9` (Background) / `#D97767` (Text)
  - Butter Yellow: `#FFF3C4` (Background) / `#B48209` (Text)
  - Sky Blue: `#E0F2FE` (Background) / `#0284C7` (Text)
  - Muted Lavender: `#F3E8FF` (Background) / `#7E22CE` (Text)
- **STRICT BANS:** No dark vegetation greens (`#0D5C46`), no audio player timelines, no personal student names ("Bansari"), no course IDs ("IT645"), no generic AI sparkles or single-color flat logos.

---

## 2. Design Tokens & Color Palette

### Base Canvas & Surfaces
- **Canvas Backdrop:** `#F4F3EF` (Warm Linen)
- **Surface Panels & Modals:** Pure White `#FFFFFF` with `border border-stone-200/80` and `shadow-sm` or `shadow-md`
- **Card Radius:** `rounded-2xl` or `rounded-3xl`

### Primary Branding (Pastel Sage)
- **Primary Action Color:** `#4E8765`
- **Primary Action Hover:** `#3B6B50`
- **Primary Light Tint:** `#E8F2EC` (Text: `#2D5A40`)

### Status Tags & Indicators
- **Active / Complete:** `#E8F2EC` (Background) / `#2D5A40` (Text)
- **In Progress / Review:** `#FFF3C4` (Background) / `#B48209` (Text)
- **Notice / High Priority:** `#FFE5D9` (Background) / `#D97767` (Text)
- **Capacity / Metrics:** `#E0F2FE` (Background) / `#0284C7` (Text)

---

## 3. Brand Assets (Logo B 3D Isometric)

```jsx
export const BrandLogo = ({ className = "h-8 w-8" }) => (
  <div className="flex items-center gap-3">
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Left Column Plane - Dark Sage Shade */}
      <path d="M22 38 L44 26 L44 78 L22 90 Z" fill="#3B6B50" />
      {/* Top Crossbar Plane - Pastel Sage Highlight */}
      <path d="M22 38 L62 16 L84 28 L44 50 Z" fill="#6B9E80" />
      {/* Right Interlocking Wing - Medium Sage Accent */}
      <path d="M44 50 L78 32 L78 52 L44 70 Z" fill="#4E8765" />
      {/* Front Fold Edge Highlight */}
      <path d="M44 50 L44 78 L58 70 L58 42 Z" fill="#88B89C" opacity="0.9" />
    </svg>
    <span className="font-bold text-xl tracking-tight text-stone-800 font-sans">
      Team<span className="text-[#4E8765]">Flow</span>
    </span>
  </div>
);
```

---

## 4. Auth Screen Architecture (Split Hero & 3D Perspective Card)

### Left Column: Cartoon Collaboration Hero Scene
- High-quality SVG/CSS 3D cartoon collaboration scene featuring teammates around a workspace desk with laptops and documents.
- 3 Floating Glassmorphic Overlay Widgets:
  1. **Top Right Pill:** Task Review with Team • 09:30 AM (`bg-[#FFF3C4]/90 text-[#B48209]`)
  2. **Middle Left Calendar Badge:** Date cards `[Sun 22] [Mon 23] [Tue 24] [Wed 25]` inside translucent pill
  3. **Bottom Avatar Bubble Stack:** Floating contributor avatars (`BA`, `HM`, `IK`, `HS`) with pastel status indicators (`bg-[#E8F2EC] text-[#2D5A40]`)

### Right Column: 3D Perspective Auth Card
- Container: `perspective: 1200px`
- Card: `bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl relative transition-transform duration-700 transform-gpu`
- Header: `<BrandLogo />` + Top toggle pill (Sign In vs Register)
- Inputs: `focus:ring-2 focus:ring-[#4E8765] focus:border-[#4E8765] bg-stone-50/50 rounded-xl`
- CTA Button: `bg-[#4E8765] hover:bg-[#3B6B50] text-white w-full py-3.5 rounded-xl font-semibold shadow-sm transition-all duration-200` ("Sign In →" / "Create Account →")

---

## 5. UI Component Hierarchy
- **Buttons:** Pastel Sage (`#4E8765`) primary, Light Stone secondary (`bg-stone-100 hover:bg-stone-200 text-stone-700`)
- **Modals & Dialogs:** `rounded-3xl bg-white border border-stone-200/80 shadow-2xl`
- **Dashboard:** Linen background `#F4F3EF`, white rounded-2xl cards with soft borders and hover elevations.