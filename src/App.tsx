import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ParsedFontResult, GlyphDetail } from './types/font';
import { parseFontFile } from './utils/fontParser';
import { Navbar } from './components/Navbar';
import { DropZone } from './components/DropZone';
import { MetadataOverview } from './components/MetadataOverview';
import { GlyphGrid } from './components/GlyphGrid';
import { GlyphModal } from './components/GlyphModal';
import { SpecimenSandbox } from './components/SpecimenSandbox';
import { FeatureInspector } from './components/FeatureInspector';
import { TableInspector } from './components/TableInspector';
import { LayerExporterModal } from './components/LayerExporterModal';
import {
  Type,
  Grid,
  Sparkles,
  Info,
  Database,
  Layers,
  Cpu,
  AlertCircle,
} from 'lucide-react';

export const App: React.FC = () => {
  const [parsedFont, setParsedFont] = useState<ParsedFontResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'glyphs' | 'specimen' | 'features' | 'metadata' | 'tables'>('specimen');

  // Modals
  const [selectedGlyph, setSelectedGlyph] = useState<GlyphDetail | null>(null);
  const [showLayerExporter, setShowLayerExporter] = useState<boolean>(false);

  // OpenType Feature Toggles
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load a font buffer
  const handleLoadBuffer = async (buffer: ArrayBuffer, fileName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseFontFile(buffer, fileName);
      setParsedFont(result);

      // Initialize feature toggles
      const initialToggles: Record<string, boolean> = {};
      result.features.forEach(f => {
        initialToggles[f.tag] = f.enabled;
      });
      setFeatureToggles(initialToggles);
    } catch (err: unknown) {
      console.error('Failed to parse font file:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to parse font binary. Please ensure the file is a valid OTF, TTF, WOFF, or WOFF2.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load bundled sample font
  const loadSampleFont = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/sample-font.ttf');
      if (!response.ok) throw new Error('Failed to fetch sample font');
      const buffer = await response.arrayBuffer();
      await handleLoadBuffer(buffer, 'Inter-Regular.ttf');
    } catch (err) {
      console.warn('Sample font fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically load sample font on initial visit so the user has immediate data
  useEffect(() => {
    loadSampleFont();
  }, []);

  // Compute CSS font-feature-settings string
  const cssFeatureString = useMemo(() => {
    const activeTags = Object.entries(featureToggles)
      .filter(([, enabled]) => enabled)
      .map(([tag]) => `"${tag}" 1`);

    return activeTags.length > 0 ? activeTags.join(', ') : '"normal"';
  }, [featureToggles]);

  const handleToggleFeature = (tag: string, enabled: boolean) => {
    setFeatureToggles(prev => ({ ...prev, [tag]: enabled }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = ev => {
              const buf = ev.target?.result as ArrayBuffer;
              if (buf) handleLoadBuffer(buf, file.name);
            };
            reader.readAsArrayBuffer(file);
          }
        }}
        accept=".otf,.ttf,.woff,.woff2"
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        parsedFont={parsedFont}
        onOpenFilePicker={() => fileInputRef.current?.click()}
        onOpenExporter={() => setShowLayerExporter(true)}
        onLoadSample={loadSampleFont}
      />

      {/* Global Drag & Drop Overlay */}
      <DropZone
        onFileLoaded={handleLoadBuffer}
        isLoading={isLoading}
        hasFont={Boolean(parsedFont)}
      />

      {/* Error Alert if parse fails */}
      {error && (
        <div className="max-w-4xl mx-auto my-4 p-4 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs font-mono flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Font Parsing Error: </span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="px-2 py-1 rounded bg-rose-900/60 text-rose-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {isLoading && !parsedFont && (
          <div className="flex flex-col items-center justify-center p-20 text-zinc-400 font-mono text-sm">
            <Cpu size={36} className="animate-spin text-cyan-400 mb-3" />
            <span>Forensic Binary Parsing in progress...</span>
          </div>
        )}

        {parsedFont && (
          <div className="space-y-6">
            {/* Primary Tab Navigation */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveTab('specimen')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'specimen'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Type size={15} />
                  <span>Specimen Testing</span>
                </button>

                <button
                  onClick={() => setActiveTab('glyphs')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'glyphs'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Grid size={15} />
                  <span>Glyph Matrix ({parsedFont.glyphs.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('features')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'features'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles size={15} />
                  <span>Features ({parsedFont.features.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('metadata')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'metadata'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Info size={15} />
                  <span>Metrics & OS/2</span>
                </button>

                <button
                  onClick={() => setActiveTab('tables')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'tables'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Database size={15} />
                  <span>SFNT Tables</span>
                </button>
              </div>

              {/* Quick Trigger: Layer Exporter Modal */}
              <button
                onClick={() => setShowLayerExporter(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 hover:bg-cyan-950/60 border border-cyan-800/60 transition-all"
                title="Launch Layered Font Extraction Engine"
              >
                <Layers size={14} />
                <span>Launch Layer Exporter</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'specimen' && (
              <SpecimenSandbox
                fontFamily={parsedFont.fontFamilyCssName}
                featureSettingsCss={cssFeatureString}
              />
            )}

            {activeTab === 'glyphs' && (
              <GlyphGrid
                font={parsedFont.font}
                glyphs={parsedFont.glyphs}
                metadata={parsedFont.metadata}
                onSelectGlyph={g => setSelectedGlyph(g)}
              />
            )}

            {activeTab === 'features' && (
              <FeatureInspector
                features={parsedFont.features}
                ligatures={parsedFont.ligatures}
                fontFamily={parsedFont.fontFamilyCssName}
                onToggleFeature={handleToggleFeature}
                cssFeatureString={cssFeatureString}
              />
            )}

            {activeTab === 'metadata' && (
              <MetadataOverview metadata={parsedFont.metadata} />
            )}

            {activeTab === 'tables' && (
              <TableInspector
                font={parsedFont.font}
                variableAxes={parsedFont.variableAxes}
                fontFamily={parsedFont.fontFamilyCssName}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-4 px-6 text-center text-xs font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <span>FONTOPSY • In-Memory Client-Side Font Forensic Tool</span>
        <span>CACHE-STASH VECTOR TYPOGRAPHY PIPELINE</span>
      </footer>

      {/* Layer Exporter Modal */}
      {showLayerExporter && parsedFont && (
        <LayerExporterModal
          font={parsedFont.font}
          fontName={parsedFont.metadata.fullName}
          onClose={() => setShowLayerExporter(false)}
        />
      )}

      {/* Glyph Inspection Modal */}
      {selectedGlyph && parsedFont && (
        <GlyphModal
          glyph={selectedGlyph}
          font={parsedFont.font}
          metadata={parsedFont.metadata}
          onClose={() => setSelectedGlyph(null)}
        />
      )}
    </div>
  );
};

export default App;
