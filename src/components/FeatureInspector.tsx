import React, { useState, useMemo } from 'react';
import type { OpenTypeFeature, LigatureSubstitution } from '../types/font';
import {
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Search,
  RotateCcw,
  CheckSquare,
  Square,
  Type,
} from 'lucide-react';

export interface FeatureInspectorProps {
  features: OpenTypeFeature[];
  ligatures: LigatureSubstitution[];
  fontFamily: string;
  featureToggles: Record<string, boolean>;
  onToggleFeature: (tag: string, enabled: boolean) => void;
  onResetFeatures?: () => void;
  onToggleAllFeatures?: (enabled: boolean) => void;
  cssFeatureString: string;
  variationSettingsCss?: string;
}

const SAMPLE_PRESETS = [
  { label: 'Alphabet', text: 'The quick brown fox jumps over the lazy dog' },
  { label: 'Ligatures', text: 'office waffle fishing fjord aesthetic first final' },
  { label: 'Figures', text: '$1,249.50 • 0123456789 • 1/2 3/4' },
  { label: 'Case Forms', text: '(CASE) [SENSITIVE] {FORMS} «123»' },
];

export const FeatureInspector: React.FC<FeatureInspectorProps> = ({
  features,
  ligatures,
  fontFamily,
  featureToggles,
  onToggleFeature,
  onResetFeatures,
  onToggleAllFeatures,
  cssFeatureString,
  variationSettingsCss = 'normal',
}) => {
  const [copiedCss, setCopiedCss] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewText, setPreviewText] = useState<string>(
    'The quick brown fox jumps over the lazy dog 0123456789 fi fl'
  );

  const handleCopyCss = async () => {
    await navigator.clipboard.writeText(`font-feature-settings: ${cssFeatureString};`);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return features;
    return features.filter(
      f =>
        f.tag.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [features, searchQuery]);

  // Count active features
  const activeCount = useMemo(() => {
    return features.filter(f =>
      featureToggles[f.tag] !== undefined ? featureToggles[f.tag] : f.enabled
    ).length;
  }, [features, featureToggles]);

  return (
    <div className="space-y-6">
      {/* Generated CSS Snippet Box */}
      <div className="p-4 rounded-2xl lab-card border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div>
          <span className="text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
            Active CSS font-feature-settings:
          </span>
          <code className="text-cyan-400 dark:text-cyan-300 font-semibold break-all">
            font-feature-settings: {cssFeatureString || '"normal"'};
          </code>
        </div>
        <button
          onClick={handleCopyCss}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1.5 self-start sm:self-center transition-all whitespace-nowrap cursor-pointer"
        >
          {copiedCss ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{copiedCss ? 'Copied CSS!' : 'Copy CSS'}</span>
        </button>
      </div>

      {/* Live Interactive Specimen Preview Box */}
      <div className="p-4 rounded-2xl lab-card border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
          <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-zinc-200">
            <Type size={14} className="text-cyan-400" />
            <span>Interactive Typography Preview</span>
          </span>
          <span className="text-[11px] text-zinc-500">Live rendered with active font-feature-settings</span>
        </div>

        <input
          type="text"
          value={previewText}
          onChange={e => setPreviewText(e.target.value)}
          placeholder="Type here to test active OpenType features..."
          style={{
            fontFamily: `'${fontFamily}', sans-serif`,
            fontFeatureSettings: cssFeatureString,
            fontVariationSettings: variationSettingsCss || 'normal',
            fontSize: '28px',
          }}
          className="w-full bg-zinc-900/70 border border-zinc-700/80 rounded-xl px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500 transition-all font-normal shadow-none"
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Quick Presets:</span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPreviewText(preset.text)}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Toggles Grid */}
      <div className="space-y-3">
        {/* Controls Toolbar: Search & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <span>Detected OpenType Features ({features.length})</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 font-normal">
              {activeCount} active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-600 transition-all w-36 sm:w-48"
              />
            </div>

            {/* Quick Action: Reset to Defaults */}
            {onResetFeatures && (
              <button
                type="button"
                onClick={onResetFeatures}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Reset to default features (kern, liga)"
              >
                <RotateCcw size={12} className="text-zinc-400" />
                <span>Reset</span>
              </button>
            )}

            {/* Quick Action: Disable All */}
            {onToggleAllFeatures && (
              <button
                type="button"
                onClick={() => onToggleAllFeatures(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Disable all OpenType features"
              >
                <Square size={12} className="text-zinc-400" />
                <span>Disable All</span>
              </button>
            )}

            {/* Quick Action: Enable All */}
            {onToggleAllFeatures && (
              <button
                type="button"
                onClick={() => onToggleAllFeatures(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Enable all detected OpenType features"
              >
                <CheckSquare size={12} className="text-cyan-400" />
                <span>Enable All</span>
              </button>
            )}
          </div>
        </div>

        {features.length === 0 ? (
          <div className="p-8 text-center rounded-2xl lab-card border-zinc-800 text-zinc-500 text-xs font-mono">
            No GSUB or GPOS layout features detected in this font file.
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className="p-8 text-center rounded-2xl lab-card border-zinc-800 text-zinc-500 text-xs font-mono">
            No features match "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFeatures.map(f => {
              const isEnabled =
                featureToggles[f.tag] !== undefined ? featureToggles[f.tag] : f.enabled;

              return (
                <div
                  key={f.tag}
                  onClick={() => onToggleFeature(f.tag, !isEnabled)}
                  role="switch"
                  aria-checked={isEnabled}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleFeature(f.tag, !isEnabled);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    isEnabled
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-xs font-mono transition-colors ${
                          isEnabled ? 'text-cyan-400' : 'text-zinc-400'
                        }`}
                      >
                        {f.tag}
                      </span>
                      <span className="text-xs text-zinc-100 font-medium truncate">
                        {f.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                      {f.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {isEnabled ? (
                      <ToggleRight size={26} className="text-cyan-400 transition-colors" />
                    ) : (
                      <ToggleLeft size={26} className="text-zinc-600 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ligatures & Substitution Breakdown */}
      {ligatures.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span>Ligature & Substitution Visual Dictionary ({ligatures.length})</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ligatures.slice(0, 48).map((lig, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl lab-card border-zinc-800 flex flex-col items-center justify-center text-center gap-2"
              >
                {/* Visual before/after rendering */}
                <div
                  style={{ fontFamily: `'${fontFamily}', sans-serif`, fontSize: '24px' }}
                  className="text-cyan-300 font-bold"
                >
                  {lig.byString}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                  <span>{lig.subString}</span>
                  <ArrowRight size={10} className="text-zinc-600" />
                  <span className="text-zinc-200">{lig.byString}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
