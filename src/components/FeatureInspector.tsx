import React, { useState } from 'react';
import type { OpenTypeFeature, LigatureSubstitution } from '../types/font';
import { ToggleLeft, ToggleRight, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';

interface FeatureInspectorProps {
  features: OpenTypeFeature[];
  ligatures: LigatureSubstitution[];
  fontFamily: string;
  onToggleFeature: (tag: string, enabled: boolean) => void;
  cssFeatureString: string;
}

export const FeatureInspector: React.FC<FeatureInspectorProps> = ({
  features,
  ligatures,
  fontFamily,
  onToggleFeature,
  cssFeatureString,
}) => {
  const [copiedCss, setCopiedCss] = useState(false);

  const handleCopyCss = async () => {
    await navigator.clipboard.writeText(`font-feature-settings: ${cssFeatureString};`);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Generated CSS Snippet Box */}
      <div className="p-4 rounded-2xl lab-card border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div>
          <span className="text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
            Active CSS font-feature-settings:
          </span>
          <code className="text-cyan-300 font-semibold break-all">
            font-feature-settings: {cssFeatureString || '"normal"'};
          </code>
        </div>
        <button
          onClick={handleCopyCss}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1.5 self-start sm:self-center transition-all whitespace-nowrap"
        >
          {copiedCss ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{copiedCss ? 'Copied CSS!' : 'Copy CSS'}</span>
        </button>
      </div>

      {/* Feature Toggles Grid */}
      <div>
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3 font-semibold flex items-center justify-between">
          <span>Detected OpenType Features ({features.length})</span>
          <span className="text-zinc-500 text-[11px]">Toggle to preview live typography</span>
        </div>

        {features.length === 0 ? (
          <div className="p-8 text-center rounded-2xl lab-card border-zinc-800 text-zinc-500 text-xs font-mono">
            No GSUB or GPOS layout features detected in this font file.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map(f => (
              <div
                key={f.tag}
                onClick={() => onToggleFeature(f.tag, !f.enabled)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  f.enabled
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-mono text-cyan-400">
                      {f.tag}
                    </span>
                    <span className="text-xs text-white font-medium">
                      {f.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                    {f.description}
                  </p>
                </div>

                <div className="text-cyan-400 flex-shrink-0">
                  {f.enabled ? (
                    <ToggleRight size={24} className="text-cyan-400" />
                  ) : (
                    <ToggleLeft size={24} className="text-zinc-600" />
                  )}
                </div>
              </div>
            ))}
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
