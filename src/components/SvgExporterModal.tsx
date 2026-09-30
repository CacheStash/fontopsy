import React, { useState, useMemo } from 'react';
import type opentype from 'opentype.js';
import {
  generateFontSvgMatrix,
  DEFAULT_SVG_OPTIONS,
  type SvgExportOptions,
} from '../utils/svgExporter';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
} from 'lucide-react';

interface SvgExporterModalProps {
  font: opentype.Font;
  fontName: string;
  onClose: () => void;
}

export const SvgExporterModal: React.FC<SvgExporterModalProps> = ({
  font,
  fontName,
  onClose,
}) => {
  const [options, setOptions] = useState<SvgExportOptions>(DEFAULT_SVG_OPTIONS);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Generate SVG Matrix string & telemetry
  const exportResult = useMemo(() => {
    return generateFontSvgMatrix(font, fontName, options);
  }, [font, fontName, options]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportResult.svgString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG to clipboard:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportResult.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = fontName.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}_all_glyphs_matrix.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLOR_CHOICES = [
    { label: 'Dark', value: '#18181b' },
    { label: 'White', value: '#ffffff' },
    { label: 'Cyan', value: '#0284c7' },
    { label: 'Rose', value: '#be123c' },
    { label: 'Purple', value: '#7e22ce' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="lab-card rounded-2xl border-cyan-500/40 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <FileCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white tracking-tight">
                  Font SVG Matrix Exporter
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold">
                  100% COMPLETE ({exportResult.totalGlyphs} GLYPHS)
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Exports all font glyphs in exact sequence (A-Z, a-z, 0-9, keyboard, alternates, accents, remaining) in 1 unified SVG file
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Breakdown Badges */}
        <div className="px-6 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500 font-semibold text-[11px] uppercase tracking-wider mr-1">
            Exported Sequence:
          </span>
          {exportResult.categoryStats.map(cat => (
            <span
              key={cat.id}
              className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 text-[11px]"
            >
              <strong className="text-cyan-400 mr-1">{cat.name}:</strong>
              <span>{cat.count}</span>
            </span>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            {/* Left Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Columns Selector */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Grid size={13} />
                  <span>Columns:</span>
                </span>
                <div className="flex items-center gap-1">
                  {[26, 20, 16, 32].map(num => (
                    <button
                      key={num}
                      onClick={() => setOptions(prev => ({ ...prev, columns: num }))}
                      className={`px-2.5 py-1 rounded text-xs transition-all ${
                        options.columns === num
                          ? 'bg-cyan-500 text-black font-bold shadow-xs'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                      title={num === 26 ? '26 Columns: Perfect A-Z and a-z single-row alignment' : undefined}
                    >
                      {num} {num === 26 && '(A-Z)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3 border-l border-zinc-800 pl-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={options.separateCategoryRows}
                    onChange={e =>
                      setOptions(prev => ({ ...prev, separateCategoryRows: e.target.checked }))
                    }
                    className="accent-cyan-400 rounded"
                  />
                  <span>New Row Per Category</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={options.includeGuides}
                    onChange={e =>
                      setOptions(prev => ({ ...prev, includeGuides: e.target.checked }))
                    }
                    className="accent-cyan-400 rounded"
                  />
                  <span>Metric Guides</span>
                </label>
              </div>

              {/* Fill Color */}
              <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                <span className="text-zinc-400">Color:</span>
                <div className="flex items-center gap-1">
                  {COLOR_CHOICES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setOptions(prev => ({ ...prev, fillColor: c.value }))}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        options.fillColor === c.value
                          ? 'border-cyan-400 scale-110 shadow-xs'
                          : 'border-zinc-700 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Zoom Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-zinc-500">Preview Zoom:</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-zinc-300 min-w-[36px] text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                title="Reset Zoom"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* SVG Canvas Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 max-h-[48vh] overflow-auto flex items-start justify-center">
            <div
              style={{
                width: `${zoomLevel}%`,
                maxWidth: 'none',
                minWidth: '200px',
                transition: 'width 0.15s ease-out',
              }}
              className="bg-white rounded-lg shadow-xl overflow-hidden border border-zinc-300 [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
              dangerouslySetInnerHTML={{ __html: exportResult.svgString }}
            />
          </div>

          {/* Dimension Telemetry */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
            <div>
              <span>Sheet Dimensions: </span>
              <span className="text-zinc-300 font-semibold">{exportResult.grid.width} x {exportResult.grid.height} px</span>
              <span className="mx-2">·</span>
              <span>Grid: </span>
              <span className="text-zinc-300 font-semibold">{exportResult.grid.columns} cols x {exportResult.grid.rows} rows</span>
            </div>
            <div>
              <span>Cell Size: </span>
              <span className="text-zinc-300 font-semibold">{exportResult.grid.cellWidth} x {exportResult.grid.cellHeight} px</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/60 font-mono">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Sparkles size={14} className="text-cyan-400" />
            <span>Ready for Illustrator, Figma, CorelDraw, and multi-layer effect workflows</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-1.5"
            >
              {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{isCopied ? 'Copied SVG Markup' : 'Copy SVG Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 active:scale-95"
            >
              <Download size={14} />
              <span>Download SVG File (.svg)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
