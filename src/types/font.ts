import type opentype from 'opentype.js';

export type FontFormat = 'OTF' | 'TTF' | 'WOFF' | 'WOFF2' | 'UNKNOWN';

export interface FontMetadata {
  familyName: string;
  styleName: string;
  fullName: string;
  postscriptName: string;
  version: string;
  uniqueId: string;
  designer: string;
  designerUrl: string;
  manufacturer: string;
  copyright: string;
  license: string;
  licenseUrl: string;
  description: string;
  upm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  weightClass: number;
  widthClass: number;
  italicAngle: number;
  fileSize: number;
  fileName: string;
  format: FontFormat;
  numGlyphs: number;
  isVariable: boolean;
}

export interface GlyphDetail {
  index: number; // Glyph ID (GID)
  name: string;
  unicode?: number;
  char?: string;
  unicodeHex?: string;
  advanceWidth: number;
  leftSideBearing: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  pathSvg: string;
  hasContours: boolean;
  commandsCount: number;
}

export interface OpenTypeFeature {
  tag: string;
  name: string;
  description: string;
  type: 'gsub' | 'gpos';
  count: number;
  enabled: boolean;
}

export interface VariableAxis {
  tag: string;
  name: string;
  min: number;
  default: number;
  max: number;
  value: number;
}

export interface LigatureSubstitution {
  feature: string;
  sub: string[];
  by: string;
  subString: string;
  byString: string;
}

export interface ParsedFontResult {
  font: opentype.Font;
  rawBuffer: ArrayBuffer;
  metadata: FontMetadata;
  glyphs: GlyphDetail[];
  features: OpenTypeFeature[];
  variableAxes: VariableAxis[];
  ligatures: LigatureSubstitution[];
  fontFamilyCssName: string;
}
