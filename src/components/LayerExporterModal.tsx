import React, { useState, useMemo } from 'react';
import type opentype from 'opentype.js';
import {
  extractGlyphBuckets,
  formatLayerReadyString,
  exportCharacterMapJson,
  DEFAULT_EXTRACTION_OPTIONS,
  type ExtractionOptions,
  type DelimiterOption,
} from '../utils/glyphExtractor';
import {
  X,
  Copy,
  Check,
  Download,
  FileJson,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface LayerExporterModalProps {
  font: opentype.Font;
  fontName: string;
  onClose: () => void;
}

export const LayerExporterModal: React.FC<LayerExporterModalProps> = ({
  font,
  fontName,
  onClose,
}) => {
  const [options, setOptions] = useState<ExtractionOptions>(DEFAULT_EXTRACTION_OPTIONS);
  const [isCopied, setIsCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Extract buckets from font
  const buckets = useMemo(() => extractGlyphBuckets(font), [font]);

  // Format string based on options
  const formattedOutput = useMemo(
    () => formatLayerReadyString(buckets, options),
    [buckets, options]
  );

  const totalLines = formattedOutput ? formattedOutput.split('\n').length : 0;
  const totalCharacters = formattedOutput.replace(/\s+/g, '').length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedOutput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([formattedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fontName.replace(/\s+/g, '_')}_layer_glyphs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonStr = exportCharacterMapJson(buckets, fontName);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fontName.replace(/\s+/g, '_')}_charmap.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="lab-card rounded-2xl border-cyan-500/40 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white tracking-tight">
                  Layered Font Glyph Exporter
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  DETERMINISTIC
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Extracts clean printable glyphs ready for multi-layer vector suites (Illustrator, InDesign, Figma)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 transition-colors"
              title="Why is this needed?"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        {showHelp && (
          <div className="px-6 py-3.5 bg-cyan-950/40 border-b border-cyan-800/40 text-xs font-mono text-cyan-200/90 leading-relaxed">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
              <Sparkles size={14} />
              The Multi-Layer Design Alignment Problem Solved:
            </div>
            When creating multi-color chromatic fonts in Adobe Illustrator, designers duplicate text across layers.
            Including random unmapped glyphs, invisible spaces (`U+0020`), or `.notdef` boxes causes cursor misalignment and layer drift.
            This tool strictly filters out all invisible and pathless glyphs, delivering predictable deterministic lines.
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls & Buckets Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Delimiter Options */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2 font-semibold">
                Delimiter Format
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['none', 'space', 'newline'] as DelimiterOption[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setOptions(prev => ({ ...prev, delimiter: mode }))}
                    className={`py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                      options.delimiter === mode
                        ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono mt-2">
                {options.delimiter === 'space' && 'Characters separated by space (recommended for easy selection).'}
                {options.delimiter === 'none' && 'Continuous string without spaces.'}
                {options.delimiter === 'newline' && 'Each character placed on its own line.'}
              </div>
            </div>

            {/* Column 2: Total Extraction Summary */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                Exclusions Applied
              </div>
              <div className="text-xs font-mono space-y-1 text-zinc-400 mt-1">
                <div className="text-emerald-400">✓ .notdef (GID 0) Omitted</div>
                <div className="text-emerald-400">✓ Whitespaces & Blank Codepoints Omitted</div>
                <div className="text-emerald-400">✓ Control & Non-Printing Chars Omitted</div>
              </div>
              <div className="text-xs font-mono text-cyan-300 font-bold mt-2">
                Total Printable: {buckets.totalValidCount.toLocaleString()} glyphs
              </div>
            </div>

            {/* Column 3: Output Telemetry */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                Output Statistics
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1">
                <span className="text-zinc-500">Output Lines:</span>
                <span className="text-zinc-200 font-bold">{totalLines}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1">
                <span className="text-zinc-500">Raw Characters:</span>
                <span className="text-cyan-400 font-bold">{totalCharacters.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1">
                <span className="text-zinc-500">Total String Length:</span>
                <span className="text-zinc-200 font-bold">{formattedOutput.length.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bucket Toggle Filters */}
          <div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2 font-semibold">
              Filter Active Glyph Tiers
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={e => setOptions(prev => ({ ...prev, includeUppercase: e.target.checked }))}
                  className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-zinc-200">Uppercase ({buckets.uppercase.length})</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={e => setOptions(prev => ({ ...prev, includeLowercase: e.target.checked }))}
                  className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-zinc-200">Lowercase ({buckets.lowercase.length})</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={e => setOptions(prev => ({ ...prev, includeNumbers: e.target.checked }))}
                  className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-zinc-200">Numbers ({buckets.numbers.length})</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={e => setOptions(prev => ({ ...prev, includeSymbols: e.target.checked }))}
                  className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-zinc-200">Symbols ({buckets.basicSymbols.length})</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeExtended}
                  onChange={e => setOptions(prev => ({ ...prev, includeExtended: e.target.checked }))}
                  className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-zinc-200">Extended Latin ({buckets.extendedLatin.length})</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includePunctuationMath}
                  onChange={e => setOptions(prev => ({ ...prev, includePunctuationMath: e.target.checked }))}
                  className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-zinc-200">Punctuation & Math ({buckets.punctuationAndMath.length})</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={options.includeOthers}
                  onChange={e => setOptions(prev => ({ ...prev, includeOthers: e.target.checked }))}
                  className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-zinc-200">Other / Unencoded ({buckets.otherAndUnencoded.length})</span>
              </label>
            </div>
          </div>

          {/* Formatted Text Preview */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
              <span className="uppercase font-semibold">Strict Deterministic Clipboard Output:</span>
              <span className="text-zinc-500 text-[11px]">Ready to paste into text boxes across layers</span>
            </div>
            <textarea
              readOnly
              value={formattedOutput}
              rows={8}
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50 resize-y select-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 rounded-xl text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>DOWNLOAD .TXT</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-3 py-2 rounded-xl text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all flex items-center gap-1.5"
            >
              <FileJson size={14} />
              <span>EXPORT JSON MAP</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] ${
              isCopied
                ? 'bg-emerald-500 text-black'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black active:scale-95'
            }`}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            <span>{isCopied ? 'COPIED TO CLIPBOARD!' : 'COPY ALL GLYPHS (LAYER-READY)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
