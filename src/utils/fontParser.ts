import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';
import type {
  FontFormat,
  FontMetadata,
  GlyphDetail,
  OpenTypeFeature,
  VariableAxis,
  VariableInstance,
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
  const fontFaceStyleId = `fontopsy-face-${fontName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

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

// Robust multi-platform name record extractor supporting Windows, Mac, Unicode, and numeric nameIDs
function extractNameRecord(font: opentype.Font, propNames: string[], nameIds: number[]): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawFont = font as any;
  const containers: Array<Record<string, any> | undefined> = [
    rawFont.names?.windows,
    rawFont.names?.macintosh,
    rawFont.names?.unicode,
    rawFont.names,
    rawFont.tables?.name?.windows,
    rawFont.tables?.name?.macintosh,
    rawFont.tables?.name?.unicode,
    rawFont.tables?.name,
  ];

  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;

    // 1. Check string property names (e.g., 'designer', 'designerURL')
    for (const prop of propNames) {
      const val = container[prop];
      if (val !== undefined && val !== null) {
        if (typeof val === 'string' && val.trim().length > 0) return val.trim();
        if (typeof val === 'object') {
          if (typeof val.en === 'string' && val.en.trim().length > 0) return val.en.trim();
          const firstKey = Object.keys(val)[0];
          if (firstKey && typeof val[firstKey] === 'string' && val[firstKey].trim().length > 0) {
            return val[firstKey].trim();
          }
        }
      }
    }

    // 2. Check numeric name IDs (e.g., 9 for designer, 8 for manufacturer, 0 for copyright)
    for (const id of nameIds) {
      const val = container[id] || container[String(id)];
      if (val !== undefined && val !== null) {
        if (typeof val === 'string' && val.trim().length > 0) return val.trim();
        if (typeof val === 'object') {
          if (typeof val.en === 'string' && val.en.trim().length > 0) return val.en.trim();
          const firstKey = Object.keys(val)[0];
          if (firstKey && typeof val[firstKey] === 'string' && val[firstKey].trim().length > 0) {
            return val[firstKey].trim();
          }
        }
      }
    }
  }

  // 3. Fallback: check raw records array if available
  if (Array.isArray(rawFont.tables?.name?.records)) {
    for (const id of nameIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = rawFont.tables.name.records.find((r: any) => r.nameID === id && r.string);
      if (rec && typeof rec.string === 'string' && rec.string.trim().length > 0) {
        return rec.string.trim();
      }
    }
  }

  return '';
}

  // Extract Metadata
  const os2 = font.tables.os2 || {};
  const head = font.tables.head || {};
  const hhea = font.tables.hhea || {};

  const familyName =
    extractNameRecord(font, ['preferredFamily', 'fontFamily'], [16, 1]) ||
    fileName.replace(/\.[^/.]+$/, '');

  const styleName =
    extractNameRecord(font, ['preferredSubfamily', 'fontSubfamily'], [17, 2]) ||
    'Regular';

  const fullName =
    extractNameRecord(font, ['fullName'], [4]) ||
    `${familyName} ${styleName}`;

  const postscriptName =
    extractNameRecord(font, ['postScriptName'], [6]) ||
    familyName.replace(/\s+/g, '-');

  const version =
    extractNameRecord(font, ['version'], [5]) ||
    '1.000';

  const uniqueId =
    extractNameRecord(font, ['uniqueID'], [3]);

  const designer =
    extractNameRecord(font, ['designer'], [9]) ||
    'Unknown';

  const designerUrl =
    extractNameRecord(font, ['designerURL'], [12]);

  const manufacturer =
    extractNameRecord(font, ['manufacturer'], [8]);

  const vendorId =
    (typeof os2.achVendID === 'string' && os2.achVendID.trim().length > 0)
      ? os2.achVendID.trim()
      : '';

  const vendorUrl =
    extractNameRecord(font, ['vendorURL', 'manufacturerURL'], [11]);

  const copyright =
    extractNameRecord(font, ['copyright'], [0]);

  const trademark =
    extractNameRecord(font, ['trademark'], [7]);

  const license =
    extractNameRecord(font, ['license'], [13]);

  const licenseUrl =
    extractNameRecord(font, ['licenseURL'], [14]);

  const description =
    extractNameRecord(font, ['description'], [10]);

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
  const variableInstances: VariableInstance[] = [];

  const KNOWN_AXIS_NAMES: Record<string, string> = {
    wght: 'Weight',
    wdth: 'Width',
    slnt: 'Slant',
    ital: 'Italic',
    opsz: 'Optical size',
    GRAD: 'Grade',
    XTRA: 'Parametric Extra Width',
    XOPQ: 'Parametric Opaque Width',
    YOPQ: 'Parametric Opaque Height',
    YTLC: 'Parametric Lowercase Height',
    YTUC: 'Parametric Uppercase Height',
    YTAS: 'Parametric Ascender Height',
    YTDE: 'Parametric Descender Depth',
  };

  if (isVariable && fvar.axes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fvar.axes.forEach((axis: any) => {
      const tag = axis.tag;
      let name = axis.name?.en;
      if (!name && typeof axis.name === 'string') name = axis.name;
      if (!name) name = KNOWN_AXIS_NAMES[tag] || tag.toUpperCase();

      variableAxes.push({
        tag,
        name,
        min: axis.minValue,
        default: axis.defaultValue,
        max: axis.maxValue,
        value: axis.defaultValue,
      });
    });

    if (fvar.instances && Array.isArray(fvar.instances)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fvar.instances.forEach((inst: any) => {
        let name = inst.name?.en;
        if (!name && typeof inst.name === 'string') name = inst.name;
        if (!name) name = `Instance ${variableInstances.length + 1}`;

        if (inst.coordinates) {
          variableInstances.push({
            name,
            coordinates: inst.coordinates,
          });
        }
      });
    }
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
    vendorId,
    vendorUrl,
    copyright,
    trademark,
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
    variableInstances,
    ligatures,
    fontFamilyCssName,
  };
}
