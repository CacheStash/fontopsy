import React, { useState } from 'react';
import { Sun, Moon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface SpecimenSandboxProps {
  fontFamily: string;
  featureSettingsCss: string;
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

const SCRIPT_TESTS = [
  { name: 'Basic Latin', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' },
  { name: 'Numerals & Punctuation', chars: '0123456789.,:;!?\'"()[]{}@#$&*+-/=' },
  { name: 'Latin Extended (Western)', chars: 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ' },
  { name: 'Latin Extended (Central/Eastern)', chars: 'ĄąĆćČčĎďĘęĚěŁłŃńŇňŐőŘřŚśŠšŤťŮůŰűŹźŻżŽž' },
  { name: 'Vietnamese Accent Marks', chars: 'àảãáạăằẳẵắặâầẩẫấậèẻẽéẹêềểễếệìỉĩíịòỏõóọôồổỗốộơờởỡớợùủũúụưừửữứựỳỷỹýỵ' },
  { name: 'Cyrillic (Russian/Slavic)', chars: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя' },
  { name: 'Modern Greek', chars: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψως' },
];

export const SpecimenSandbox: React.FC<SpecimenSandboxProps> = ({
  fontFamily,
  featureSettingsCss,
}) => {
  const [activeTab, setActiveTab] = useState<'type_yourself' | 'waterfall' | 'language_matrix'>('type_yourself');
  const [inputText, setInputText] = useState('The quick brown fox jumps over the lazy dog.');
  const [fontSize, setFontSize] = useState(48);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.3);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isInverted, setIsInverted] = useState(false);

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          {(
            [
              ['type_yourself', 'Type Yourself Sandbox'],
              ['waterfall', 'Waterfall Specimen (72px → 8px)'],
              ['language_matrix', 'Language & Script Matrix'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === key
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. TYPE YOURSELF SANDBOX */}
      {activeTab === 'type_yourself' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl lab-card border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            {/* Font Size Slider */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Size:</span>
              <input
                type="range"
                min="14"
                max="144"
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-28 accent-cyan-400"
              />
              <span className="text-cyan-300 font-bold min-w-[36px]">{fontSize}px</span>
            </div>

            {/* Letter Spacing Slider */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Tracking:</span>
              <input
                type="range"
                min="-3"
                max="24"
                value={letterSpacing}
                onChange={e => setLetterSpacing(Number(e.target.value))}
                className="w-24 accent-cyan-400"
              />
              <span className="text-zinc-200 min-w-[32px]">{letterSpacing}px</span>
            </div>

            {/* Line Height Slider */}
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
              <button
                onClick={() => setTextAlign('left')}
                className={`p-1 rounded ${textAlign === 'left' ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-400'}`}
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => setTextAlign('center')}
                className={`p-1 rounded ${textAlign === 'center' ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-400'}`}
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => setTextAlign('right')}
                className={`p-1 rounded ${textAlign === 'right' ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-400'}`}
              >
                <AlignRight size={14} />
              </button>
              <button
                onClick={() => setTextAlign('justify')}
                className={`p-1 rounded ${textAlign === 'justify' ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-400'}`}
              >
                <AlignJustify size={14} />
              </button>
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
                onClick={() => setInputText(p.text)}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Live Editable Text Container */}
          <div
            className={`min-h-[280px] p-8 rounded-2xl border transition-all ${
              isInverted
                ? 'bg-zinc-100 text-zinc-950 border-zinc-300'
                : 'bg-zinc-950 text-zinc-100 border-zinc-800'
            }`}
          >
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={4}
              style={{
                fontFamily: `'${fontFamily}', sans-serif`,
                fontSize: `${fontSize}px`,
                letterSpacing: `${letterSpacing}px`,
                lineHeight: lineHeight,
                textAlign: textAlign,
                fontFeatureSettings: featureSettingsCss,
              }}
              className="w-full bg-transparent border-none outline-none resize-y"
            />
          </div>
        </div>
      )}

      {/* 2. WATERFALL SPECIMEN */}
      {activeTab === 'waterfall' && (
        <div className="p-6 rounded-2xl lab-card border-zinc-800 space-y-6">
          {WATERFALL_SIZES.map(size => (
            <div key={size} className="flex flex-col sm:flex-row sm:items-baseline gap-3 pb-4 border-b border-zinc-800/60 last:border-0">
              <span className="text-xs font-mono text-cyan-400 font-bold min-w-[50px] select-none">
                {size}px
              </span>
              <p
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: `${size}px`,
                  fontFeatureSettings: featureSettingsCss,
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCRIPT_TESTS.map(test => (
              <div key={test.name} className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">{test.name}</span>
                  <span className="text-zinc-500">{test.chars.length} chars</span>
                </div>
                <div
                  style={{
                    fontFamily: `'${fontFamily}', sans-serif`,
                    fontSize: '22px',
                    lineHeight: 1.4,
                    fontFeatureSettings: featureSettingsCss,
                  }}
                  className="text-zinc-200 break-words py-2"
                >
                  {test.chars}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
