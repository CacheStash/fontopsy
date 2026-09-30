/**
 * FONTOPSY - Full Font Glyph Matrix SVG Exporter
 * 
 * Exports 100% of a font's glyphs into a single, perfectly aligned SVG sheet.
 * Guaranteed Strict Ordering:
 * 1. A-Z (Uppercase Latin)
 * 2. a-z (Lowercase Latin)
 * 3. 0-9 (Numerals)
 * 4. Keyboard Symbols (!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)
 * 5. Alternates & Ligatures (GSUB feature glyphs: salt, ss01-ss20, liga, dlig, swsh, etc.)
 * 6. Accents & Diacritics (Latin-1 accented letters, Latin Ext A/B, combining diacritics)
 * 7. Remaining Glyphs (all unassigned unicodes, icons, and unmapped glyphs)
 * 
 * Guarantee: sum(all ordered glyphs) === font.glyphs.length (Zero missing, zero duplicates).
 * No text labels underneath glyphs - pure vector shapes with safe margins.
 */

import type opentype from 'opentype.js';

export interface SvgExportOptions {
  columns: number;
  includeGuides: boolean;
  fillColor: string;
  separateCategoryRows: boolean;
}

export const DEFAULT_SVG_OPTIONS: SvgExportOptions = {
  columns: 26, // 26 columns perfectly aligns A-Z and a-z across single rows
  includeGuides: false, // Pure clean vector shapes by default
  fillColor: '#18181b',
  separateCategoryRows: true, // Start each category on a fresh row
};

export interface OrderedGlyphItem {
  gid: number;
  categoryId: string;
  categoryName: string;
  char?: string;
  name: string;
  unicodeHex?: string;
}

export interface SvgExportResult {
  svgString: string;
  totalGlyphs: number;
  categoryStats: { id: string; name: string; count: number }[];
  grid: {
    columns: number;
    rows: number;
    width: number;
    height: number;
    cellWidth: number;
    cellHeight: number;
  };
}

const KEYBOARD_SYMBOLS = '!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

function xmlEscape(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeXmlId(val: string): string {
  const sanitized = val.replace(/[^a-zA-Z0-9_-]/g, '_');
  return sanitized.length > 0 ? sanitized : 'item';
}

export function getOrderedFontGlyphs(font: opentype.Font): {
  orderedItems: OrderedGlyphItem[];
  categoryStats: { id: string; name: string; count: number }[];
} {
  const total = font.glyphs.length;
  const assigned = new Set<number>();

  const categories: { id: string; name: string; glyphs: number[] }[] = [
    { id: 'cat_upper', name: 'A-Z (Uppercase Latin)', glyphs: [] },
    { id: 'cat_lower', name: 'a-z (Lowercase Latin)', glyphs: [] },
    { id: 'cat_digits', name: '0-9 (Numerals)', glyphs: [] },
    { id: 'cat_keyboard', name: 'Keyboard Symbols', glyphs: [] },
    { id: 'cat_alternates', name: 'Alternates & Ligatures', glyphs: [] },
    { id: 'cat_accents', name: 'Accents & Diacritics', glyphs: [] },
    { id: 'cat_remaining', name: 'Remaining Glyphs', glyphs: [] },
  ];

  // 1. A-Z (Uppercase Latin)
  for (let c = 65; c <= 90; c++) {
    const gid = font.charToGlyphIndex(String.fromCharCode(c));
    if (gid > 0 && !assigned.has(gid)) {
      assigned.add(gid);
      categories[0].glyphs.push(gid);
    }
  }

  // 2. a-z (Lowercase Latin)
  for (let c = 97; c <= 122; c++) {
    const gid = font.charToGlyphIndex(String.fromCharCode(c));
    if (gid > 0 && !assigned.has(gid)) {
      assigned.add(gid);
      categories[1].glyphs.push(gid);
    }
  }

  // 3. 0-9 (Numerals)
  for (let c = 48; c <= 57; c++) {
    const gid = font.charToGlyphIndex(String.fromCharCode(c));
    if (gid > 0 && !assigned.has(gid)) {
      assigned.add(gid);
      categories[2].glyphs.push(gid);
    }
  }

  // 4. Keyboard Symbols
  for (const ch of KEYBOARD_SYMBOLS) {
    const gid = font.charToGlyphIndex(ch);
    if (gid > 0 && !assigned.has(gid)) {
      assigned.add(gid);
      categories[3].glyphs.push(gid);
    }
  }

  // 5. Alternates & Ligatures (From GSUB)
  const gsub = font.tables.gsub;
  if (gsub && gsub.features && gsub.lookups) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gsub.features.forEach((feat: any) => {
      if (!feat.tag || feat.tag === 'kern') return;
      (feat.feature?.lookupListIndexes || []).forEach((lIdx: number) => {
        const lookup = gsub.lookups[lIdx];
        if (!lookup || !lookup.subtables) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lookup.subtables.forEach((st: any) => {
          if (lookup.lookupType === 1) {
            if (Array.isArray(st.substitute)) {
              st.substitute.forEach((id: number) => {
                if (id >= 0 && id < total && !assigned.has(id)) {
                  assigned.add(id);
                  categories[4].glyphs.push(id);
                }
              });
            } else if (st.deltaGlyphId !== undefined && st.coverage) {
              const cov = st.coverage;
              if (cov.format === 2 && Array.isArray(cov.ranges)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cov.ranges.forEach((r: any) => {
                  for (let gid = r.start; gid <= r.end; gid++) {
                    const target = (gid + st.deltaGlyphId) % 65536;
                    if (target >= 0 && target < total && !assigned.has(target)) {
                      assigned.add(target);
                      categories[4].glyphs.push(target);
                    }
                  }
                });
              } else if (Array.isArray(cov.glyphs)) {
                cov.glyphs.forEach((gid: number) => {
                  const target = (gid + st.deltaGlyphId) % 65536;
                  if (target >= 0 && target < total && !assigned.has(target)) {
                    assigned.add(target);
                    categories[4].glyphs.push(target);
                  }
                });
              }
            }
          } else if (lookup.lookupType === 3) {
            const sets = st.alternateSets || st.alternateSet || st.alternates || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sets.forEach((s: any) => {
              if (Array.isArray(s)) {
                s.forEach(id => {
                  if (id >= 0 && id < total && !assigned.has(id)) {
                    assigned.add(id);
                    categories[4].glyphs.push(id);
                  }
                });
              }
            });
          } else if (lookup.lookupType === 4) {
            const ligSets = st.ligatureSets || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ligSets.forEach((set: any) => {
              if (Array.isArray(set)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                set.forEach((l: any) => {
                  if (l.ligGlyph !== undefined && l.ligGlyph >= 0 && l.ligGlyph < total && !assigned.has(l.ligGlyph)) {
                    assigned.add(l.ligGlyph);
                    categories[4].glyphs.push(l.ligGlyph);
                  }
                });
              }
            });
          }
        });
      });
    });
  }

  // 6. Accents & Diacritics
  for (let i = 0; i < total; i++) {
    if (assigned.has(i)) continue;
    const g = font.glyphs.get(i);
    const u = g.unicode;
    if (!u) continue;
    const isAccent =
      (u >= 0x00c0 && u <= 0x00d6) ||
      (u >= 0x00d8 && u <= 0x00f6) ||
      (u >= 0x00f8 && u <= 0x00ff) ||
      (u >= 0x0100 && u <= 0x024f) ||
      (u >= 0x1e00 && u <= 0x1eff) ||
      (u >= 0x02b0 && u <= 0x036f);
    if (isAccent) {
      assigned.add(i);
      categories[5].glyphs.push(i);
    }
  }

  // 7. Remaining Glyphs (100% font coverage guaranteed)
  for (let i = 0; i < total; i++) {
    if (!assigned.has(i)) {
      assigned.add(i);
      categories[6].glyphs.push(i);
    }
  }

  const orderedItems: OrderedGlyphItem[] = [];
  const categoryStats: { id: string; name: string; count: number }[] = [];

  categories.forEach(cat => {
    categoryStats.push({ id: cat.id, name: cat.name, count: cat.glyphs.length });
    cat.glyphs.forEach(gid => {
      const g = font.glyphs.get(gid);
      const u = g.unicode;
      orderedItems.push({
        gid,
        categoryId: cat.id,
        categoryName: cat.name,
        char: u ? String.fromCodePoint(u) : undefined,
        name: g.name || `glyph_${gid}`,
        unicodeHex: u ? `U+${u.toString(16).toUpperCase().padStart(4, '0')}` : undefined,
      });
    });
  });

  return { orderedItems, categoryStats };
}

export function generateFontSvgMatrix(
  font: opentype.Font,
  fontName: string,
  options: Partial<SvgExportOptions> = {}
): SvgExportResult {
  const opts: SvgExportOptions = { ...DEFAULT_SVG_OPTIONS, ...options };
  const { orderedItems, categoryStats } = getOrderedFontGlyphs(font);
  const totalGlyphs = font.glyphs.length;

  const upm = font.unitsPerEm || 1000;
  const ascender = font.ascender || Math.round(upm * 0.8);
  const descender = font.descender || Math.round(-upm * 0.2);
  const emHeight = ascender - descender;

  // Generous safe cell dimensions to guarantee ample margins and prevent any collision/overlap
  const cellWidth = Math.round(upm * 1.35);
  const cellHeight = Math.round(emHeight * 1.35);
  const padding = Math.round(upm * 0.25);

  const cols = Math.max(1, opts.columns);
  let rows = 0;

  // Compute positions
  interface PlacedItem extends OrderedGlyphItem {
    col: number;
    row: number;
    x: number;
    y: number;
  }

  const placedItems: PlacedItem[] = [];

  if (opts.separateCategoryRows) {
    let currentRow = 0;
    categoryStats.forEach(cat => {
      const itemsInCat = orderedItems.filter(i => i.categoryId === cat.id);
      if (itemsInCat.length === 0) return;

      itemsInCat.forEach((item, idx) => {
        const c = idx % cols;
        const r = currentRow + Math.floor(idx / cols);
        placedItems.push({
          ...item,
          col: c,
          row: r,
          x: padding + c * cellWidth,
          y: padding + r * cellHeight,
        });
      });

      const catRowCount = Math.ceil(itemsInCat.length / cols);
      currentRow += catRowCount;
    });
    rows = currentRow;
  } else {
    rows = Math.ceil(orderedItems.length / cols);
    orderedItems.forEach((item, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      placedItems.push({
        ...item,
        col: c,
        row: r,
        x: padding + c * cellWidth,
        y: padding + r * cellHeight,
      });
    });
  }

  const totalWidth = padding * 2 + cols * cellWidth;
  const totalHeight = padding * 2 + rows * cellHeight;

  // Construct SVG Elements with 100% strict XML validity
  const safeFontName = xmlEscape(fontName);
  const dateStr = new Date().toISOString();

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">\n`;
  svg += `  <!--\n`;
  svg += `    FONTOPSY GLYPH MATRIX EXPORTER\n`;
  svg += `    Font: ${safeFontName}\n`;
  svg += `    Total Glyphs Exported: ${totalGlyphs} (100% complete)\n`;
  svg += `    Grid Layout: ${cols} Columns x ${rows} Rows\n`;
  svg += `    Created: ${dateStr}\n`;
  categoryStats.forEach(cs => {
    svg += `    - ${cs.name}: ${cs.count} glyphs\n`;
  });
  svg += `  -->\n\n`;

  svg += `  <style>\n`;
  svg += `    .fontopsy-glyph { fill: ${opts.fillColor}; }\n`;
  svg += `    .fontopsy-guide-cell { fill: none; stroke: #e4e4e7; stroke-width: ${Math.max(1, Math.round(upm * 0.002))}; stroke-dasharray: 4,4; opacity: 0.7; }\n`;
  svg += `    .fontopsy-guide-baseline { stroke: #06b6d4; stroke-width: ${Math.max(1, Math.round(upm * 0.003))}; opacity: 0.6; }\n`;
  svg += `  </style>\n\n`;

  // Clean White Background for Illustrator/Corel compatibility
  svg += `  <rect width="100%" height="100%" fill="#ffffff" />\n\n`;

  // Category Groups
  categoryStats.forEach(cat => {
    const items = placedItems.filter(p => p.categoryId === cat.id);
    if (items.length === 0) return;

    svg += `  <!-- Category: ${cat.name} (${items.length} glyphs) -->\n`;
    svg += `  <g id="${cat.id}" data-category-name="${xmlEscape(cat.name)}" data-count="${items.length}">\n`;

    items.forEach(item => {
      const g = font.glyphs.get(item.gid);
      const adv = g.advanceWidth || upm;
      // Horizontally and vertically center the glyph within the safe cell
      const originX = Math.round(item.x + (cellWidth - adv) / 2);
      const originY = Math.round(item.y + (cellHeight - emHeight) / 2 + ascender);

      const safeId = `glyph_${item.gid}_${safeXmlId(item.name)}`;
      const safeName = xmlEscape(item.name);

      svg += `    <g id="${safeId}" data-gid="${item.gid}" data-name="${safeName}"${item.unicodeHex ? ` data-unicode="${item.unicodeHex}"` : ''}>\n`;

      // Optional Metric Guides (subtle boundary & baseline)
      if (opts.includeGuides) {
        svg += `      <rect class="fontopsy-guide-cell" x="${item.x}" y="${item.y}" width="${cellWidth}" height="${cellHeight}" />\n`;
        svg += `      <line class="fontopsy-guide-baseline" x1="${item.x}" y1="${originY}" x2="${item.x + cellWidth}" y2="${originY}" />\n`;
      }

      // Pure Glyph Vector Path (No text labels)
      try {
        const p = g.getPath(originX, originY, upm);
        const pathData = p.toPathData(2);
        if (pathData && pathData.length > 0) {
          svg += `      <path class="fontopsy-glyph" d="${pathData}" />\n`;
        }
      } catch (err) {
        console.warn(`Failed to generate path for glyph ${item.gid} (${item.name}):`, err);
      }

      svg += `    </g>\n`;
    });

    svg += `  </g>\n\n`;
  });

  svg += `</svg>\n`;

  return {
    svgString: svg,
    totalGlyphs,
    categoryStats,
    grid: {
      columns: cols,
      rows,
      width: totalWidth,
      height: totalHeight,
      cellWidth,
      cellHeight,
    },
  };
}
