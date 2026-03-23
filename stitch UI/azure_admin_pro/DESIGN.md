# Design System Document: Enterprise Editorial

## 1. Overview & Creative North Star: "The Architectural Ledger"
This design system rejects the "standard dashboard" aesthetic of heavy borders and cluttered grids. Instead, it adopts the **Architectural Ledger**—a Creative North Star that treats enterprise data with the prestige of a high-end financial journal. We achieve this by utilizing intentional asymmetry, expansive white space, and a "No-Line" philosophy. 

The goal is to move away from "software-as-a-tool" and toward "software-as-a-workspace." By leveraging high-contrast typography scales and tonal layering, we create a sense of authoritative calm, ensuring that even the most data-dense environments feel breathable and premium.

---

## 2. Colors: Tonal Depth & The No-Line Rule
Our palette is anchored in deep, professional blues (`primary: #00488d`) and a sophisticated neutral scale. The core of this system's "custom" feel comes from how these colors interact without the use of structural lines.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established through background color shifts. For instance, a `surface-container-low` sidebar sitting against a `surface` background provides all the definition needed without the visual "noise" of a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface tiers to create "nested" depth:
- **Base Layer:** `surface` (#fbf9f8) for the main application background.
- **Section Layer:** `surface-container-low` (#f5f3f3) for grouping content areas.
- **Interactive Layer:** `surface-container-lowest` (#ffffff) for the highest-priority cards and interactive modules.
- **Deep Inset:** `surface-dim` (#dbdad9) for secondary navigation or "well" components.

### The "Glass & Gradient" Rule
To elevate the experience, use Glassmorphism for floating overlays (e.g., Modals or Dropdowns). Utilize semi-transparent versions of `surface-container-lowest` with a `backdrop-blur: 20px`. 
**Signature Textures:** For primary CTAs, apply a subtle linear gradient from `primary` (#00488d) to `primary_container` (#005fb8) at a 135-degree angle. This adds a "soul" to the interface that flat colors lack.

---

## 3. Typography: Editorial Authority
We pair the structural precision of **Inter** for data with the sophisticated, wide-set nature of **Manrope** for display elements.

- **Display & Headlines (Manrope):** These are your "Editorial" anchors. Use `display-lg` (3.5rem) and `headline-md` (1.75rem) to create clear entry points for the eye. The contrast between these large, bold titles and the dense data below creates a professional, intentional rhythm.
- **Body & Data (Inter):** For the "Ledger" itself, use `body-md` (0.875rem) and `body-sm` (0.75rem). Inter’s tall x-height ensures that even at high densities, numerical data remains hyper-legible.
- **Labels (Inter Bold):** Use `label-md` (0.75rem) in all-caps with a `0.05em` letter-spacing for table headers to distinguish "metadata" from "actual data."

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often a crutch for poor layout. In this system, we prioritize **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural lift.
- **Ambient Shadows:** When a float is required (e.g., a floating action button), use an extra-diffused shadow: `box-shadow: 0 12px 32px rgba(0, 72, 141, 0.06);`. Note the blue tint in the shadow—this mimics natural light refraction rather than a muddy grey.
- **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use the `outline_variant` (#c2c6d4) at **15% opacity**. Never use a 100% opaque border.
- **Roundedness Scale:** All primary containers utilize `DEFAULT` (0.5rem/8px). For oversized hero cards, use `lg` (1rem). Small utility elements like tags use `sm` (0.25rem).

---

## 5. Components: Precision & Density
Our components are designed for a high-density enterprise environment without sacrificing the "High-End" feel.

### Buttons & Chips
- **Primary Button:** Gradient-filled (`primary` to `primary-container`), `DEFAULT` (8px) roundedness, using `on-primary` text.
- **Secondary/Ghost:** No background, `primary` text. Interaction is signaled by a subtle shift to `surface-container-high`.
- **Status Chips:** Use `tertiary_fixed_dim` for success and `error_container` for danger. Ensure text uses the respective `on-container` token for high-contrast accessibility.

### Form Inputs & Data Fields
- **Input Fields:** Utilize `surface-container-lowest` as the fill color. The active state is signaled not by a thicker border, but by a 2px `primary` bottom-bar and a subtle `surface-tint` glow.
- **Data Tables:** **Forbid divider lines.** Use `1.5` (0.3rem) vertical spacing between rows. Every second row should use a `surface-container-low` background to guide the eye horizontally.

### Cards & Layouts
- **The Floating Header:** Keep headers sticky with a `backdrop-blur` and `primary-fixed` translucent background. 
- **The Density Toggle:** Provide a global utility to switch between "Editorial" (Spaced) and "Condensed" (Data-Heavy) modes using the `Spacing Scale`.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use `20` (4.5rem) or `24` (5.5rem) spacing to separate major content blocks. White space is a luxury; use it.
- **Do** use `Manrope` for any text larger than 1.5rem to maintain the "Editorial" brand feel.
- **Do** use tonal shifts (e.g., `surface` to `surface-container-high`) to highlight active navigation states.

### Don’t:
- **Don't** ever use `#000000` for shadows or text. Use the `on_surface` or tinted primary colors.
- **Don't** use lines to separate list items. Use the spacing scale (`spacing-4`) and background-color nesting.
- **Don't** center-align data. Enterprise data should always be left-aligned (text) or right-aligned (numbers) for rapid scanning.