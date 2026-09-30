/**
 * Deterministic Non-Overlapping Glyph Classifier
 * Partitions 100% of a font's glyphs into mutually exclusive categories:
 * - Uppercase Latin (A-Z)
 * - Lowercase Latin (a-z)
 * - Numerals (0-9)
 * - Keyboard Symbols
 * - OpenType Layout Features (liga, dlig, salt, swsh, ss01-ss20, etc.)
 * - External Symbols & Extended (remaining glyphs)
 * 
 * Guarantee: sum(category.count) === font.glyphs.length (Zero overlapping).
 */

import type opentype from 'opentype.js';

export interface GlyphCategory {
  id: string;
  name: string;
  tag?: string;
  description: string;
  glyphIndices: number[];
  count: number;
}

export interface FontClassificationResult {
  categories: GlyphCategory[];
  totalGlyphs: number;
  totalCategorized: number;
  matchesTotal: boolean;
}

const KEYBOARD_SYMBOLS = '!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

const FEATURE_NAMES: Record<string, { name: string; desc: string }> = {
  liga: { name: 'Standard Ligatures', desc: 'Default typographic ligatures (fi, fl, ffi)' },
  dlig: { name: 'Discretionary Ligatures', desc: 'Decorative display ligatures (st, ct, sp)' },
  hlig: { name: 'Historical Ligatures', desc: 'Historical ligature connections' },
  salt: { name: 'Stylistic Alternates', desc: 'Stylistic character substitutions' },
  swsh: { name: 'Swashes', desc: 'Decorative flourishes and swashes' },
  titl: { name: 'Titling Alternates', desc: 'Display capitals for headlines' },
  calt: { name: 'Contextual Alternates', desc: 'Context-driven glyph variants' },
  case: { name: 'Case-Sensitive Forms', desc: 'Punctuation shifted for all-caps' },
  smcp: { name: 'Small Capitals', desc: 'Lowercase replaced with small caps' },
  c2sc: { name: 'Capitals to Small Caps', desc: 'Uppercase replaced with small caps' },
  frac: { name: 'Fractions', desc: 'Pre-composed diagonal fractions' },
  ordn: { name: 'Ordinals', desc: 'Superior ordinal letters (1st, 2nd, a, o)' },
  zero: { name: 'Slashed Zero', desc: 'Slashed zero figure variants' },
  numr: { name: 'Numerators', desc: 'Numerator fraction figures' },
  dnom: { name: 'Denominators', desc: 'Denominator fraction figures' },
  sups: { name: 'Superscript', desc: 'Superior figures and glyphs' },
  subs: { name: 'Subscript / Inferiors', desc: 'Inferior figures and glyphs' },
  sinf: { name: 'Scientific Inferiors', desc: 'Chemical and math inferior figures' },
  pnum: { name: 'Proportional Figures', desc: 'Proportional width numeral variants' },
  tnum: { name: 'Tabular Figures', desc: 'Monospaced numeral variants' },
  onum: { name: 'Oldstyle Figures', desc: 'Figures with ascenders and descenders' },
  lnum: { name: 'Lining Figures', desc: 'Modern cap-height figures' },
};

// ss01 - ss20 names
for (let i = 1; i <= 20; i++) {
  const tag = `ss${i.toString().padStart(2, '0')}`;
  FEATURE_NAMES[tag] = {
    name: `Stylistic Set ${i}`,
    desc: `Alternate visual set variant #${i}`,
  };
}

export function classifyFontGlyphs(font: opentype.Font): FontClassificationResult {
  const totalGlyphs = font.glyphs.length;
  const assigned = new Set<number>();
  const categories: GlyphCategory[] = [];

  const addCategory = (
    id: string,
    name: string,
    description: string,
    glyphIndices: number[],
    tag?: string
  ) => {
    const uniqueUnassigned: number[] = [];
    glyphIndices.forEach(idx => {
      if (idx >= 0 && idx < totalGlyphs && !assigned.has(idx)) {
        assigned.add(idx);
        uniqueUnassigned.push(idx);
      }
    });

    if (uniqueUnassigned.length > 0) {
      categories.push({
        id,
        name,
        tag,
        description,
        glyphIndices: uniqueUnassigned,
        count: uniqueUnassigned.length,
      });
    }
  };

  // 1. A-Z (Uppercase Latin)
  const azUpper: number[] = [];
  for (let c = 65; c <= 90; c++) {
    const g = font.charToGlyphIndex(String.fromCharCode(c));
    if (g > 0) azUpper.push(g);
  }
  addCategory('latin_upper', 'Uppercase Latin (A-Z)', 'Standard uppercase Latin alphabet', azUpper);

  // 2. a-z (Lowercase Latin)
  const azLower: number[] = [];
  for (let c = 97; c <= 122; c++) {
    const g = font.charToGlyphIndex(String.fromCharCode(c));
    if (g > 0) azLower.push(g);
  }
  addCategory('latin_lower', 'Lowercase Latin (a-z)', 'Standard lowercase Latin alphabet', azLower);

  // 3. 0-9 (Numerals)
  const digits: number[] = [];
  for (let c = 48; c <= 57; c++) {
    const g = font.charToGlyphIndex(String.fromCharCode(c));
    if (g > 0) digits.push(g);
  }
  addCategory('numerals', 'Numerals (0-9)', 'Standard decimal figures', digits);

  // 4. Keyboard Symbols
  const kbSyms: number[] = [];
  for (const ch of KEYBOARD_SYMBOLS) {
    const g = font.charToGlyphIndex(ch);
    if (g > 0) kbSyms.push(g);
  }
  addCategory(
    'keyboard_symbols',
    'Keyboard Symbols',
    'Standard printable keyboard punctuation and symbols',
    kbSyms
  );

  // 5. OpenType Layout Substitution Features (from GSUB)
  const gsub = font.tables.gsub;
  const featureGlyphs: Record<string, number[]> = {};

  if (gsub && gsub.features && gsub.lookups) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gsub.features.forEach((feat: any) => {
      const tag = feat.tag;
      // Exclude kern or empty tags
      if (!tag || tag === 'kern') return;
      if (!featureGlyphs[tag]) featureGlyphs[tag] = [];

      (feat.feature?.lookupListIndexes || []).forEach((lIdx: number) => {
        const lookup = gsub.lookups[lIdx];
        if (!lookup || !lookup.subtables) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lookup.subtables.forEach((st: any) => {
          // Type 1: Single substitution
          if (lookup.lookupType === 1) {
            if (Array.isArray(st.substitute)) {
              st.substitute.forEach((id: number) => featureGlyphs[tag].push(id));
            } else if (st.deltaGlyphId !== undefined && st.coverage) {
              const cov = st.coverage;
              if (cov.format === 2 && Array.isArray(cov.ranges)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cov.ranges.forEach((r: any) => {
                  for (let gid = r.start; gid <= r.end; gid++) {
                    featureGlyphs[tag].push((gid + st.deltaGlyphId) % 65536);
                  }
                });
              } else if (Array.isArray(cov.glyphs)) {
                cov.glyphs.forEach((gid: number) =>
                  featureGlyphs[tag].push((gid + st.deltaGlyphId) % 65536)
                );
              }
            }
          }
          // Type 3: Alternate substitution
          else if (lookup.lookupType === 3) {
            const altSets = st.alternateSets || st.alternateSet || st.alternates || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            altSets.forEach((set: any) => {
              if (Array.isArray(set)) {
                set.forEach(id => featureGlyphs[tag].push(id));
              } else if (set && Array.isArray(set.alternateGlyphs)) {
                set.alternateGlyphs.forEach((id: number) => featureGlyphs[tag].push(id));
              } else if (set && Array.isArray(set.glyphs)) {
                set.glyphs.forEach((id: number) => featureGlyphs[tag].push(id));
              }
            });
          }
          // Type 4: Ligature substitution
          else if (lookup.lookupType === 4) {
            const ligSets = st.ligatureSets || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ligSets.forEach((set: any) => {
              if (Array.isArray(set)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                set.forEach((lig: any) => {
                  if (lig.ligGlyph !== undefined) featureGlyphs[tag].push(lig.ligGlyph);
                });
              }
            });
          }
        });
      });
    });
  }

  // Feature prioritization order (specific features prioritized over generic aalt)
  const priorityOrder = [
    'liga', 'dlig', 'hlig', 'salt', 'swsh', 'titl',
    ...Array.from({ length: 20 }, (_, i) => `ss${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 20 }, (_, i) => `cv${String(i + 1).padStart(2, '0')}`),
    'calt', 'frac', 'ordn', 'zero', 'smcp', 'c2sc',
    'sups', 'subs', 'sinf', 'numr', 'dnom', 'pnum', 'tnum', 'onum', 'lnum', 'case', 'ccmp',
  ];

  // Append remaining tags
  Object.keys(featureGlyphs).forEach(tag => {
    if (!priorityOrder.includes(tag) && tag !== 'aalt') {
      priorityOrder.push(tag);
    }
  });
  priorityOrder.push('aalt'); // fallback if anything not claimed yet

  priorityOrder.forEach(tag => {
    if (featureGlyphs[tag] && featureGlyphs[tag].length > 0) {
      const info = FEATURE_NAMES[tag] || {
        name: tag.toUpperCase(),
        desc: `OpenType layout substitution feature '${tag}'`,
      };
      addCategory(
        `feat_${tag}`,
        `${info.name} (${tag})`,
        info.desc,
        featureGlyphs[tag],
        tag
      );
    }
  });

  // 6. External Symbols (All remaining glyphs in font)
  const remaining: number[] = [];
  for (let i = 0; i < totalGlyphs; i++) {
    if (!assigned.has(i)) {
      remaining.push(i);
    }
  }

  addCategory(
    'external_symbols',
    'External Symbols & Extended',
    'Accented glyphs, currency, math, diacritics, and remaining font symbols',
    remaining
  );

  const totalCategorized = categories.reduce((acc, c) => acc + c.count, 0);

  return {
    categories,
    totalGlyphs,
    totalCategorized,
    matchesTotal: totalCategorized === totalGlyphs,
  };
}
