import React from 'react';
import type { ParsedFontResult } from '../types/font';
import { Layers, Upload, Sparkles } from 'lucide-react';

interface NavbarProps {
  parsedFont: ParsedFontResult | null;
  onOpenFilePicker: () => void;
  onOpenExporter: () => void;
  onLoadSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  parsedFont,
  onOpenFilePicker,
  onOpenExporter,
  onLoadSample,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <span className="font-mono font-black text-black text-base">F</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">FONTOPSY</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono hidden sm:block">
              Forensic Font Inspector & Layer Extractor
            </div>
          </div>
        </div>

        {/* Font Quick Telemetry Bar (if font is loaded) */}
        {parsedFont && (
          <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">FONT:</span>
              <span className="text-cyan-300 font-medium max-w-[140px] truncate" title={parsedFont.metadata.fullName}>
                {parsedFont.metadata.fullName}
              </span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-bold text-[10px]">
                {parsedFont.metadata.format}
              </span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">GLYPHS:</span>
              <span className="text-zinc-200">{parsedFont.metadata.numGlyphs.toLocaleString()}</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">SIZE:</span>
              <span className="text-zinc-200">{(parsedFont.metadata.fileSize / 1024).toFixed(1)} KB</span>
            </div>
            {parsedFont.features.length > 0 && (
              <>
                <span className="text-zinc-700">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">FEATURES:</span>
                  <span className="text-amber-400 font-semibold">{parsedFont.features.length}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Primary Action: Layer Exporter */}
          {parsedFont && (
            <button
              onClick={onOpenExporter}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all flex items-center gap-2 active:scale-95"
              title="Extract All Printable Glyphs for Multi-Layered Designing"
            >
              <Layers size={15} />
              <span>LAYER EXPORTER</span>
            </button>
          )}

          <button
            onClick={onOpenFilePicker}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-1.5"
            title="Upload OTF, TTF, WOFF, or WOFF2 file"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">OPEN FONT</span>
          </button>

          {!parsedFont && (
            <button
              onClick={onLoadSample}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>SAMPLE FONT</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
