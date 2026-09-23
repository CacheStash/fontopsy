import React from 'react';
import type { FontMetadata } from '../types/font';
import { Info, Shield, Globe } from 'lucide-react';

interface MetadataOverviewProps {
  metadata: FontMetadata;
}

export const MetadataOverview: React.FC<MetadataOverviewProps> = ({ metadata }) => {
  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl lab-card border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Units Per Em (UPM)
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {metadata.upm.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl lab-card border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Ascent / Descent
          </div>
          <div className="text-sm font-bold font-mono text-zinc-200 mt-1">
            +{metadata.ascent} / {metadata.descent}
          </div>
        </div>

        <div className="p-4 rounded-xl lab-card border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Weight Class
          </div>
          <div className="text-xl font-bold font-mono text-zinc-200 mt-1">
            {metadata.weightClass}
          </div>
        </div>

        <div className="p-4 rounded-xl lab-card border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Width Class
          </div>
          <div className="text-xl font-bold font-mono text-zinc-200 mt-1">
            {metadata.widthClass}
          </div>
        </div>

        <div className="p-4 rounded-xl lab-card border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Italic Angle
          </div>
          <div className="text-xl font-bold font-mono text-zinc-200 mt-1">
            {metadata.italicAngle}°
          </div>
        </div>

        <div className="p-4 rounded-xl lab-card border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Total Glyphs
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {metadata.numGlyphs.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Forensic Information Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Font Names & IDs */}
        <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80 text-cyan-400">
            <Info size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
              Identity & Naming Matrix
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-zinc-800/40 gap-1">
              <span className="text-zinc-500">Family Name:</span>
              <span className="text-zinc-200 font-semibold">{metadata.familyName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-zinc-800/40 gap-1">
              <span className="text-zinc-500">Subfamily / Style:</span>
              <span className="text-cyan-300 font-semibold">{metadata.styleName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-zinc-800/40 gap-1">
              <span className="text-zinc-500">Full Name:</span>
              <span className="text-zinc-200">{metadata.fullName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-zinc-800/40 gap-1">
              <span className="text-zinc-500">PostScript Name:</span>
              <span className="text-amber-300">{metadata.postscriptName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-zinc-800/40 gap-1">
              <span className="text-zinc-500">Version:</span>
              <span className="text-zinc-300">{metadata.version}</span>
            </div>

            {metadata.uniqueId && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 gap-1">
                <span className="text-zinc-500">Unique ID:</span>
                <span className="text-zinc-400 truncate max-w-xs">{metadata.uniqueId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Authorship & Legal */}
        <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80 text-emerald-400">
            <Shield size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
              Authorship, Foundry & License
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-zinc-800/40 gap-1">
              <span className="text-zinc-500">Designer:</span>
              <span className="text-zinc-200">
                {metadata.designerUrl ? (
                  <a
                    href={metadata.designerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>{metadata.designer}</span>
                    <Globe size={12} />
                  </a>
                ) : (
                  metadata.designer
                )}
              </span>
            </div>

            {metadata.manufacturer && (
              <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-zinc-800/40 gap-1">
                <span className="text-zinc-500">Manufacturer / Foundry:</span>
                <span className="text-zinc-300">{metadata.manufacturer}</span>
              </div>
            )}

            {metadata.copyright && (
              <div className="py-1.5 border-b border-zinc-800/40">
                <span className="text-zinc-500 block mb-1">Copyright:</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  {metadata.copyright}
                </p>
              </div>
            )}

            {metadata.license && (
              <div className="py-1.5">
                <span className="text-zinc-500 block mb-1">License:</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  {metadata.license}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
