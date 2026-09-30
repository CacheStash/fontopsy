/**
 * PANDUAN PENGEMBANG (INTERNAL GUIDE):
 * - `RasterMetricTile`: Komponen render piksel kanvas (HTML5 Canvas 2D) untuk me-rasterisasi
 *   eksposur kurva vektor master font pada Alternate Popover & Glyph Inspector.
 *   Tujuannya mencegah pembajakan/scraping koordinat kurva Bézier master font dari DOM browser.
 */

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import type opentype from 'opentype.js';
import type { ParsedFontResult } from '../types/font';
import { LanguageMatrixView } from './LanguageMatrixView';
import {
  Sun,
  Moon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical,
  Sparkles,
  Type,
  BookOpen,
} from 'lucide-react';

interface RasterMetricTileProps {
  glyphIdx: number;
  size?: number;
  fontObj: opentype.Font | null;
  color?: string;
  className?: string;
}

const RasterMetricTile: React.FC<RasterMetricTileProps> = React.memo(
  ({ glyphIdx, size = 24, fontObj, color = '#22d3ee', className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !fontObj) return;

      const glyph = fontObj.glyphs?.get(glyphIdx);
      if (!glyph) return;

      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2.5) : 2;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const unitsPerEm = fontObj.unitsPerEm || 1000;
      const renderSize = size * 0.75;
      const scale = renderSize / unitsPerEm;
      const baseline = renderSize;
      const advanceWidth = (glyph.advanceWidth || unitsPerEm * 0.6) * scale;
      const xOffset = Math.max(0, (size - advanceWidth) / 2);

      try {
        const path = glyph.getPath(xOffset, baseline, renderSize);
        ctx.fillStyle = color;
        path.draw(ctx);
        ctx.fill();
      } catch {
        // Ignored
      }
    }, [glyphIdx, size, fontObj, color]);

    return (
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`pointer-events-none ${className}`}
      />
    );
  }
);

interface FontLayerItem {
  id: string;
  fontIndex: number;
  isInverted: boolean;
  isVisible: boolean;
  color: string;
}

interface AlternateGlyph {
  char: string;
  glyphIndex: number;
  featureTag: string;
}

interface SpecimenSandboxProps {
  font: opentype.Font;
  fontFamily: string;
  loadedFonts?: ParsedFontResult[];
  activeFontIndex?: number;
  onSelectFontIndex?: (index: number) => void;
  featureSettingsCss: string;
  variationSettingsCss?: string;
}

const PRESET_PANGRAMS = [
  { name: 'Standard Pangram', text: 'The quick brown fox jumps over the lazy dog.' },
  { name: 'Quartz Pangram', text: 'Sphinx of black quartz, judge my vow.' },
  { name: 'Liquor Jugs', text: 'Pack my box with five dozen liquor jugs.' },
  { name: 'Headline Display', text: 'ARCHITECTURAL TELEMETRY & DESIGN 2026' },
  { name: 'Alphabet & Numerals', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789' },
  { name: 'Special Symbols', text: '!@#$%^&*()_+ -={}|[]\\:";\'<>?,./ ©®™ €$£¥' },
];

const WATERFALL_SIZES = [72, 60, 48, 36, 24, 18, 14, 11, 8];
const PRESET_SIZES = [14, 18, 24, 32, 36, 48, 64, 72, 96, 120, 144];

const DEFAULT_LAYER_COLORS = [
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#eab308', // Amber
  '#10b981', // Emerald
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#f43f5e', // Rose
];

const ALLOWED_ALT_TAGS = new Set([
  'aalt', 'salt', 'swsh', 'titl', 'calt', 'dlig', 'liga',
  ...Array.from({ length: 20 }, (_, i) => `ss${String(i + 1).padStart(2, '0')}`),
]);

export const SpecimenSandbox: React.FC<SpecimenSandboxProps> = ({
  font,
  fontFamily,
  loadedFonts = [],
  activeFontIndex = 0,
  onSelectFontIndex,
  featureSettingsCss,
  variationSettingsCss = '"normal"',
}) => {
  const [activeTab, setActiveTab] = useState<'type_tester' | 'waterfall' | 'language_matrix'>('type_tester');
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog.');
  const [fontSize, setFontSize] = useState(48);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isInverted, setIsInverted] = useState(false);

  // Layer Mode State
  const [isLayeredMode, setIsLayeredMode] = useState<boolean>(() => loadedFonts.length > 1);
  const [layers, setLayers] = useState<FontLayerItem[]>(() => [
    { id: 'layer-1', fontIndex: 0, isInverted: false, isVisible: true, color: '#06b6d4' },
    ...(loadedFonts.length > 1
      ? [{ id: 'layer-2', fontIndex: 1, isInverted: false, isVisible: true, color: '#ec4899' }]
      : []),
  ]);

  // Sync layers when new fonts are added to loadedFonts
  useEffect(() => {
    if (loadedFonts.length > 1) {
      setLayers(prev => {
        if (prev.length <= 1) {
          return [
            { id: 'layer-1', fontIndex: 0, isInverted: false, isVisible: true, color: '#06b6d4' },
            { id: 'layer-2', fontIndex: 1, isInverted: false, isVisible: true, color: '#ec4899' },
          ];
        }
        return prev;
      });
      setIsLayeredMode(true);
    }
  }, [loadedFonts.length]);

  const [draggedLayerIdx, setDraggedLayerIdx] = useState<number | null>(null);
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false);

  // Dynamic OpenType Feature Toggles
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});

  // Alternates state
  const [charOverrides, setCharOverrides] = useState<Record<number, string>>({});
  const [glyphOverrides, setGlyphOverrides] = useState<Record<number, number>>({});
  const [alternateGlyphs, setAlternateGlyphs] = useState<AlternateGlyph[]>([]);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Caret & selection tracking
  const [testerId] = useState(() => `tt-${Math.random().toString(36).substring(2, 9)}`);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const layerContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [caretCoords, setCaretCoords] = useState<{ left: number; top: number; height: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const isDraggingSelection = useRef(false);
  const dragAnchorIdx = useRef<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Detect available OpenType layout features from active font
  const detectedFeatures = useMemo(() => {
    const foundTags = new Set<string>();
    const gsub = font.tables.gsub;
    if (gsub && gsub.features) {
      gsub.features.forEach((feat: { tag: string }) => {
        if (feat.tag) foundTags.add(feat.tag);
      });
    }
    const gpos = font.tables.gpos;
    if (gpos && gpos.features) {
      gpos.features.forEach((feat: { tag: string }) => {
        if (feat.tag) foundTags.add(feat.tag);
      });
    }

    const priorityTags = ['liga', 'dlig', 'calt', 'salt', 'swsh', 'titl', 'cpsp', 'smcp', 'frac', 'zero'];
    const sorted = Array.from(foundTags).sort((a, b) => {
      const pA = priorityTags.indexOf(a);
      const pB = priorityTags.indexOf(b);
      if (pA !== -1 && pB !== -1) return pA - pB;
      if (pA !== -1) return -1;
      if (pB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sorted.map(tag => ({
      tag,
      name: tag.startsWith('ss') ? `Set ${tag.slice(2)}` : tag.toUpperCase(),
    }));
  }, [font]);

  const toggleFeature = (tag: string) => {
    setActiveFeatures(prev => ({ ...prev, [tag]: !prev[tag] }));
  };

  // Sync scroll across textarea and all layer containers
  const handleMasterScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (textareaRef.current) {
      textareaRef.current.scrollTop = scrollTop;
      textareaRef.current.scrollLeft = scrollLeft;
    }
    Object.values(layerContainerRefs.current).forEach(el => {
      if (el) {
        el.scrollTop = scrollTop;
        el.scrollLeft = scrollLeft;
      }
    });
  };

  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    const top = textareaRef.current.scrollTop;
    const left = textareaRef.current.scrollLeft;
    Object.values(layerContainerRefs.current).forEach(el => {
      if (el) {
        el.scrollTop = top;
        el.scrollLeft = left;
      }
    });
  }, [layers]);

  // Caret coordinate updater
  const updateCaretPosition = (pos: number | null) => {
    if (pos === null || !textareaRef.current || !scrollContainerRef.current) {
      setCaretCoords(null);
      return;
    }
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    if (pos >= text.length && text.length > 0) {
      const lastSpan = document.getElementById(`char-span-${testerId}-${text.length - 1}`);
      if (lastSpan) {
        const r = lastSpan.getBoundingClientRect();
        setCaretCoords({
          left: r.right - containerRect.left + container.scrollLeft,
          top: r.top - containerRect.top + container.scrollTop,
          height: r.height || fontSize * lineHeight,
        });
        return;
      }
    }

    const currentSpan = document.getElementById(`char-span-${testerId}-${pos}`);
    if (currentSpan) {
      const r = currentSpan.getBoundingClientRect();
      setCaretCoords({
        left: r.left - containerRect.left + container.scrollLeft,
        top: r.top - containerRect.top + container.scrollTop,
        height: r.height || fontSize * lineHeight,
      });
    } else {
      const firstSpan = document.getElementById(`char-span-${testerId}-0`);
      if (firstSpan) {
        const r = firstSpan.getBoundingClientRect();
        setCaretCoords({
          left: r.left - containerRect.left + container.scrollLeft,
          top: r.top - containerRect.top + container.scrollTop,
          height: r.height || fontSize * lineHeight,
        });
      }
    }
  };

  // Inspect GSUB table for alternate glyphs for character at index
  const checkAlternatesForChar = (index: number) => {
    const targetChar = text.charAt(index);
    if (!targetChar || targetChar === '\n' || targetChar === ' ') {
      setPopoverPos(null);
      setSelectedCharIndex(null);
      return;
    }

    let glyphIndex = 0;
    try {
      glyphIndex = font.charToGlyphIndex(targetChar);
    } catch {
      glyphIndex = 0;
    }

    if (!glyphIndex) {
      setPopoverPos(null);
      setSelectedCharIndex(null);
      return;
    }

    const alternates: AlternateGlyph[] = [];
    const gsub = font.tables.gsub;

    if (gsub && gsub.features && gsub.lookups) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gsub.features.forEach((featureRecord: any) => {
        if (!ALLOWED_ALT_TAGS.has(featureRecord.tag)) return;

        featureRecord.feature?.lookupListIndexes?.forEach((lookupIndex: number) => {
          const lookup = gsub.lookups[lookupIndex];
          if (!lookup || !lookup.subtables) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lookup.subtables.forEach((subtable: any) => {
            try {
              let covIdx = -1;
              const cov = subtable.coverage;
              if (!cov) return;

              if (cov.format === 2 && Array.isArray(cov.ranges)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const range = cov.ranges.find((r: any) => glyphIndex >= r.start && glyphIndex <= r.end);
                if (range) {
                  covIdx = range.index + (glyphIndex - range.start);
                }
              } else if (Array.isArray(cov.glyphs)) {
                covIdx = cov.glyphs.indexOf(glyphIndex);
              } else if (Array.isArray(cov)) {
                covIdx = cov.indexOf(glyphIndex);
              }

              if (covIdx === -1) return;

              const extractedIndices: number[] = [];

              if (lookup.lookupType === 1) {
                if (subtable.deltaGlyphId !== undefined) {
                  extractedIndices.push((glyphIndex + subtable.deltaGlyphId) % 65536);
                } else if (Array.isArray(subtable.substitute)) {
                  const targetSub = subtable.substitute[covIdx];
                  if (targetSub !== undefined) extractedIndices.push(targetSub);
                }
              } else if (lookup.lookupType === 3) {
                const altSets = subtable.alternateSets || subtable.alternateSet || subtable.alternates || [];
                const targetSet = altSets[covIdx];
                if (targetSet) {
                  if (Array.isArray(targetSet)) {
                    extractedIndices.push(...targetSet);
                  } else if (Array.isArray(targetSet.alternateGlyphs)) {
                    extractedIndices.push(...targetSet.alternateGlyphs);
                  } else if (Array.isArray(targetSet.alternates)) {
                    extractedIndices.push(...targetSet.alternates);
                  } else if (Array.isArray(targetSet.glyphs)) {
                    extractedIndices.push(...targetSet.glyphs);
                  }
                }
              }

              extractedIndices.forEach((altIdx: number, idxInFeature: number) => {
                const numIdx = Number(altIdx);
                if (isNaN(numIdx) || numIdx === 0 || numIdx === glyphIndex) return;

                const targetGlyph = font.glyphs.get(numIdx);
                if (!targetGlyph) return;

                const charStr =
                  targetGlyph.unicode !== undefined
                    ? String.fromCodePoint(targetGlyph.unicode)
                    : targetChar;

                const rawTag = featureRecord.tag === 'aalt' ? 'salt' : featureRecord.tag;
                const effectiveTagWithIndex =
                  rawTag === 'salt' || rawTag === 'swsh'
                    ? `"${rawTag}" ${idxInFeature + 1}`
                    : `"${rawTag}" 1`;

                if (!alternates.some(a => a.glyphIndex === numIdx)) {
                  alternates.push({
                    char: charStr,
                    glyphIndex: numIdx,
                    featureTag: effectiveTagWithIndex,
                  });
                }
              });
            } catch {
              // Ignore non-standard subtable
            }
          });
        });
      });
    }

    if (alternates.length > 0) {
      setSelectedCharIndex(index);
      let posX = 24;
      let posY = 16;
      const targetCharEl = document.getElementById(`char-span-${testerId}-${index}`);
      if (targetCharEl && textareaRef.current) {
        const containerRect = textareaRef.current.getBoundingClientRect();
        const charRect = targetCharEl.getBoundingClientRect();
        posX = charRect.left - containerRect.left;
        posY = charRect.top - containerRect.top;
      }
      setPopoverPos({ x: posX, y: posY });
      setAlternateGlyphs(alternates);
    } else {
      setPopoverPos(null);
      setSelectedCharIndex(null);
    }
  };

  const handleSelectionOrCursorChange = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;

    if (selectionStart === selectionEnd) {
      setSelectionRange(null);
      updateCaretPosition(selectionStart);
      setPopoverPos(null);
      setSelectedCharIndex(null);
    } else {
      setCaretCoords(null);
      setSelectionRange({ start: selectionStart, end: selectionEnd });
      if (selectionEnd - selectionStart === 1) {
        checkAlternatesForChar(selectionStart);
      } else {
        setPopoverPos(null);
        setSelectedCharIndex(null);
      }
    }
  };

  const handleSpanMouseDown = (index: number) => {
    isDraggingSelection.current = true;
    dragAnchorIdx.current = index;
    setIsFocused(true);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + 1);
    }

    updateCaretPosition(index);
    setSelectionRange({ start: index, end: index + 1 });
    checkAlternatesForChar(index);
  };

  const handleSpanMouseEnter = (index: number) => {
    if (!isDraggingSelection.current || dragAnchorIdx.current === null) return;
    const anchor = dragAnchorIdx.current;
    const start = Math.min(anchor, index);
    const end = Math.max(anchor, index) + 1;
    setSelectionRange({ start, end });
    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(start, end);
    }
    if (end - start === 1) {
      checkAlternatesForChar(start);
    } else {
      setPopoverPos(null);
      setSelectedCharIndex(null);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingSelection.current = false;
      dragAnchorIdx.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const applyAlternate = (alt: AlternateGlyph) => {
    if (selectedCharIndex === null) return;

    if (!alt.glyphIndex || alt.glyphIndex === 0) {
      setGlyphOverrides(prev => {
        const next = { ...prev };
        delete next[selectedCharIndex];
        return next;
      });
      setCharOverrides(prev => {
        const next = { ...prev };
        delete next[selectedCharIndex];
        return next;
      });
    } else {
      setGlyphOverrides(prev => ({
        ...prev,
        [selectedCharIndex]: alt.glyphIndex,
      }));
      setCharOverrides(prev => ({
        ...prev,
        [selectedCharIndex]: alt.featureTag || 'salt',
      }));
    }

    setPopoverPos(null);
    setSelectedCharIndex(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = e.target.value;
    const prevText = text;
    setText(nextText);

    const diff = nextText.length - prevText.length;
    const changePos = textareaRef.current?.selectionStart ?? nextText.length;
    const insertPos = diff > 0 ? changePos - diff : changePos;

    // Shift overrides
    setGlyphOverrides(prev => {
      const next: Record<number, number> = {};
      Object.entries(prev).forEach(([k, val]) => {
        const idx = Number(k);
        if (diff > 0) {
          next[idx < insertPos ? idx : idx + diff] = val;
        } else if (diff < 0) {
          const deletedCount = Math.abs(diff);
          if (idx < insertPos) {
            next[idx] = val;
          } else if (idx >= insertPos + deletedCount) {
            next[idx - deletedCount] = val;
          }
        } else {
          next[idx] = val;
        }
      });
      return next;
    });

    setCharOverrides(prev => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([k, val]) => {
        const idx = Number(k);
        if (diff > 0) {
          next[idx < insertPos ? idx : idx + diff] = val;
        } else if (diff < 0) {
          const deletedCount = Math.abs(diff);
          if (idx < insertPos) {
            next[idx] = val;
          } else if (idx >= insertPos + deletedCount) {
            next[idx - deletedCount] = val;
          }
        } else {
          next[idx] = val;
        }
      });
      return next;
    });

    setPopoverPos(null);
    setSelectedCharIndex(null);
    setSelectionRange(null);
    setTimeout(handleSelectionOrCursorChange, 0);
  };

  // Layer management handlers
  const addSpecificLayer = (fontIndex: number) => {
    const assignedColor = DEFAULT_LAYER_COLORS[layers.length % DEFAULT_LAYER_COLORS.length];
    const newLayer: FontLayerItem = {
      id: `layer-${Date.now()}`,
      fontIndex,
      isInverted: false,
      isVisible: true,
      color: assignedColor,
    };
    setLayers(prev => [...prev, newLayer]);
    setIsAddLayerOpen(false);
  };

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
  };

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;
    const next = [...layers];
    const item = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = item;
    setLayers(next);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, isVisible: !l.isVisible } : l)));
  };

  const changeLayerFont = (id: string, fontIndex: number) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, fontIndex } : l)));
  };

  const changeLayerColor = (id: string, color: string) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, color } : l)));
  };

  const handleLayerDragStart = (idx: number) => {
    setDraggedLayerIdx(idx);
  };

  const handleLayerDrop = (targetIdx: number) => {
    if (draggedLayerIdx === null || draggedLayerIdx === targetIdx) return;
    const updated = [...layers];
    const item = updated.splice(draggedLayerIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    setLayers(updated);
    setDraggedLayerIdx(null);
  };

  // Compute composite active OpenType features
  const globalActiveFeatureString = useMemo(() => {
    const toggled = Object.entries(activeFeatures)
      .filter(([, on]) => on)
      .map(([t]) => `"${t}" 1`);

    if (toggled.length > 0) {
      return toggled.join(', ');
    }
    return featureSettingsCss || 'normal';
  }, [activeFeatures, featureSettingsCss]);

  // Render text spans synchronized across single / multi-layered views
  const renderTextSpans = (fontIdx: number) => {
    const targetFont = loadedFonts[fontIdx]?.fontFamilyCssName || fontFamily;
    const styleFontFamily = `'${targetFont}', sans-serif`;

    return text.split('').map((char, i) => {
      const overrideGlyphIdx = glyphOverrides[i];
      const overrideFeature = charOverrides[i];

      let activeCharFeatures = globalActiveFeatureString;
      if (overrideFeature && overrideFeature !== 'alt') {
        const featureStr = overrideFeature.includes('"') ? overrideFeature : `"${overrideFeature}" 1`;
        activeCharFeatures =
          globalActiveFeatureString === 'normal'
            ? featureStr
            : `${featureStr}, ${globalActiveFeatureString}`;
      }

      const isCurrentActiveLayer = fontIdx === (layers[0]?.fontIndex ?? activeFontIndex);
      const isSelected = selectionRange
        ? i >= Math.min(selectionRange.start, selectionRange.end) &&
          i < Math.max(selectionRange.start, selectionRange.end)
        : selectedCharIndex === i;

      return (
        <span
          key={i}
          id={isCurrentActiveLayer ? `char-span-${testerId}-${i}` : undefined}
          data-char-idx={i}
          style={{
            fontFamily: styleFontFamily,
            fontFeatureSettings: activeCharFeatures,
            fontVariationSettings: variationSettingsCss,
          }}
          onMouseDown={e => {
            e.stopPropagation();
            handleSpanMouseDown(i);
          }}
          onMouseEnter={() => handleSpanMouseEnter(i)}
          className={`cursor-text select-none transition-colors ${
            isSelected ? 'bg-cyan-500/30 text-white rounded-xs ring-1 ring-cyan-400' : ''
          }`}
        >
          {(() => {
            if (overrideGlyphIdx !== undefined && font) {
              try {
                const g = font.glyphs.get(overrideGlyphIdx);
                if (g && g.unicode) {
                  return String.fromCodePoint(g.unicode);
                }
              } catch {
                // Fallback to char
              }
            }
            return char;
          })()}
        </span>
      );
    });
  };

  const activeFamilyFontName =
    loadedFonts[activeFontIndex]?.fontFamilyCssName || fontFamily;

  return (
    <div className="space-y-6">
      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          {(
            [
              ['type_tester', 'Type Tester & Layer Mode'],
              ['waterfall', 'Waterfall Specimen (72px → 8px)'],
              ['language_matrix', 'Language & Script Matrix'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeTab === key
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {key === 'type_tester' && <Type size={14} />}
              {key === 'waterfall' && <Layers size={14} />}
              {key === 'language_matrix' && <BookOpen size={14} />}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. TYPE TESTER & LAYER MODE */}
      {activeTab === 'type_tester' && (
        <div className="space-y-4">
          {/* Top Controls Bar */}
          <div className="p-4 rounded-2xl lab-card border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            {/* Font Style Selector (if multiple styles loaded in family) */}
            {loadedFonts.length > 1 && onSelectFontIndex && (
              <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
                <span className="text-zinc-400">Style:</span>
                <select
                  value={activeFontIndex}
                  onChange={e => onSelectFontIndex(Number(e.target.value))}
                  className="bg-zinc-900 text-cyan-300 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer"
                >
                  {loadedFonts.map((f, i) => (
                    <option key={i} value={i}>
                      {f.metadata.styleName || f.metadata.fullName || `Style ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Layer Mode Toggle Button */}
            <button
              type="button"
              onClick={() => setIsLayeredMode(!isLayeredMode)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                isLayeredMode
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Layers size={14} />
              <span>
                LAYER MODE: {isLayeredMode ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

            {/* Font Size Selector / Slider */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Size:</span>
              <input
                type="range"
                min="12"
                max="144"
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-24 accent-cyan-400"
              />
              <select
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="bg-zinc-900 text-cyan-300 border border-zinc-800 rounded px-1.5 py-0.5 text-xs font-bold outline-none cursor-pointer"
              >
                {PRESET_SIZES.map(s => (
                  <option key={s} value={s}>
                    {s}px
                  </option>
                ))}
              </select>
            </div>

            {/* Letter Spacing (Tracking) */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Tracking:</span>
              <input
                type="range"
                min="-3"
                max="24"
                value={letterSpacing}
                onChange={e => setLetterSpacing(Number(e.target.value))}
                className="w-20 accent-cyan-400"
              />
              <span className="text-zinc-200 min-w-[28px]">{letterSpacing}px</span>
            </div>

            {/* Line Height (Leading) */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Leading:</span>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={lineHeight}
                onChange={e => setLineHeight(Number(e.target.value))}
                className="w-20 accent-cyan-400"
              />
              <span className="text-zinc-200 min-w-[28px]">{lineHeight.toFixed(2)}</span>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {(['left', 'center', 'right', 'justify'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setTextAlign(a)}
                  className={`p-1 rounded ${textAlign === a ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-400 hover:text-white'}`}
                >
                  {a === 'left' && <AlignLeft size={14} />}
                  {a === 'center' && <AlignCenter size={14} />}
                  {a === 'right' && <AlignRight size={14} />}
                  {a === 'justify' && <AlignJustify size={14} />}
                </button>
              ))}
            </div>

            {/* Color Inversion Toggle */}
            <button
              onClick={() => setIsInverted(!isInverted)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              title="Invert background / text color"
            >
              {isInverted ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-zinc-500 mr-1">Presets:</span>
            {PRESET_PANGRAMS.map(p => (
              <button
                key={p.name}
                onClick={() => setText(p.text)}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* MAIN INTERACTIVE DISPLAY CANVAS (WITH OVERLAY TEXTAREA & ALTERNATE POPOVER) */}
          <div
            className={`relative min-h-[300px] rounded-2xl border transition-all overflow-hidden ${
              isInverted
                ? 'bg-zinc-100 text-zinc-950 border-zinc-300'
                : 'bg-zinc-950 text-zinc-100 border-zinc-800 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]'
            }`}
          >
            <div
              ref={scrollContainerRef}
              onScroll={handleMasterScroll}
              className="relative w-full min-h-[300px] max-h-[500px] overflow-y-auto overflow-x-hidden p-8"
            >
              {/* SINGLE STYLE DISPLAY */}
              {!isLayeredMode ? (
                <div
                  ref={el => {
                    layerContainerRefs.current['single'] = el;
                  }}
                  className="relative w-full whitespace-pre-wrap break-words z-20 pointer-events-auto select-none min-h-full cursor-text"
                  style={{
                    fontFamily: `'${activeFamilyFontName}', sans-serif`,
                    fontSize: `${fontSize}px`,
                    textAlign,
                    lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                    fontFeatureSettings: globalActiveFeatureString,
                    fontVariationSettings: variationSettingsCss,
                  }}
                  onClick={() => textareaRef.current?.focus()}
                >
                  {renderTextSpans(activeFontIndex)}
                </div>
              ) : (
                /* MULTI-LAYER STACKED DISPLAY */
                <div
                  className="relative w-full min-h-full cursor-text"
                  onClick={() => textareaRef.current?.focus()}
                >
                  {layers.map((layer, stackIdx) => {
                    if (!layer.isVisible) return null;
                    const calculatedZIndex = layers.length - stackIdx;
                    const isFirstVisible = stackIdx === 0;

                    return (
                      <div
                        key={layer.id}
                        ref={el => {
                          layerContainerRefs.current[layer.id] = el;
                        }}
                        className={`${isFirstVisible ? 'relative' : 'absolute inset-0'} w-full whitespace-pre-wrap break-words select-none z-20 pointer-events-auto min-h-full`}
                        style={{
                          fontSize: `${fontSize}px`,
                          textAlign,
                          lineHeight,
                          letterSpacing: `${letterSpacing}px`,
                          zIndex: calculatedZIndex,
                          color: layer.color,
                        }}
                      >
                        {renderTextSpans(layer.fontIndex)}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ACCURATE VISUAL CARET */}
              {isFocused && caretCoords && (
                <div
                  className="absolute z-30 pointer-events-none animate-pulse bg-cyan-400"
                  style={{
                    left: `${caretCoords.left}px`,
                    top: `${caretCoords.top}px`,
                    height: `${caretCoords.height}px`,
                    width: '2px',
                  }}
                />
              )}

              {/* TRANSPARENT EDITABLE TEXTAREA */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onFocus={() => {
                  setIsFocused(true);
                  handleSelectionOrCursorChange();
                }}
                onBlur={() => {
                  setIsFocused(false);
                  setCaretCoords(null);
                }}
                onSelect={handleSelectionOrCursorChange}
                onKeyUp={handleSelectionOrCursorChange}
                onKeyDown={handleSelectionOrCursorChange}
                onMouseUp={handleSelectionOrCursorChange}
                onMouseDown={handleSelectionOrCursorChange}
                className="absolute inset-0 w-full h-full bg-transparent outline-none resize-none p-8 z-10 text-transparent caret-transparent selection:bg-transparent selection:text-transparent pointer-events-none overflow-hidden"
                style={{
                  fontFamily: `'${activeFamilyFontName}', sans-serif`,
                  fontSize: `${fontSize}px`,
                  textAlign,
                  lineHeight,
                  letterSpacing: `${letterSpacing}px`,
                }}
                spellCheck={false}
              />

              {/* ALTERNATE GLYPH POPOVER */}
              {popoverPos && alternateGlyphs.length > 0 && selectedCharIndex !== null && (
                <div
                  className="absolute z-50 bg-zinc-900 border border-cyan-500/80 shadow-[0_0_25px_rgba(6,182,212,0.3)] rounded-xl p-2.5 flex items-center gap-2.5 pointer-events-auto"
                  style={{
                    left: `${Math.max(16, popoverPos.x - 20)}px`,
                    top: `${popoverPos.y > 70 ? popoverPos.y - 70 : popoverPos.y + fontSize + 20}px`,
                  }}
                >
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400 border-r border-zinc-700 pr-2">
                    Alternates
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm">
                    {/* Default Option */}
                    <button
                      type="button"
                      onClick={() =>
                        applyAlternate({
                          char: text.charAt(selectedCharIndex),
                          glyphIndex: 0,
                          featureTag: '',
                        })
                      }
                      className={`h-11 min-w-[44px] px-2 flex flex-col items-center justify-center rounded border transition-all ${
                        !charOverrides[selectedCharIndex]
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                          : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                      }`}
                      title="Default Glyph"
                    >
                      <div className="h-6 flex items-center justify-center">
                        <RasterMetricTile
                          glyphIdx={font.charToGlyphIndex(text.charAt(selectedCharIndex))}
                          size={20}
                          fontObj={font}
                          color="#22d3ee"
                        />
                      </div>
                      <span className="text-[7px] font-mono opacity-60 uppercase mt-0.5">
                        DEFAULT
                      </span>
                    </button>

                    {/* Alternate Glyph Options */}
                    {alternateGlyphs.map((alt, idx) => {
                      const isSelected = glyphOverrides[selectedCharIndex] === alt.glyphIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyAlternate(alt)}
                          className={`h-11 min-w-[44px] px-2 flex flex-col items-center justify-center rounded border transition-all ${
                            isSelected
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                              : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                          }`}
                          title={`Glyph #${alt.glyphIndex} (${alt.featureTag.toUpperCase()})`}
                        >
                          <div className="h-6 flex items-center justify-center">
                            <RasterMetricTile
                              glyphIdx={alt.glyphIndex}
                              size={20}
                              fontObj={font}
                              color="#22d3ee"
                            />
                          </div>
                          <span className="text-[7px] font-mono opacity-60 uppercase mt-0.5">
                            {alt.featureTag.replace(/"/g, '')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LAYER STACKING ORDER CONTROLLER (WHEN LAYER MODE IS ACTIVE) */}
          {isLayeredMode && (
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-cyan-400" />
                  <span className="font-bold text-cyan-300 tracking-wider">
                    LAYER STACKING ORDER (TOP TO BOTTOM)
                  </span>
                </div>

                {/* Add Layer Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAddLayerOpen(!isAddLayerOpen)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 transition-all flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>ADD LAYER</span>
                  </button>

                  {isAddLayerOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsAddLayerOpen(false)}
                      />
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-zinc-900 border border-zinc-700 rounded-xl z-50 shadow-2xl overflow-hidden py-1">
                        <div className="px-3 py-1.5 text-[9px] font-bold uppercase text-zinc-400 border-b border-zinc-800 tracking-wider">
                          Select Font Style
                        </div>
                        {(loadedFonts.length > 0 ? loadedFonts : [{ metadata: { styleName: 'Current Font' } }]).map(
                          (f, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => addSpecificLayer(idx)}
                              className="w-full text-left px-3 py-2 text-xs font-mono text-zinc-200 hover:bg-zinc-800 hover:text-cyan-300 transition-colors"
                            >
                              {f.metadata.styleName || `Style ${idx + 1}`}
                            </button>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Layer Stack Items List */}
              <div className="space-y-2">
                {layers.map((layer, idx) => (
                  <div
                    key={layer.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleLayerDrop(idx)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-3 ${
                      draggedLayerIdx === idx
                        ? 'opacity-30 border-dashed border-cyan-400'
                        : !layer.isVisible
                          ? 'opacity-40 border-zinc-800 bg-zinc-950/40'
                          : 'border-zinc-800 bg-zinc-900/60'
                    }`}
                  >
                    {/* Drag Handle & Style Selector */}
                    <div className="flex items-center gap-3">
                      <div
                        draggable
                        onDragStart={() => handleLayerDragStart(idx)}
                        onDragEnd={() => setDraggedLayerIdx(null)}
                        className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-cyan-400 p-1"
                        title="Drag to reorder layer stack"
                      >
                        <GripVertical size={16} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-zinc-500 w-4">
                        #{idx + 1}
                      </span>

                      {/* Font selector */}
                      <select
                        value={layer.fontIndex}
                        onChange={e => changeLayerFont(layer.id, parseInt(e.target.value))}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 outline-none cursor-pointer"
                      >
                        {(loadedFonts.length > 0
                          ? loadedFonts
                          : [{ metadata: { styleName: 'Base Font' } }]
                        ).map((f, fIdx) => (
                          <option key={fIdx} value={fIdx}>
                            {f.metadata.styleName || `Style ${fIdx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Color Picker & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {/* Color Picker with Native Input */}
                      <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 relative group cursor-pointer hover:border-cyan-500 transition-colors">
                        <input
                          type="color"
                          value={layer.color}
                          onChange={e => changeLayerColor(layer.id, e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          title="Pick layer chromatic color"
                        />
                        <div
                          className="w-4 h-4 rounded border border-white/20 shadow-xs"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-200">
                          {layer.color}
                        </span>
                      </div>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {layer.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveLayer(idx, 'up')}
                        className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                        title="Bring Forward"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === layers.length - 1}
                        onClick={() => moveLayer(idx, 'down')}
                        className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                        title="Send Backward"
                      >
                        <ArrowDown size={14} />
                      </button>

                      {/* Remove Layer */}
                      {layers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLayer(layer.id)}
                          className="p-1.5 rounded-lg border border-rose-800/60 text-rose-400 hover:bg-rose-950 transition-colors"
                          title="Remove Layer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC OPENTYPE FEATURES DETECTOR & TOGGLES */}
          {detectedFeatures.length > 0 && (
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-400" />
                  <span className="font-bold text-amber-300 tracking-wider">
                    OPENTYPE FEATURE TOGGLE DETECTOR ({detectedFeatures.length})
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Toggle features to see live glyph substitutions
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto">
                {detectedFeatures.map(feat => {
                  const isActive = !!activeFeatures[feat.tag];
                  return (
                    <button
                      key={feat.tag}
                      type="button"
                      onClick={() => toggleFeature(feat.tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-mono">{feat.name}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded ${
                          isActive ? 'bg-cyan-600 text-black' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {feat.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. WATERFALL SPECIMEN */}
      {activeTab === 'waterfall' && (
        <div className="p-6 rounded-2xl lab-card border-zinc-800 space-y-6">
          {WATERFALL_SIZES.map(size => (
            <div
              key={size}
              className="flex flex-col sm:flex-row sm:items-baseline gap-3 pb-4 border-b border-zinc-800/60 last:border-0"
            >
              <span className="text-xs font-mono text-cyan-400 font-bold min-w-[50px] select-none">
                {size}px
              </span>
              <p
                style={{
                  fontFamily: `'${activeFamilyFontName}', sans-serif`,
                  fontSize: `${size}px`,
                  fontFeatureSettings: globalActiveFeatureString,
                  fontVariationSettings: variationSettingsCss,
                  lineHeight: 1.2,
                }}
                className="text-zinc-200 outline-none flex-1"
                contentEditable
                suppressContentEditableWarning
              >
                Sphinx of black quartz, judge my vow. 1234567890
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 3. LANGUAGE & SCRIPT MATRIX */}
      {activeTab === 'language_matrix' && (
        <LanguageMatrixView
          font={font}
          fontFamily={activeFamilyFontName}
          featureSettingsCss={globalActiveFeatureString}
          variationSettingsCss={variationSettingsCss}
        />
      )}
    </div>
  );
};
