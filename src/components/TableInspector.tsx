import React, { useState } from 'react';
import type opentype from 'opentype.js';
import type { VariableAxis } from '../types/font';
import { Sliders, Database } from 'lucide-react';

interface TableInspectorProps {
  font: opentype.Font;
  variableAxes: VariableAxis[];
  fontFamily: string;
}

export const TableInspector: React.FC<TableInspectorProps> = ({
  font,
  variableAxes,
  fontFamily,
}) => {
  const [axesValues, setAxesValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    variableAxes.forEach(ax => {
      initial[ax.tag] = ax.default;
    });
    return initial;
  });

  const [activeTable, setActiveTable] = useState<string>('head');

  const tables = font.tables;
  const availableTableKeys = Object.keys(tables).filter(k => tables[k] && typeof tables[k] === 'object');

  const handleAxisChange = (tag: string, val: number) => {
    setAxesValues(prev => ({ ...prev, [tag]: val }));
  };

  // Build font-variation-settings string
  const variationSettingsCss = Object.entries(axesValues)
    .map(([tag, val]) => `"${tag}" ${val}`)
    .join(', ');

  const currentTableData = tables[activeTable];

  return (
    <div className="space-y-6">
      {/* 1. Variable Font Controller (if font has fvar table) */}
      {variableAxes.length > 0 && (
        <div className="p-6 rounded-2xl lab-card border-cyan-500/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-cyan-400">
            <Sliders size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
              Variable Font Axes (fvar Table)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {variableAxes.map(axis => (
              <div key={axis.tag} className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold">
                    '{axis.tag}' ({axis.name})
                  </span>
                  <span className="text-zinc-300 font-bold">{axesValues[axis.tag]}</span>
                </div>

                <input
                  type="range"
                  min={axis.min}
                  max={axis.max}
                  value={axesValues[axis.tag] ?? axis.default}
                  onChange={e => handleAxisChange(axis.tag, Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />

                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>min: {axis.min}</span>
                  <span>def: {axis.default}</span>
                  <span>max: {axis.max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Variable Font Live Preview */}
          <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 mb-2">
              CSS: font-variation-settings: {variationSettingsCss || '"normal"'};
            </div>
            <p
              style={{
                fontFamily: `'${fontFamily}', sans-serif`,
                fontSize: '36px',
                fontVariationSettings: variationSettingsCss,
              }}
              className="text-white leading-normal outline-none"
              contentEditable
              suppressContentEditableWarning
            >
              Variable Dynamics In Action 2026
            </p>
          </div>
        </div>
      )}

      {/* 2. SFNT Deep Tables Explorer */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
          <Database size={15} className="text-cyan-400" />
          <span>SFNT Binary Tables ({availableTableKeys.length})</span>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2">
          {availableTableKeys.map(k => (
            <button
              key={k}
              onClick={() => setActiveTable(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTable === k
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Selected Table Raw Key-Value View */}
        <div className="p-5 rounded-2xl lab-card border-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs font-mono">
            <span className="text-cyan-400 font-bold">TABLE: '{activeTable}'</span>
            <span className="text-zinc-500">
              {currentTableData ? Object.keys(currentTableData).length : 0} fields
            </span>
          </div>

          <div className="mt-4 max-h-[460px] overflow-y-auto">
            {currentTableData ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800/80 text-[11px]">
                    <th className="py-2 pr-4">FIELD KEY</th>
                    <th className="py-2">PARSED VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {Object.entries(currentTableData).map(([field, val]) => {
                    let displayVal: string;
                    if (val === null || val === undefined) {
                      displayVal = 'null';
                    } else if (typeof val === 'object') {
                      displayVal = JSON.stringify(val);
                    } else {
                      displayVal = String(val);
                    }

                    return (
                      <tr key={field} className="hover:bg-zinc-900/50">
                        <td className="py-2 pr-4 text-zinc-400 font-medium whitespace-nowrap">
                          {field}
                        </td>
                        <td className="py-2 text-zinc-200 break-all">
                          {displayVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-zinc-500 text-xs font-mono py-4">No data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
