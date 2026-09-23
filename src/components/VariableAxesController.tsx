import React, { useState } from 'react';
import type { VariableAxis, VariableInstance } from '../types/font';
import { Sliders, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';

interface VariableAxesControllerProps {
  axes: VariableAxis[];
  instances: VariableInstance[];
  values: Record<string, number>;
  onChange: (tag: string, val: number) => void;
  onSetCoordinates: (coords: Record<string, number>) => void;
  onReset: () => void;
  cssVariationString: string;
}

export const VariableAxesController: React.FC<VariableAxesControllerProps> = ({
  axes,
  instances,
  values,
  onChange,
  onSetCoordinates,
  onReset,
  cssVariationString,
}) => {
  const [copiedCss, setCopiedCss] = useState(false);

  if (!axes || axes.length === 0) return null;

  const handleCopyCss = async () => {
    await navigator.clipboard.writeText(`font-variation-settings: ${cssVariationString};`);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  return (
    <div className="w-full p-5 sm:p-6 rounded-2xl lab-card border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.18)] space-y-5 animate-fade-in">
      {/* Header & Auto-Detect Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400 animate-pulse">
            <Sliders size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                Variable Font Axes Controller
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold flex items-center gap-1">
                <Sparkles size={11} />
                AUTO-DETECTED
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              {axes.length} dynamic design {axes.length === 1 ? 'axis' : 'axes'} found:{' '}
              <span className="text-cyan-300 font-semibold">
                {axes.map(a => `'${a.tag}' (${a.name})`).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all flex items-center gap-1.5"
            title="Reset all axes to default positions"
          >
            <RotateCcw size={13} />
            <span>RESET</span>
          </button>

          <button
            onClick={handleCopyCss}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 transition-all flex items-center gap-1.5 font-semibold"
          >
            {copiedCss ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedCss ? 'COPIED!' : 'COPY CSS'}</span>
          </button>
        </div>
      </div>

      {/* Preset Named Instances (e.g. Thin, Light, Regular, Bold, Black) */}
      {instances.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Named Style Instances ({instances.length})
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {instances.map((inst, idx) => {
              // Check if all coordinates match
              const isActive = Object.entries(inst.coordinates).every(
                ([tag, val]) => values[tag] === val
              );

              return (
                <button
                  key={idx}
                  onClick={() => onSetCoordinates(inst.coordinates)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                  }`}
                >
                  {inst.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Sliders Grid Generated According to Detected Axes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {axes.map(axis => {
          const currentVal = values[axis.tag] ?? axis.default;
          const step = axis.max - axis.min > 50 ? 1 : 0.1;

          return (
            <div
              key={axis.tag}
              className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5 shadow-inner"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold text-cyan-300">'{axis.tag}'</span>
                  <span className="text-zinc-400 ml-1.5">{axis.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-bold text-white text-xs">
                  {currentVal}
                </span>
              </div>

              {/* Slider Track */}
              <input
                type="range"
                min={axis.min}
                max={axis.max}
                step={step}
                value={currentVal}
                onChange={e => onChange(axis.tag, Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />

              {/* Min, Default, Max Markers */}
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>min: {axis.min}</span>
                <span className="text-zinc-400">def: {axis.default}</span>
                <span>max: {axis.max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live CSS font-variation-settings Preview */}
      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 truncate">
          <span className="text-zinc-500 select-none">CSS:</span>
          <code className="text-cyan-300 font-semibold truncate">
            font-variation-settings: {cssVariationString || '"normal"'};
          </code>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 select-none hidden sm:inline">
          Live synced across all specimens
        </span>
      </div>
    </div>
  );
};
