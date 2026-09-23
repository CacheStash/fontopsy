# Fontopsy: Advanced Client-Side Font Inspector & Glyph Extractor

An ultra-fast, client-side, zero-server font forensic and inspection web application inspired by FontDrop.info. Parses `.otf`, `.ttf`, `.woff`, and `.woff2` files directly in-memory, explores OpenType layout features, previews waterfall specimens, inspects deep SFNT binary tables, and features the specialized **Layered Font Glyph Exporter** for chromatic typography in vector design suites (Adobe Illustrator, InDesign, Figma).

---

## Key Features

### 1. In-Memory Drag & Drop Forensic Engine
* **Formats Supported:** OTF, TTF, WOFF, WOFF2 (with WebAssembly Brotli/WOFF2 decompression via `wawoff2`).
* **Zero Remote Server Uploads:** 100% computed in-browser using `opentype.js`.
* **Dynamic Font Injection:** Injects `@font-face` rules in the DOM so custom text renders directly with the dropped font.

### 2. Dedicated Custom Module: "Layered Font Glyph Exporter"
* **Problem Solved:** When designing multi-layered chromatic fonts in vector software (Illustrator, InDesign, Figma), designers duplicate text blocks across layers with the exact same glyph sequence. Accidental unmapped glyphs, invisible spaces (`U+0020`), or `.notdef` ruins text alignment and cursor placement.
* **Strict Filter & Exclusion Rules:**
  * Omit `.notdef` (GID 0) and any unencoded blank boxes.
  * Omit Whitespaces: standard space (`U+0020`), no-break space (`U+00A0`), en/em spaces (`U+2000` - `U+200B`), hair/thin spaces, zero-width spaces (`U+FEFF`).
  * Omit Non-Printing & Control Characters: `U+0000` to `U+001F`, `U+007F` to `U+009F`, soft hyphen (`U+00AD`).
  * Omit Pathless Glyphs: Discards glyphs without contours unless mapped to visible characters.
* **Deterministic Structured Output:**
  * **Line 1 (Uppercase Latin):** `A B C D E F G H I J K L M N O P Q R S T U V W X Y Z`
  * **Line 2 (Lowercase Latin):** `a b c d e f g h i j k l m n o p q r s t u v w x y z`
  * **Line 3 (Numerals):** `0 1 2 3 4 5 6 7 8 9`
  * **Line 4 (Standard Keyboard Symbols):** `! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { | } ~`
  * **Line 5+ (Remaining Glyphs):** Accented characters, math, currency, and unencoded alternates.
* **Toolbar Actions:**
  * `[ Copy All Glyphs (Layer-Ready) ]`
  * Delimiter toggle: `None` | `Space` | `Newline`
  * `[ Export Character Map as JSON ]` & `[ Download .TXT ]`

### 3. OpenType & Layout Feature Telemetry
* **Detection:** Enumerates GSUB & GPOS tags (`kern`, `liga`, `dlig`, `salt`, `ss01`-`ss20`, `swsh`, `cpsp`, `smcp`, `frac`, `ordn`, `case`, etc.).
* **Interactive Live Toggles:** Toggle individual features to live-update CSS `font-feature-settings`.
* **Ligatures Dictionary:** Visual dictionary mapping base characters to substitutions (e.g. `f + i -> fi`).

### 4. Specimen Testing Sandbox
* **Type Yourself:** Live editable canvas with sliders for `font-size`, `letter-spacing`, `line-height`, alignments, and dark/light color inversion.
* **Waterfall Specimen:** Cascading specimen sizes from 72px down to 8px.
* **Language Support Matrix:** Script coverage testing (Basic Latin, Latin Extended, Cyrillic, Greek, Vietnamese, etc.).

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
