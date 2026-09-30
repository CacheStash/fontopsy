import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ParsedFontResult, GlyphDetail } from './types/font';
import { parseFontFile } from './utils/fontParser';
import { Navbar } from './components/Navbar';
import { DropZone, type LoadedFileItem } from './components/DropZone';
import { MetadataOverview } from './components/MetadataOverview';
import { GlyphGrid } from './components/GlyphGrid';
import { GlyphModal } from './components/GlyphModal';
import { SpecimenSandbox } from './components/SpecimenSandbox';
import { FeatureInspector } from './components/FeatureInspector';
import { TableInspector } from './components/TableInspector';
import { SvgExporterModal } from './components/SvgExporterModal';
import { VariableAxesController } from './components/VariableAxesController';
import { checkBufferAlignmentMetric } from './utils/envValidator';
import {
  Type,
  Grid,
  Sparkles,
  Info,
  Database,
  Cpu,
  AlertCircle,
  FileCode,
} from 'lucide-react';

export const App: React.FC = () => {
  const [loadedFonts, setLoadedFonts] = useState<ParsedFontResult[]>([]);
  const [activeFontIndex, setActiveFontIndex] = useState<number>(0);

  const parsedFont = loadedFonts[activeFontIndex] || null;

  // Local/Offline Tooling Context (SVG Exporter strictly restricted to local/offline environments)
  const isLocalContext = useMemo(() => checkBufferAlignmentMetric(), []);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'glyphs' | 'specimen' | 'features' | 'metadata' | 'tables'>('specimen');

  // Modals
  const [selectedGlyph, setSelectedGlyph] = useState<GlyphDetail | null>(null);
  const [showSvgExporter, setShowSvgExporter] = useState<boolean>(false);

  // OpenType Feature Toggles
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});

  // Variable Font Axes Values
  const [variationValues, setVariationValues] = useState<Record<string, number>>({});

  // Theme mode (Dark by default, invertable to high-contrast Light mode)
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fontopsy_theme') === 'light';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isLightMode) {
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('fontopsy_theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('fontopsy_theme', 'dark');
      }
    } catch (e) {
      console.warn('Failed to sync theme to localStorage', e);
    }
  }, [isLightMode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load one or multiple font buffers (supporting full family styles & chromatic layers)
  const handleLoadFiles = async (files: LoadedFileItem[]) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const parsedResults = await Promise.all(
        files.map(f => parseFontFile(f.buffer, f.fileName))
      );

      setLoadedFonts(parsedResults);
      setActiveFontIndex(0);

      const primary = parsedResults[0];
      if (primary) {
        // Initialize feature toggles
        const initialToggles: Record<string, boolean> = {};
        primary.features.forEach(f => {
          initialToggles[f.tag] = f.enabled;
        });
        setFeatureToggles(initialToggles);

        // Auto-detect and initialize Variable Font Axes
        const initialAxes: Record<string, number> = {};
        primary.variableAxes.forEach(ax => {
          initialAxes[ax.tag] = ax.default;
        });
        setVariationValues(initialAxes);
      }
    } catch (err: unknown) {
      console.error('Failed to parse font file(s):', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to parse font binary. Please ensure the file is a valid OTF, TTF, WOFF, or WOFF2.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Sync telemetry when active style switches
  useEffect(() => {
    if (!parsedFont) return;
    const initialToggles: Record<string, boolean> = {};
    parsedFont.features.forEach(f => {
      initialToggles[f.tag] = f.enabled;
    });
    setFeatureToggles(initialToggles);

    const initialAxes: Record<string, number> = {};
    parsedFont.variableAxes.forEach(ax => {
      initialAxes[ax.tag] = ax.default;
    });
    setVariationValues(initialAxes);
  }, [activeFontIndex]);

  // Load bundled sample font
  const loadSampleFont = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/sample-font.ttf');
      if (!response.ok) throw new Error('Failed to fetch sample font');
      const buffer = await response.arrayBuffer();
      await handleLoadFiles([{ buffer, fileName: 'Inter-Regular.ttf' }]);
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

  const handleResetFeatures = () => {
    if (!parsedFont) return;
    const initialToggles: Record<string, boolean> = {};
    parsedFont.features.forEach(f => {
      initialToggles[f.tag] = f.tag === 'kern' || f.tag === 'liga';
    });
    setFeatureToggles(initialToggles);
  };

  const handleToggleAllFeatures = (enabled: boolean) => {
    if (!parsedFont) return;
    const toggles: Record<string, boolean> = {};
    parsedFont.features.forEach(f => {
      toggles[f.tag] = enabled;
    });
    setFeatureToggles(toggles);
  };

  // Compute CSS font-variation-settings string for Variable Fonts
  const cssVariationString = useMemo(() => {
    if (!parsedFont?.metadata.isVariable || parsedFont.variableAxes.length === 0) {
      return '"normal"';
    }
    const parts = Object.entries(variationValues).map(
      ([tag, val]) => `"${tag}" ${val}`
    );
    return parts.length > 0 ? parts.join(', ') : '"normal"';
  }, [parsedFont, variationValues]);

  const handleAxisChange = (tag: string, val: number) => {
    setVariationValues(prev => ({ ...prev, [tag]: val }));
  };

  const handleSetCoordinates = (coords: Record<string, number>) => {
    setVariationValues(prev => ({ ...prev, ...coords }));
  };

  const handleResetAxes = () => {
    if (!parsedFont) return;
    const defaults: Record<string, number> = {};
    parsedFont.variableAxes.forEach(ax => {
      defaults[ax.tag] = ax.default;
    });
    setVariationValues(defaults);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* Background Gradient Blurred Orbs */}
      <div className="grain-orb-base orb-cyan-top pointer-events-none" />
      <div className="grain-orb-base orb-violet-bottom pointer-events-none" />
      <div className="grain-orb-base orb-center-ambient pointer-events-none hidden md:block" />

      {/* Hidden File Picker Input supporting Multiple Files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const readers = files.map(file => {
              return new Promise<LoadedFileItem>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = ev => {
                  const buf = ev.target?.result as ArrayBuffer;
                  if (buf) resolve({ buffer: buf, fileName: file.name });
                  else reject(new Error('Failed to read file'));
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(file);
              });
            });
            Promise.all(readers)
              .then(handleLoadFiles)
              .catch(err => {
                console.error('File reading error:', err);
              });
          }
          e.target.value = '';
        }}
        multiple
        accept=".otf,.ttf,.woff,.woff2"
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        parsedFont={parsedFont}
        loadedFonts={loadedFonts}
        activeFontIndex={activeFontIndex}
        onSelectFontIndex={setActiveFontIndex}
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode(prev => !prev)}
        isLocalMode={isLocalContext}
        onOpenFilePicker={() => fileInputRef.current?.click()}
        onOpenExporter={() => setShowSvgExporter(true)}
        onLoadSample={loadSampleFont}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Full-width Drag & Drop Button Banner across main content */}
        <DropZone
          onFilesLoaded={handleLoadFiles}
          isLoading={isLoading}
        />

        {/* Error Alert if parse fails */}
        {error && (
          <div className="w-full p-4 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs font-mono flex items-center gap-3">
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

        {isLoading && !parsedFont && (
          <div className="flex flex-col items-center justify-center p-20 text-zinc-400 font-mono text-sm">
            <Cpu size={36} className="animate-spin text-cyan-400 mb-3" />
            <span>Parsing font binary in progress...</span>
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
                  <span>Specimen & Layers</span>
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

              {/* Quick Trigger: SVG Exporter Modal (Offline/Localhost Tooling Only) */}
              {isLocalContext && (
                <button
                  onClick={() => setShowSvgExporter(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 hover:bg-cyan-950/60 border border-cyan-800/60 transition-all"
                  title="Launch Font SVG Matrix Exporter (Local Tooling Only)"
                >
                  <FileCode size={14} />
                  <span>Launch SVG Exporter</span>
                </button>
              )}
            </div>

            {/* Auto-detected Variable Font Axes Controller */}
            {parsedFont.metadata.isVariable && parsedFont.variableAxes.length > 0 && (
              <VariableAxesController
                axes={parsedFont.variableAxes}
                instances={parsedFont.variableInstances}
                values={variationValues}
                onChange={handleAxisChange}
                onSetCoordinates={handleSetCoordinates}
                onReset={handleResetAxes}
                cssVariationString={cssVariationString}
              />
            )}

            {/* Tab Views */}
            {activeTab === 'specimen' && (
              <SpecimenSandbox
                font={parsedFont.font}
                fontFamily={parsedFont.fontFamilyCssName}
                loadedFonts={loadedFonts}
                activeFontIndex={activeFontIndex}
                onSelectFontIndex={setActiveFontIndex}
                featureSettingsCss={cssFeatureString}
                variationSettingsCss={cssVariationString}
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
                featureToggles={featureToggles}
                onToggleFeature={handleToggleFeature}
                onResetFeatures={handleResetFeatures}
                onToggleAllFeatures={handleToggleAllFeatures}
                cssFeatureString={cssFeatureString}
                variationSettingsCss={cssVariationString}
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
        <span>FONTOPSY • Font Inspector & Layers Tester</span>
        <span>CACHE-STASH VECTOR TYPOGRAPHY PIPELINE</span>
      </footer>

      {/* SVG Exporter Modal (Offline/Localhost Tooling Only) */}
      {isLocalContext && showSvgExporter && parsedFont && (
        <SvgExporterModal
          font={parsedFont.font}
          fontName={parsedFont.metadata.fullName || parsedFont.metadata.familyName}
          onClose={() => setShowSvgExporter(false)}
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
