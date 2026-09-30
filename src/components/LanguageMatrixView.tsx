import React, { useState, useMemo } from 'react';
import type opentype from 'opentype.js';
import {
  detectLanguageCoverage,
  detectScriptBlockCoverage,
} from '../utils/languageData';
import { Globe, Search, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

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
  const [subView, setSubView] = useState<'languages' | 'script_blocks'>('languages');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState<'All' | 'Latin' | 'Cyrillic' | 'Greek'>('All');
  const [supportFilter, setSupportFilter] = useState<'all' | 'full_only'>('all');

  // Compute language detection against active font
  const { results: languageResults, fullySupportedCount, partiallySupportedCount } = useMemo(() => {
    return detectLanguageCoverage(font);
  }, [font]);

  // Compute script block coverage
  const scriptBlockResults = useMemo(() => {
    return detectScriptBlockCoverage(font);
  }, [font]);

  // Filter languages based on search, script, and support filter
  const filteredLanguages = useMemo(() => {
    return languageResults.filter(item => {
      // Support filter
      if (supportFilter === 'full_only' && !item.supported) return false;
      if (item.coverageRatio < 0.7) return false; // Hide languages with less than 70% support

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
  }, [languageResults, supportFilter, selectedScript, searchQuery]);

  const scriptCounts = useMemo(() => {
    const supportedLangs = languageResults.filter(r => r.supported || r.isPartial);
    return {
      Latin: supportedLangs.filter(r => r.language.script === 'Latin').length,
      Cyrillic: supportedLangs.filter(r => r.language.script === 'Cyrillic').length,
      Greek: supportedLangs.filter(r => r.language.script === 'Greek').length,
    };
  }, [languageResults]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Detection Summary & View Switcher */}
      <div className="p-5 rounded-2xl lab-card border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="text-cyan-400" size={20} />
            <h3 className="font-bold text-base font-mono text-white">
              Support for{' '}
              <span className="text-cyan-400 underline decoration-cyan-500/50">
                {fullySupportedCount} languages
              </span>{' '}
              detected
            </h3>
            {partiallySupportedCount > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/80">
                +{partiallySupportedCount} partial
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Dynamic Unicode orthography detection inspired by FontDrop.info, rendered in structured character matrix cards.
          </p>
        </div>

        {/* Sub-view switcher: Languages vs Script Blocks */}
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
            <span>Supported Languages ({languageResults.filter(r => r.supported || r.isPartial).length})</span>
          </button>
          <button
            onClick={() => setSubView('script_blocks')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              subView === 'script_blocks'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen size={14} />
            <span>Script Blocks ({scriptBlockResults.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SUPPORTED LANGUAGES (CARD-BASED WITH A-Z CHARACTERS) */}
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
                placeholder="Filter languages (e.g. Indonesian, German, Turkish, Zulu)..."
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
                  {script !== 'All' && ` (${scriptCounts[script] || 0})`}
                </button>
              ))}
            </div>

            {/* Support Filter Toggle */}
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
              <button
                onClick={() => setSupportFilter('all')}
                className={`px-2 py-1 rounded text-[11px] ${
                  supportFilter === 'all'
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Supported
              </button>
              <button
                onClick={() => setSupportFilter('full_only')}
                className={`px-2 py-1 rounded text-[11px] ${
                  supportFilter === 'full_only'
                    ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                100% Full Only
              </button>
            </div>
          </div>

          {/* Languages Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLanguages.map(item => {
              const lang = item.language;
              const percent = Math.round(item.coverageRatio * 100);

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

                    {/* Support Badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.supported ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono font-bold">
                          <CheckCircle2 size={12} />
                          <span>100% Supported</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-mono font-bold">
                          <AlertTriangle size={12} />
                          <span>{percent}% ({item.matchedCount}/{item.totalRequired})</span>
                        </div>
                      )}
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

                  {/* If partial, show which characters are missing */}
                  {item.missingChars.length > 0 && (
                    <div className="pt-2 border-t border-rose-950/40 text-[11px] font-mono text-rose-300 flex items-center gap-1.5 flex-wrap">
                      <span className="text-zinc-500">Missing in font:</span>
                      {item.missingChars.map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="p-12 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded-2xl">
              No languages match the current search filter "{searchQuery}".
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SCRIPT BLOCKS MATRIX */}
      {subView === 'script_blocks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scriptBlockResults.map(block => {
              const percent = Math.round(block.coverageRatio * 100);
              const isFull = percent === 100;

              return (
                <div
                  key={block.name}
                  className="p-5 rounded-2xl lab-card border-zinc-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-800">
                    <div>
                      <span className="text-cyan-400 font-bold text-xs font-mono block">
                        {block.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                        {block.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isFull
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {block.matchedChars.length} / {block.chars.replace(/\s+/g, '').length} ({percent}%)
                      </span>
                    </div>
                  </div>

                  {/* Character Matrix */}
                  <div
                    style={{
                      fontFamily: `'${fontFamily}', sans-serif`,
                      fontSize: '22px',
                      lineHeight: 1.5,
                      fontFeatureSettings: featureSettingsCss,
                      fontVariationSettings: variationSettingsCss,
                    }}
                    className="text-zinc-200 break-words py-1 select-all"
                  >
                    {block.chars}
                  </div>

                  {/* Missing Glyphs Alert if not 100% */}
                  {block.missingChars.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 flex-wrap">
                      <span className="text-rose-400 font-semibold">Missing ({block.missingChars.length}):</span>
                      {block.missingChars.slice(0, 16).map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.2 rounded bg-zinc-900 text-rose-300 border border-zinc-700 font-mono"
                        >
                          {c}
                        </span>
                      ))}
                      {block.missingChars.length > 16 && (
                        <span className="text-zinc-500 text-[10px]">
                          +{block.missingChars.length - 16} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
