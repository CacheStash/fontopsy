# Fontopsy: Font Inspector & Layers Tester

An ultra-fast, client-side, zero-server font forensic and inspection web application inspired by FontDrop.info. Parses `.otf`, `.ttf`, `.woff`, and `.woff2` files directly in-memory, explores OpenType layout features, previews waterfall specimens, inspects deep SFNT binary tables, supports multi-font chromatic Layer Stacking with character alternate popovers (from `bombastype` / `subqifont`), detects 120+ languages with full alphabet matrix telemetry, and features the specialized **Layered Font Glyph Exporter** for chromatic typography in vector design suites (Adobe Illustrator, InDesign, Figma).

---

## Key Features

### 1. In-Memory Drag & Drop Multi-Font Engine
* **Formats Supported:** OTF, TTF, WOFF, WOFF2 (with WebAssembly Brotli/WOFF2 decompression via `wawoff2`).
* **Multi-Font Family Loading:** Drop single font or multiple font family styles simultaneously for chromatic layering.
* **Zero Remote Server Uploads:** 100% computed in-browser using `opentype.js`.
* **Dynamic Font Injection:** Injects independent `@font-face` rules in the DOM so custom text renders directly with all dropped styles simultaneously.

### 2. Chromatic TypeTester & Multi-Layer Engine (Inspired by bombastype / subqifont)
* **Layer Stacking Order:** Drag-and-drop layer reordering (`GripVertical`), independent color pickers per layer, style selectors from loaded font files, and visibility toggles.
* **Custom Alternate Selection:** Interactive text span selection triggers instant GSUB lookups (`aalt`, `salt`, `swsh`, `titl`, `calt`, `dlig`, `ss01`-`ss20`).
* **Secure RasterMetricTile Popover:** Renders Bézier curves to canvas without exposing vector master curves in the DOM.
* **OpenType Feature Toggles:** Live interactive toggles for all detected font features.

### 3. Comprehensive Language & Script Matrix (120+ Languages)
* **FontDrop.info-grade Detection:** Scans font character sets against 120+ language orthographies (Indonesian, English, Spanish, German, French, Turkish, Polish, Vietnamese, Zulu, Swahili, Russian, Greek, etc.).
* **Visual Character Matrix Cards:** Renders the language's actual alphabet, special diacritics, and sample pangrams directly with the loaded font.
* **Script Blocks Inspector:** Deep analysis of Basic Latin, Latin-1, Latin Extended-A/B, Cyrillic, and Greek blocks with exact glyph coverage counts and missing glyph alerts.

### 5. Glyph Grid Matrix & Bézier Inspector
* Paginated grid rendering each glyph on an SVG canvas.
* Hover telemetry: GID, Unicode hex (e.g. `U+0041`), PostScript name, Advance Width, Left Side Bearing.
* Modal view on click showing raw Bézier point coordinates, baseline guides, and SVG path export.

### 6. Deep Table Inspector
* Tabular breakdown of raw SFNT tables: `cmap`, `head`, `hhea`, `maxp`, `post`, `OS/2`, `fvar`.
* **Variable Font Axes:** Interactive sliders for `wght`, `wdth`, `slnt`, `opsz` with live font-variation-settings preview.

---

## Local Development & Testing

```bash
# 1. Install dependencies
pnpm install

# 2. Start local development server with browser
pnpm dev --open
```

Or on Windows: double-click **`run.bat`**.

---

## Production Build & Cloudflare Deployment

```bash
# Production build (outputs to dist/)
pnpm build
```

Deploy directly using `./deploy.sh` or via Wrangler:
```bash
pnpm dlx wrangler pages deploy dist --project-name=fontopsy
```

---

## License
MIT
