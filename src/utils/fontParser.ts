import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';
import type {
  FontFormat,
  FontMetadata,
  GlyphDetail,
  OpenTypeFeature,
  VariableAxis,
  LigatureSubstitution,
  ParsedFontResult,
} from '../types/font';

// Known OpenType feature definitions
const FEATURE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  kern: { name: 'Kerning', description: 'Adjusts spacing between specific glyph pairs.' },
  liga: { name: 'Standard Ligatures', description: 'Replaces character sequences with single ligature glyphs (fi, fl).' },
  dlig: { name: 'Discretionary Ligatures', description: 'Decorative ligatures designed for artistic or display use (st, ct).' },
  hlig: { name: 'Historical Ligatures', description: 'Historical ligature connections (long s, ct, st).' },
  calt: { name: 'Contextual Alternates', description: 'Substitutes glyphs based on neighboring character context.' },
  salt: { name: 'Stylistic Alternates', description: 'Replaces default glyphs with stylistic design alternates.' },
  swsh: { name: 'Swashes', description: 'Replaces standard characters with decorative swashes and flourishes.' },
  cpsp: { name: 'Capital Spacing', description: 'Adjusts inter-character spacing when typing uppercase text.' },
  smcp: { name: 'Small Capitals', description: 'Turns lowercase characters into small capital forms.' },
  c2sc: { name: 'Capitals to Small Caps', description: 'Converts uppercase characters to small capitals.' },
  frac: { name: 'Fractions', description: 'Replaces figures separated by slash with diagonal fractions.' },
  ordn: { name: 'Ordinals', description: 'Replaces numbers followed by letters with ordinal forms (1st, 2nd).' },
  onum: { name: 'Oldstyle Figures', description: 'Figures with varying ascenders and descenders for text flow.' },
  lnum: { name: 'Lining Figures', description: 'All figures match the cap-height (standard modern numbers).' },
  pnum: { name: 'Proportional Figures', description: 'Numbers with variable spacing based on their width.' },
  tnum: { name: 'Tabular Figures', description: 'Monospaced numbers for tables and financial ledgers.' },
  zero: { name: 'Slashed Zero', description: 'Adds slash through zero to distinguish from capital O.' },
  case: { name: 'Case-Sensitive Forms', description: 'Shifts punctuation upwards to align with capital letters.' },
  subs: { name: 'Subscript', description: 'Renders inferior figures and punctuation below the baseline.' },
  sups: { name: 'Superscript', description: 'Renders superior figures and punctuation above the cap-height.' },
  titl: { name: 'Titling Alternates', description: 'Custom letterforms designed specifically for large headlines.' },
};

// Add ss01 - ss20 stylistic sets
for (let i = 1; i <= 20; i++) {
  const tag = `ss${i.toString().padStart(2, '0')}`;
  FEATURE_DESCRIPTIONS[tag] = {
    name: `Stylistic Set ${i}`,
    description: `Alternate visual glyph set variant #${i}.`,
  };
}

// Detect font format by reading magic header bytes
export function detectFontFormat(buffer: ArrayBuffer): FontFormat {
  const view = new DataView(buffer);
  if (buffer.byteLength < 4) return 'UNKNOWN';

  const magic = view.getUint32(0, false);

  // wOF2 = 0x774F4632
  if (magic === 0x774f4632) return 'WOFF2';
  // wOFF = 0x774F4646
  if (magic === 0x774f4646) return 'WOFF';
  // OTTO (OpenType with CFF outlines) = 0x4F54544F
  if (magic === 0x4f54544f) return 'OTF';
  // 0x00010000 or 'true' (0x74727565) or 'typ1' = TrueType
  if (magic === 0x00010000 || magic === 0x74727565 || magic === 0x74797031) return 'TTF';

  return 'UNKNOWN';
}

// Injects custom @font-face rule into document head
export function registerFontFace(fontName: string, buffer: ArrayBuffer): string {
  const blob = new Blob([buffer], { type: 'font/opentype' });
  const url = URL.createObjectURL(blob);
  const fontFaceStyleId = 'fontopsy-dynamic-fontface';

  let styleEl = document.getElementById(fontFaceStyleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = fontFaceStyleId;
    document.head.appendChild(styleEl);
  }

  const css = `
    @font-face {
      font-family: '${fontName}';
      src: url('${url}') format('opentype');
      font-display: swap;
    }
  `;
  styleEl.textContent = css;

  return fontName;
}

// Parse font file and extract forensic metadata
export async function parseFontFile(
  fileBuffer: ArrayBuffer,
  fileName: string
): Promise<ParsedFontResult> {
  const format = detectFontFormat(fileBuffer);
  let sfntBuffer = fileBuffer;

  // Decompress WOFF2 if needed
  if (format === 'WOFF2') {
    try {
      const decompressed = await wawoff2.decompress(new Uint8Array(fileBuffer));
      sfntBuffer = decompressed.buffer.slice(
        decompressed.byteOffset,
        decompressed.byteOffset + decompressed.byteLength
      ) as ArrayBuffer;
    } catch (err) {
      console.warn('wawoff2 decompression warning, attempting direct parse:', err);
    }
  }

  // Parse font via opentype.js
  const font = opentype.parse(sfntBuffer);

  // Extract Metadata
  const names = font.names;
  const namesObj = names as unknown as Record<string, Record<string, string> | undefined>;
  const os2 = font.tables.os2 || {};
  const head = font.tables.head || {};
  const hhea = font.tables.hhea || {};

  const familyName =
    names.fontFamily?.en ||
    names.fontFamily?.[Object.keys(names.fontFamily)[0]] ||
    fileName.replace(/\.[^/.]+$/, '');

  const styleName =
    names.fontSubfamily?.en ||
    names.fontSubfamily?.[Object.keys(names.fontSubfamily)[0]] ||
    'Regular';

  const fullName =
    names.fullName?.en ||
    names.fullName?.[Object.keys(names.fullName)[0]] ||
    `${familyName} ${styleName}`;

  const postscriptName =
    names.postScriptName?.en ||
    names.postScriptName?.[Object.keys(names.postScriptName)[0]] ||
    familyName.replace(/\s+/g, '-');

  const version =
    names.version?.en ||
    names.version?.[Object.keys(names.version)[0]] ||
    '1.000';

  const uniqueId =
    namesObj.uniqueID?.en ||
    (namesObj.uniqueID ? namesObj.uniqueID[Object.keys(namesObj.uniqueID)[0]] : '') ||
    '';

  const designer =
    names.designer?.en ||
    names.designer?.[Object.keys(names.designer)[0]] ||
    'Unknown';

  const designerUrl =
    names.designerURL?.en ||
    names.designerURL?.[Object.keys(names.designerURL)[0]] ||
    '';

  const manufacturer =
    names.manufacturer?.en ||
    names.manufacturer?.[Object.keys(names.manufacturer)[0]] ||
    '';

  const copyright =
    names.copyright?.en ||
    names.copyright?.[Object.keys(names.copyright)[0]] ||
    '';

  const license =
    names.license?.en ||
    names.license?.[Object.keys(names.license)[0]] ||
    '';

  const licenseUrl =
    names.licenseURL?.en ||
    names.licenseURL?.[Object.keys(names.licenseURL)[0]] ||
    '';

  const description =
    names.description?.en ||
    names.description?.[Object.keys(names.description)[0]] ||
    '';

  const upm = font.unitsPerEm || head.unitsPerEm || 1000;
  const ascent = font.ascender || hhea.ascender || os2.sTypoAscender || 800;
  const descent = font.descender || hhea.descender || os2.sTypoDescender || -200;
  const lineGap = hhea.lineGap || os2.sTypoLineGap || 0;
  const weightClass = os2.usWeightClass || 400;
  const widthClass = os2.usWidthClass || 5;
  const italicAngle = font.tables.post?.italicAngle || 0;

  // Check Variable Font (fvar table)
  const fvar = font.tables.fvar;
  const isVariable = Boolean(fvar && fvar.axes && fvar.axes.length > 0);
  const variableAxes: VariableAxis[] = [];

  if (isVariable && fvar.axes) {
    fvar.axes.forEach((axis: { tag: string; name?: Record<string, string>; minValue: number; defaultValue: number; maxValue: number }) => {
      const name = axis.name?.en || axis.tag;
      variableAxes.push({
        tag: axis.tag,
        name,
        min: axis.minValue,
        default: axis.defaultValue,
        max: axis.maxValue,
        value: axis.defaultValue,
      });
    });
  }

  // Extract Glyphs Detail
  const glyphs: GlyphDetail[] = [];
  const numGlyphs = font.glyphs.length;

  for (let i = 0; i < numGlyphs; i++) {
    const g = font.glyphs.get(i);
    const hasContours = Boolean(g.path && g.path.commands && g.path.commands.length > 0);
    const commandsCount = g.path?.commands ? g.path.commands.length : 0;

    // SVG path representation
    let pathSvg = '';
    if (hasContours) {
      try {
        pathSvg = g.getPath(0, 0, 72).toPathData(2);
      } catch {
        pathSvg = '';
      }
    }

    const char = g.unicode ? String.fromCodePoint(g.unicode) : undefined;
    const unicodeHex = g.unicode
      ? `U+${g.unicode.toString(16).toUpperCase().padStart(4, '0')}`
      : undefined;

    glyphs.push({
      index: i,
      name: g.name || `glyph_${i}`,
      unicode: g.unicode,
      char,
      unicodeHex,
      advanceWidth: g.advanceWidth || 0,
      leftSideBearing: g.leftSideBearing || 0,
      xMin: g.xMin,
      xMax: g.xMax,
      yMin: g.yMin,
      yMax: g.yMax,
      pathSvg,
      hasContours,
      commandsCount,
    });
  }

  // Extract Layout Features (GSUB / GPOS)
  const featuresMap = new Map<string, OpenTypeFeature>();

  const processTableFeatures = (table: { features?: Array<{ tag: string }> }, type: 'gsub' | 'gpos') => {
    if (!table || !table.features) return;
    table.features.forEach(f => {
      const tag = f.tag;
      const def = FEATURE_DESCRIPTIONS[tag] || {
        name: tag.toUpperCase(),
        description: `OpenType layout feature tag '${tag}'`,
      };

      if (!featuresMap.has(tag)) {
        featuresMap.set(tag, {
          tag,
          name: def.name,
          description: def.description,
          type,
          count: 1,
          enabled: tag === 'kern' || tag === 'liga', // Default on for kerning & standard ligatures
        });
      } else {
        const item = featuresMap.get(tag)!;
        item.count++;
      }
    });
  };

  if (font.tables.gsub) {
    processTableFeatures(font.tables.gsub as unknown as { features?: Array<{ tag: string }> }, 'gsub');
  }
  if (font.tables.gpos) {
    processTableFeatures(font.tables.gpos as unknown as { features?: Array<{ tag: string }> }, 'gpos');
  }

  const features = Array.from(featuresMap.values()).sort((a, b) => a.tag.localeCompare(b.tag));

  // Extract Ligature Substitutions (from GSUB table)
  const ligatures: LigatureSubstitution[] = [];
  try {
    const gsub = font.tables.gsub;
    if (gsub && gsub.lookups) {
      gsub.lookups.forEach((lookup: { lookupType: number; subtables?: Array<{ subtable?: { ligatureSets?: Array<Array<{ components: number[]; ligGlyph: number }>> } }> }) => {
        // Ligature Substitution lookupType is 4
        if (lookup.lookupType === 4 && lookup.subtables) {
          lookup.subtables.forEach(st => {
            const ligSets = (st as unknown as { ligatureSets?: Array<Array<{ components: number[]; ligGlyph: number }>> }).ligatureSets;
            if (ligSets) {
              ligSets.forEach((set, firstGlyphIndex) => {
                const firstGlyph = font.glyphs.get(firstGlyphIndex);
                if (!set || !firstGlyph) return;

                set.forEach(lig => {
                  const compGlyphs = [firstGlyph, ...lig.components.map(idx => font.glyphs.get(idx))];
                  const resultGlyph = font.glyphs.get(lig.ligGlyph);

                  if (resultGlyph) {
                    const subChars = compGlyphs.map(g => (g.unicode ? String.fromCodePoint(g.unicode) : g.name)).join('');
                    const byChar = resultGlyph.unicode ? String.fromCodePoint(resultGlyph.unicode) : resultGlyph.name;

                    ligatures.push({
                      feature: 'liga',
                      sub: compGlyphs.map(g => g.name || ''),
                      by: resultGlyph.name || '',
                      subString: subChars,
                      byString: byChar || '',
                    });
                  }
                });
              });
            }
          });
        }
      });
    }
  } catch (err) {
    console.warn('Ligature extraction exception:', err);
  }

  // Register font in DOM
  const fontFamilyCssName = `Fontopsy_${postscriptName}_${Date.now()}`;
  registerFontFace(fontFamilyCssName, sfntBuffer);

  const metadata: FontMetadata = {
    familyName,
    styleName,
    fullName,
    postscriptName,
    version,
    uniqueId,
    designer,
    designerUrl,
    manufacturer,
    copyright,
    license,
    licenseUrl,
    description,
    upm,
    ascent,
    descent,
    lineGap,
    weightClass,
    widthClass,
    italicAngle,
    fileSize: fileBuffer.byteLength,
    fileName,
    format,
    numGlyphs,
    isVariable,
  };

  return {
    font,
    rawBuffer: sfntBuffer,
    metadata,
    glyphs,
    features,
    variableAxes,
    ligatures,
    fontFamilyCssName,
  };
}
