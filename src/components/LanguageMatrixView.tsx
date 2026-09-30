/**
 * PANDUAN PENGEMBANG (INTERNAL GUIDE):
 * - `RasterMetricTile`: Komponen render piksel kanvas (HTML5 Canvas 2D) untuk me-rasterisasi
 *   eksposur kurva vektor master font pada Alternate Popover & Glyph Inspector.
 *   Tujuannya mencegah pembajakan/scraping koordinat kurva Bézier master font dari DOM browser.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type opentype from 'opentype.js';
import { detectLanguageCoverage } from '../utils/languageData';
import { classifyFontGlyphs } from '../utils/glyphClassifier';
import { Globe, Search, CheckCircle2, Sparkles } from 'lucide-react';

interface RasterMetricTileProps {
  glyphIdx: number;
  size?: number;
  fontObj: opentype.Font | null;
  color?: string;
  className?: string;
}

const RasterMetricTile: React.FC<RasterMetricTileProps> = React.memo(
  ({ glyphIdx, size = 28, fontObj, color = '#22d3ee', className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !fontObj) return;

      const glyph = fontObj.glyphs?.get(glyphIdx);
      if (!glyph) return;

      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2.5) : 2;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const unitsPerEm = fontObj.unitsPerEm || 1000;
      const renderSize = size * 0.72;
      const scale = renderSize / unitsPerEm;
      const baseline = renderSize;
      const advanceWidth = (glyph.advanceWidth || unitsPerEm * 0.6) * scale;
      const xOffset = Math.max(0, (size - advanceWidth) / 2);

      try {
        const path = glyph.getPath(xOffset, baseline, renderSize);
        ctx.fillStyle = color;
        path.draw(ctx);
        ctx.fill();
      } catch {
        // Ignored
      }
    }, [glyphIdx, size, fontObj, color]);

    return (
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`pointer-events-none ${className}`}
      />
    );
  }
);

interface LanguageMatrixViewProps {
  font: opentype.Font;
  fontFamily: string;
  featureSettingsCss: string;
  variationSettingsCss?: string;
}

export const LanguageMatrixView: React.FC<LanguageMatrixViewProps> = ({
  font,
  fontFamily,
  featureSettingsCss,
  variationSettingsCss = '"normal"',
}) => {
  const [subView, setSubView] = useState<'languages' | 'features'>('languages');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState<'All' | 'Latin' | 'Cyrillic' | 'Greek'>('All');

  // Compute language detection against active font
  const { results: languageResults, fullySupportedCount } = useMemo(() => {
    return detectLanguageCoverage(font);
  }, [font]);

  // Compute non-overlapping glyph classification (100% font glyphs accounted for, zero overlap)
  const classification = useMemo(() => {
    return classifyFontGlyphs(font);
  }, [font]);

  // Filter ONLY languages that are 100% supported!
  const filteredLanguages = useMemo(() => {
    return languageResults.filter(item => {
      // STRICT: Only 100% fully supported languages
      if (!item.supported) return false;

      // Script filter
      if (selectedScript !== 'All' && item.language.script !== selectedScript) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.language.name.toLowerCase().includes(q);
        const nativeMatch = item.language.nativeName?.toLowerCase().includes(q);
        const regionMatch = item.language.region.toLowerCase().includes(q);
        return nameMatch || nativeMatch || regionMatch;
      }

      return true;
    });
  }, [languageResults, selectedScript, searchQuery]);

  // Counts of 100% supported languages per script
  const scriptCounts = useMemo(() => {
    const fullySupportedLangs = languageResults.filter(r => r.supported);
    return {
      Latin: fullySupportedLangs.filter(r => r.language.script === 'Latin').length,
      Cyrillic: fullySupportedLangs.filter(r => r.language.script === 'Cyrillic').length,
      Greek: fullySupportedLangs.filter(r => r.language.script === 'Greek').length,
    };
  }, [languageResults]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Detection Summary & View Switcher */}
      <div className="p-5 rounded-2xl lab-card border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {subView === 'languages' ? (
              <Globe className="text-cyan-400" size={20} />
            ) : (
              <Sparkles className="text-amber-400" size={20} />
            )}
            <h3 className="font-bold text-base font-mono text-white">
              {subView === 'languages' ? (
                <>
                  Support for{' '}
                  <span className="text-cyan-400 underline decoration-cyan-500/50">
                    {fullySupportedCount} languages
                  </span>{' '}
                  detected
                </>
              ) : (
                <>
                  Font Glyph Features & Sets:{' '}
                  <span className="text-amber-400">
                    {classification.totalGlyphs} Total Glyphs
                  </span>
                </>
              )}
            </h3>
            {subView === 'languages' ? (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-bold">
                100% Full Support
              </span>
            ) : (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-bold">
                {classification.categories.length} Categories • Zero Overlap
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {subView === 'languages'
              ? 'Displaying only languages with 100% glyph coverage.'
              : 'Complete non-overlapping glyph distribution. Sum of all categories matches total font glyphs.'}
          </p>
        </div>

        {/* Sub-view switcher: Languages vs Features */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setSubView('languages')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              subView === 'languages'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe size={14} />
            <span>Supported Languages ({fullySupportedCount})</span>
          </button>
          <button
            onClick={() => setSubView('features')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              subView === 'features'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Features ({classification.categories.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SUPPORTED LANGUAGES (CARD-BASED WITH A-Z CHARACTERS - 100% ONLY) */}
      {subView === 'languages' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-xl lab-card border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter 100% supported languages (e.g. Indonesian, German, Spanish)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Script Filter Pills */}
            <div className="flex items-center gap-1">
              {(['All', 'Latin', 'Cyrillic', 'Greek'] as const).map(script => (
                <button
                  key={script}
                  onClick={() => setSelectedScript(script)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    selectedScript === script
                      ? 'bg-zinc-800 text-cyan-300 font-bold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {script}
                  {script === 'All' ? ` (${fullySupportedCount})` : ` (${scriptCounts[script] || 0})`}
                </button>
              ))}
            </div>
          </div>

          {/* Languages Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLanguages.map(item => {
              const lang = item.language;

              return (
                <div
                  key={lang.id}
                  className="p-5 rounded-2xl lab-card border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Card Header: Language Name & Status Badges */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-mono">
                          {lang.name}
                        </span>
                        {lang.nativeName && (
                          <span className="text-xs text-zinc-500 font-mono">
                            ({lang.nativeName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {lang.script}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {lang.region}
                        </span>
                      </div>
                    </div>

                    {/* Support Badge (Guaranteed 100%) */}
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono font-bold flex-shrink-0">
                      <CheckCircle2 size={12} />
                      <span>100% Supported</span>
                    </div>
                  </div>

                  {/* Alphabet & Distinctive Character Set rendered with active font */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                      Alphabet / Required Glyphs:
                    </div>
                    <div
                      style={{
                        fontFamily: `'${fontFamily}', sans-serif`,
                        fontSize: '20px',
                        lineHeight: 1.4,
                        fontFeatureSettings: featureSettingsCss,
                        fontVariationSettings: variationSettingsCss,
                      }}
                      className="text-zinc-100 break-words py-1 select-all"
                    >
                      {lang.alphabet}
                    </div>
                  </div>

                  {/* Sample Sentence in that Language */}
                  <div className="pt-2 border-t border-zinc-800/60">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 mb-1">
                      Sample Text:
                    </div>
                    <p
                      style={{
                        fontFamily: `'${fontFamily}', sans-serif`,
                        fontSize: '15px',
                        lineHeight: 1.4,
                        fontFeatureSettings: featureSettingsCss,
                        fontVariationSettings: variationSettingsCss,
                      }}
                      className="text-zinc-300 italic select-all"
                    >
                      "{lang.sampleText}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="p-12 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded-2xl">
              No 100% supported languages match the current search filter "{searchQuery}".
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FEATURES & NON-OVERLAPPING GLYPH SETS */}
      {subView === 'features' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classification.categories.map(cat => {
              return (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl lab-card border-zinc-800 space-y-3 flex flex-col justify-between"
                >
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold text-xs font-mono">
                          {cat.name}
                        </span>
                        {cat.tag && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-bold">
                            {cat.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                        {cat.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {cat.count} Glyphs
                      </span>
                    </div>
                  </div>

                  {/* Glyph Tiles Display */}
                  <div className="flex flex-wrap gap-1.5 py-2 max-h-72 overflow-y-auto">
                    {cat.glyphIndices.map(gid => {
                      const g = font.glyphs.get(gid);
                      const hasUnicode = g && g.unicode !== undefined && g.unicode > 32;
                      const charStr = hasUnicode ? String.fromCodePoint(g.unicode!) : undefined;

                      return (
                        <div
                          key={gid}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800/80 hover:border-cyan-500/80 hover:bg-zinc-800 transition-all select-none group relative"
                          title={
                            g
                              ? `Glyph #${gid} (${g.name || 'unnamed'})${
                                  g.unicode ? ` • U+${g.unicode.toString(16).toUpperCase().padStart(4, '0')}` : ''
                                }`
                              : `Glyph #${gid}`
                          }
                        >
                          {charStr ? (
                            <span
                              style={{
                                fontFamily: `'${fontFamily}', sans-serif`,
                                fontSize: '18px',
                                fontFeatureSettings: featureSettingsCss,
                                fontVariationSettings: variationSettingsCss,
                              }}
                              className="text-zinc-100 group-hover:text-cyan-300 pointer-events-none"
                            >
                              {charStr}
                            </span>
                          ) : (
                            <RasterMetricTile
                              glyphIdx={gid}
                              size={20}
                              fontObj={font}
                              color="#22d3ee"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Category Footer Summary */}
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>Category ID: {cat.id}</span>
                    <span>{cat.count} / {classification.totalGlyphs} ({( (cat.count / classification.totalGlyphs) * 100 ).toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
