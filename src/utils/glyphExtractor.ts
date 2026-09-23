import type opentype from 'opentype.js';

export type DelimiterOption = 'none' | 'space' | 'newline';

export interface ExtractedGlyphBuckets {
  uppercase: string[];
  lowercase: string[];
  numbers: string[];
  basicSymbols: string[];
  extendedLatin: string[];
  punctuationAndMath: string[];
  otherAndUnencoded: string[];
  totalValidCount: number;
}

export interface ExtractionOptions {
  delimiter: DelimiterOption;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  includeExtended: boolean;
  includePunctuationMath: boolean;
  includeOthers: boolean;
}

export const DEFAULT_EXTRACTION_OPTIONS: ExtractionOptions = {
  delimiter: 'space',
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  includeExtended: true,
  includePunctuationMath: true,
  includeOthers: true,
};

// Standard ASCII Symbols in typical keyboard sequence
const BASIC_SYMBOLS_ORDER = '!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

/**
 * Evaluates whether a codepoint is an excluded whitespace or control character
 */
export function isExcludedCharacter(code: number, char: string): boolean {
  // 1. Control characters: U+0000 - U+001F, U+007F - U+009F, Soft Hyphen U+00AD
  if ((code >= 0x0000 && code <= 0x001F) || (code >= 0x007F && code <= 0x009F) || code === 0x00AD) {
    return true;
  }

  // 2. Whitespaces: U+0020, U+00A0, U+2000 - U+200B, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF
  if (
    code === 0x0020 ||
    code === 0x00A0 ||
    (code >= 0x2000 && code <= 0x200B) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x202F ||
    code === 0x205F ||
    code === 0x3000 ||
    code === 0xFEFF
  ) {
    return true;
  }

  // 3. Regex check for blank / invisible
  if (/[\s\u0000-\u001F\u007F-\u009F\u00A0\u2000-\u200B\uFEFF]/.test(char)) {
    return true;
  }

  return false;
}

/**
 * Extracts and buckets all printable glyphs from an opentype.Font instance
 */
export function extractGlyphBuckets(font: opentype.Font): ExtractedGlyphBuckets {
  const uppercaseSet = new Set<string>();
  const lowercaseSet = new Set<string>();
  const numbersSet = new Set<string>();
  const basicSymbolsSet = new Set<string>();
  const extendedLatinSet = new Set<string>();
  const punctuationMathSet = new Set<string>();
  const otherSet = new Set<string>();

  const numGlyphs = font.glyphs.length;

  for (let i = 0; i < numGlyphs; i++) {
    const glyph = font.glyphs.get(i);
    if (!glyph) continue;

    // Rule 1: Exclude .notdef (Index 0) and any glyph named .notdef
    if (i === 0 || glyph.name === '.notdef') continue;

    // Rule 4: Exclude pathless bounding-box-only glyphs
    const hasPath = glyph.path && glyph.path.commands && glyph.path.commands.length > 0;
    if (!hasPath && !glyph.unicode) {
      continue;
    }

    // Determine characters mapped to this glyph
    const unicodes: number[] = [];
    if (glyph.unicodes && glyph.unicodes.length > 0) {
      unicodes.push(...glyph.unicodes);
    } else if (glyph.unicode !== undefined) {
      unicodes.push(glyph.unicode);
    }

    // If glyph has no unicode mapping, handle PUA or omit if pathless
    if (unicodes.length === 0) {
      if (hasPath && glyph.name && glyph.name !== '.null') {
        // Can be represented by glyph name in alternates list or unencoded
        // We track it for completeness
      }
      continue;
    }

    for (const code of unicodes) {
      let char: string;
      try {
        char = String.fromCodePoint(code);
      } catch {
        continue;
      }

      // Rule 2 & 3: Skip whitespaces, non-printing, and control characters
      if (isExcludedCharacter(code, char)) {
        continue;
      }

      // Rule 4: If path is empty, verify it isn't an invisible codepoint
      if (!hasPath) {
        // Exclude empty glyphs
        continue;
      }

      // 3. Bucket classification
      if (/^[A-Z]$/.test(char)) {
        uppercaseSet.add(char);
      } else if (/^[a-z]$/.test(char)) {
        lowercaseSet.add(char);
      } else if (/^[0-9]$/.test(char)) {
        numbersSet.add(char);
      } else if (BASIC_SYMBOLS_ORDER.includes(char)) {
        basicSymbolsSet.add(char);
      } else if (
        (code >= 0x00C0 && code <= 0x024F) || // Latin-1 Supplement & Latin Extended A/B
        (code >= 0x1E00 && code <= 0x1EFF)    // Latin Extended Additional
      ) {
        extendedLatinSet.add(char);
      } else if (
        (code >= 0x2000 && code <= 0x206F) || // General Punctuation
        (code >= 0x2070 && code <= 0x209F) || // Superscripts and Subscripts
        (code >= 0x20A0 && code <= 0x20CF) || // Currency
        (code >= 0x2100 && code <= 0x214F) || // Letterlike Symbols
        (code >= 0x2190 && code <= 0x21FF) || // Arrows
        (code >= 0x2200 && code <= 0x22FF) || // Mathematical Operators
        (code >= 0x25A0 && code <= 0x25FF) || // Geometric Shapes
        char === '©' || char === '®' || char === '™' || char === '°' || char === '±'
      ) {
        punctuationMathSet.add(char);
      } else {
        otherSet.add(char);
      }
    }
  }

  // Deterministic sorting
  const uppercase = Array.from(uppercaseSet).sort();
  const lowercase = Array.from(lowercaseSet).sort();
  const numbers = Array.from(numbersSet).sort((a, b) => Number(a) - Number(b));

  // Sort basic symbols according to standard keyboard order
  const basicSymbols = Array.from(basicSymbolsSet).sort(
    (a, b) => BASIC_SYMBOLS_ORDER.indexOf(a) - BASIC_SYMBOLS_ORDER.indexOf(b)
  );

  const extendedLatin = Array.from(extendedLatinSet).sort((a, b) => a.localeCompare(b));
  const punctuationAndMath = Array.from(punctuationMathSet).sort();
  const otherAndUnencoded = Array.from(otherSet).sort();

  const totalValidCount =
    uppercase.length +
    lowercase.length +
    numbers.length +
    basicSymbols.length +
    extendedLatin.length +
    punctuationAndMath.length +
    otherAndUnencoded.length;

  return {
    uppercase,
    lowercase,
    numbers,
    basicSymbols,
    extendedLatin,
    punctuationAndMath,
    otherAndUnencoded,
    totalValidCount,
  };
}

/**
 * Formats extracted glyph buckets into a single layer-ready clipboard string
 */
export function formatLayerReadyString(
  buckets: ExtractedGlyphBuckets,
  options: ExtractionOptions = DEFAULT_EXTRACTION_OPTIONS
): string {
  const joiner = options.delimiter === 'space' ? ' ' : options.delimiter === 'newline' ? '\n' : '';
  const lines: string[] = [];

  // Line 1: Uppercase Latin
  if (options.includeUppercase && buckets.uppercase.length > 0) {
    lines.push(buckets.uppercase.join(joiner));
  }

  // Line 2: Lowercase Latin
  if (options.includeLowercase && buckets.lowercase.length > 0) {
    lines.push(buckets.lowercase.join(joiner));
  }

  // Line 3: Numerals
  if (options.includeNumbers && buckets.numbers.length > 0) {
    lines.push(buckets.numbers.join(joiner));
  }

  // Line 4: Standard Keyboard Symbols
  if (options.includeSymbols && buckets.basicSymbols.length > 0) {
    lines.push(buckets.basicSymbols.join(joiner));
  }

  // Line 5: Extended Latin & Diacritics
  if (options.includeExtended && buckets.extendedLatin.length > 0) {
    lines.push(buckets.extendedLatin.join(joiner));
  }

  // Line 6: Punctuation, Currency, Math
  if (options.includePunctuationMath && buckets.punctuationAndMath.length > 0) {
    lines.push(buckets.punctuationAndMath.join(joiner));
  }

  // Line 7: Others & Unencoded
  if (options.includeOthers && buckets.otherAndUnencoded.length > 0) {
    lines.push(buckets.otherAndUnencoded.join(joiner));
  }

  return lines.join('\n');
}

/**
 * Exports character map as structured JSON
 */
export function exportCharacterMapJson(buckets: ExtractedGlyphBuckets, fontName: string): string {
  const data = {
    fontName,
    exportedAt: new Date().toISOString(),
    totalPrintableGlyphs: buckets.totalValidCount,
    tiers: {
      uppercase: { count: buckets.uppercase.length, characters: buckets.uppercase },
      lowercase: { count: buckets.lowercase.length, characters: buckets.lowercase },
      numbers: { count: buckets.numbers.length, characters: buckets.numbers },
      basicSymbols: { count: buckets.basicSymbols.length, characters: buckets.basicSymbols },
      extendedLatin: { count: buckets.extendedLatin.length, characters: buckets.extendedLatin },
      punctuationAndMath: { count: buckets.punctuationAndMath.length, characters: buckets.punctuationAndMath },
      other: { count: buckets.otherAndUnencoded.length, characters: buckets.otherAndUnencoded },
    },
  };

  return JSON.stringify(data, null, 2);
}
