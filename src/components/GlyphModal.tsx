import React, { useState } from 'react';
import type opentype from 'opentype.js';
import type { GlyphDetail, FontMetadata } from '../types/font';
import { X, Copy, Check, Download, Code2 } from 'lucide-react';

interface GlyphModalProps {
  glyph: GlyphDetail;
  font: opentype.Font;
  metadata: FontMetadata;
  onClose: () => void;
}

export const GlyphModal: React.FC<GlyphModalProps> = ({
  glyph,
  font,
  metadata: _metadata,
  onClose,
}) => {
  const [isCopiedPath, setIsCopiedPath] = useState(false);
  const [isCopiedChar, setIsCopiedChar] = useState(false);

  const opentypeGlyph = font.glyphs.get(glyph.index);

  // ViewBox coordinates
  const canvasSize = 340;

  let pathData = '';
  if (opentypeGlyph && glyph.hasContours) {
    try {
      pathData = opentypeGlyph.getPath(30, canvasSize * 0.72, canvasSize * 0.75).toPathData(2);
    } catch {
      pathData = '';
    }
  }

  const handleCopyPath = async () => {
    if (!pathData) return;
    await navigator.clipboard.writeText(pathData);
    setIsCopiedPath(true);
    setTimeout(() => setIsCopiedPath(false), 2000);
  };

  const handleCopyChar = async () => {
    if (!glyph.char) return;
    await navigator.clipboard.writeText(glyph.char);
    setIsCopiedChar(true);
    setTimeout(() => setIsCopiedChar(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <path d="${opentypeGlyph?.getPath(50, 750, 750).toPathData(2)}" fill="#000000" />
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${glyph.name || 'glyph'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="lab-card rounded-2xl border-cyan-500/40 w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono text-cyan-400">
              {glyph.char || '—'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white font-mono">{glyph.name}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  GID #{glyph.index}
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                {glyph.unicodeHex ? `${glyph.unicodeHex} (Dec: ${glyph.unicode})` : 'Unencoded Glyph'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vector Preview with Guidelines */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-950 border border-zinc-800 relative">
            <svg
              width={canvasSize}
              height={canvasSize}
              viewBox={`0 0 ${canvasSize} ${canvasSize}`}
              className="overflow-visible"
            >
              {/* Baseline Guide */}
              <line
                x1="0"
                y1={canvasSize * 0.72}
                x2={canvasSize}
                y2={canvasSize * 0.72}
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              <text
                x="6"
                y={canvasSize * 0.72 - 4}
                fill="#06b6d4"
                fontSize="9"
                fontFamily="monospace"
                opacity="0.8"
              >
                BASELINE
              </text>

              {/* Glyph Path */}
              {pathData ? (
                <path
                  d={pathData}
                  fill="rgba(6,182,212,0.18)"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                />
              ) : (
                <text
                  x={canvasSize / 2}
                  y={canvasSize / 2}
                  fill="#71717a"
                  fontSize="12"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  NO PATH CONTOURS
                </text>
              )}
            </svg>
          </div>

          {/* Metrics & Bézier Info */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2 text-xs font-mono">
              <div className="text-zinc-500 uppercase tracking-wider font-semibold text-[10px] pb-1 border-b border-zinc-800">
                Glyph Metrics Telemetry
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Advance Width:</span>
                <span className="text-zinc-200 font-bold">{glyph.advanceWidth}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Left Side Bearing (LSB):</span>
                <span className="text-zinc-200">{glyph.leftSideBearing}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Bounding Box (xMin, xMax):</span>
                <span className="text-zinc-200">
                  {glyph.xMin ?? 0}, {glyph.xMax ?? 0}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Bounding Box (yMin, yMax):</span>
                <span className="text-zinc-200">
                  {glyph.yMin ?? 0}, {glyph.yMax ?? 0}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Bézier Commands Count:</span>
                <span className="text-cyan-400 font-bold">{glyph.commandsCount}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCopyPath}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center gap-2 transition-all"
              >
                {isCopiedPath ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{isCopiedPath ? 'Path Copied!' : 'Copy SVG Path Data'}</span>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-mono bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 flex items-center justify-center gap-2 transition-all"
              >
                <Download size={14} />
                <span>Download Vector SVG</span>
              </button>

              {glyph.char && (
                <button
                  onClick={handleCopyChar}
                  className="w-full py-2 px-3 rounded-xl text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center gap-2 transition-all"
                >
                  {isCopiedChar ? <Check size={14} className="text-emerald-400" /> : <Code2 size={14} />}
                  <span>{isCopiedChar ? 'Character Copied!' : 'Copy Character String'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
