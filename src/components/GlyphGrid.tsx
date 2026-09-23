import React, { useState, useMemo } from 'react';
import type opentype from 'opentype.js';
import type { GlyphDetail, FontMetadata } from '../types/font';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface GlyphGridProps {
  font: opentype.Font;
  glyphs: GlyphDetail[];
  metadata: FontMetadata;
  onSelectGlyph: (glyph: GlyphDetail) => void;
}

type GlyphFilterCategory =
  | 'all'
  | 'uppercase'
  | 'lowercase'
  | 'numbers'
  | 'symbols'
  | 'extended'
  | 'unencoded';

const PAGE_SIZE = 120;

export const GlyphGrid: React.FC<GlyphGridProps> = ({
  font,
  glyphs,
  metadata: _metadata,
  onSelectGlyph,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<GlyphFilterCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter glyphs based on search term & category
  const filteredGlyphs = useMemo(() => {
    return glyphs.filter(g => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = g.name.toLowerCase().includes(query);
        const matchesChar = g.char?.toLowerCase() === query;
        const matchesHex = g.unicodeHex?.toLowerCase().includes(query);
        const matchesIndex = g.index.toString() === query;

        if (!matchesName && !matchesChar && !matchesHex && !matchesIndex) {
          return false;
        }
      }

      // 2. Category filter
      if (category === 'all') return true;

      const code = g.unicode;
      const char = g.char;

      if (category === 'uppercase') {
        return char ? /^[A-Z]$/.test(char) : false;
      }
      if (category === 'lowercase') {
        return char ? /^[a-z]$/.test(char) : false;
      }
      if (category === 'numbers') {
        return char ? /^[0-9]$/.test(char) : false;
      }
      if (category === 'symbols') {
        return (
          code !== undefined &&
          ((code >= 0x0021 && code <= 0x002f) ||
            (code >= 0x003a && code <= 0x0040) ||
            (code >= 0x005b && code <= 0x0060) ||
            (code >= 0x007b && code <= 0x007e) ||
            (code >= 0x2000 && code <= 0x206f) ||
            (code >= 0x2200 && code <= 0x22ff))
        );
      }
      if (category === 'extended') {
        return (
          code !== undefined &&
          ((code >= 0x00c0 && code <= 0x024f) || (code >= 0x1e00 && code <= 0x1eff))
        );
      }
      if (category === 'unencoded') {
        return g.unicode === undefined;
      }

      return true;
    });
  }, [glyphs, searchTerm, category]);

  // Reset page when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, category]);

  // Pagination slice
  const totalPages = Math.ceil(filteredGlyphs.length / PAGE_SIZE) || 1;
  const paginatedGlyphs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredGlyphs.slice(start, start + PAGE_SIZE);
  }, [filteredGlyphs, currentPage]);

  // Render vector SVG for a glyph inside cell
  const renderGlyphSvg = (glyph: GlyphDetail) => {
    if (!glyph.hasContours) {
      return (
        <span className="text-zinc-600 text-xs font-mono italic">
          [empty]
        </span>
      );
    }

    try {
      const opentypeGlyph = font.glyphs.get(glyph.index);
      if (!opentypeGlyph) return null;

      const size = 52;
      // Draw SVG path
      const pathData = opentypeGlyph.getPath(6, size * 0.78, size * 0.9).toPathData(2);

      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="text-zinc-100 fill-current overflow-visible"
        >
          <path d={pathData} />
        </svg>
      );
    } catch {
      return <span className="text-zinc-600 text-xs">err</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Category Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl lab-card border-zinc-800">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by character, GID, name (e.g. 'ampersand', '0041', 'A')..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-mono">
          {(
            [
              ['all', 'All'],
              ['uppercase', 'A-Z'],
              ['lowercase', 'a-z'],
              ['numbers', '0-9'],
              ['symbols', 'Symbols'],
              ['extended', 'Accents'],
              ['unencoded', 'Unencoded'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                category === key
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Stats & Pagination Bar */}
      <div className="flex items-center justify-between px-2 text-xs font-mono text-zinc-400">
        <div>
          Showing{' '}
          <span className="text-cyan-400 font-bold">
            {filteredGlyphs.length.toLocaleString()}
          </span>{' '}
          of {glyphs.length.toLocaleString()} glyphs
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:bg-zinc-800 text-zinc-300"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:bg-zinc-800 text-zinc-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Glyph Tiles Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
        {paginatedGlyphs.map(g => (
          <div
            key={g.index}
            onClick={() => onSelectGlyph(g)}
            className="group relative flex flex-col items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_4px_20px_-4px_rgba(6,182,212,0.2)]"
            style={{ height: 110 }}
          >
            {/* Top GID & Unicode Header */}
            <div className="w-full flex items-center justify-between text-[9px] font-mono text-zinc-500">
              <span>#{g.index}</span>
              <span className="text-zinc-400 font-semibold">{g.unicodeHex || ''}</span>
            </div>

            {/* Glyph SVG Preview */}
            <div className="flex-1 flex items-center justify-center my-1">
              {renderGlyphSvg(g)}
            </div>

            {/* Bottom Glyph Name */}
            <div className="w-full truncate text-center text-[10px] font-mono text-zinc-400 group-hover:text-cyan-300">
              {g.name}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Pagination if multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:bg-zinc-800 text-zinc-300"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:bg-zinc-800 text-zinc-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
