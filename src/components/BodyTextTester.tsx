import React, { useState, useMemo } from 'react';
import type opentype from 'opentype.js';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface BodyTextTesterProps {
  font: opentype.Font | null;
  fontFamily: string;
  featureSettingsCss?: string;
  variationSettingsCss?: string;
}

interface ScriptConfig {
  id: string;
  name: string;
  direction?: 'ltr' | 'rtl';
  isMatch: (code: number) => boolean;
  sampleText: string;
}

const SUPPORTED_SCRIPTS: ScriptConfig[] = [
  {
    id: 'latin',
    name: 'LATIN',
    direction: 'ltr',
    isMatch: u => (u >= 0x0041 && u <= 0x024f) || (u >= 0x1e00 && u <= 0x1eff),
    sampleText:
      'Traditionally, text is composed to create a readable, coherent, and visually satisfying typeface that works invisibly, without the awareness of the reader. Even distribution of typeset material, with a minimum of distractions and anomalies, is aimed at producing clarity and transparency. Choice of typeface(s) is the primary aspect of text typography—prose fiction, non-fiction, editorial, educational, religious, scientific, and commercial writing all have differing characteristics and requirements of appropriate typefaces (and their fonts or styles). For historic material, established text typefaces frequently are chosen according to a scheme of historical genre acquired by a long process of accretion, with considerable overlap among historical periods. Contemporary books are more likely to be set with state-of-the-art "text roman" or "book romans" typefaces with serifs and design values echoing present-day design arts, which are closely based on traditional models such as those of Nicolas Jenson, Francesco Griffo (a punchcutter who created the model for Aldine typefaces), and Claude Garamond. [Source: Wikipedia, Typography]',
  },
  {
    id: 'cyrillic',
    name: 'CYRILLIC',
    direction: 'ltr',
    isMatch: u => (u >= 0x0400 && u <= 0x04ff) || (u >= 0x0500 && u <= 0x052f),
    sampleText:
      'Традиционно типографика призвана создать читаемый, целостный и визуально приятный массив текста, который работает незаметно для глаза читателя. Равномерное распределение набранного материала при минимальном количестве отвлекающих элементов направлено на достижение абсолютной ясности. Выбор гарнитуры шрифта является ключевым аспектом: художественная литература, публицистика, учебные пособия и научные издания предъявляют свои специфические требования к пропорциям знаков и плотности набора.',
  },
  {
    id: 'greek',
    name: 'GREEK',
    direction: 'ltr',
    isMatch: u => (u >= 0x0370 && u <= 0x03ff) || (u >= 0x1f00 && u <= 0x1fff),
    sampleText:
      'Παραδοσιακά, το κείμενο συντίθεται για να δημιουργήσει μια ευανάγνωστη, συνεκτική και οπτικά ικανοποιητική τυπογραφία που λειτουργεί αόρατα, χωρίς να αποσπά την προσοχή του αναγνώστη. Η ομοιόμορφη κατανομή των στοιχείων στοχεύει στην επίτευξη σαφήνειας και διαφάνειας. Η επιλογή της γραμματοσειράς αποτελεί την κύρια πτυχή της κειμενογραφίας: πεζογραφία, επιστημονικά συγγράμματα και εκπαιδευτικά εγχειρίδια απαιτούν κατάλληλη ισορροπία γραμμών και αναλογιών.',
  },
  {
    id: 'arabic',
    name: 'ARABIC',
    direction: 'rtl',
    isMatch: u =>
      (u >= 0x0600 && u <= 0x06ff) || (u >= 0x0750 && u <= 0x077f) || (u >= 0x08a0 && u <= 0x08ff),
    sampleText:
      'تقليدياً، يُصاغ النص لإنشاء خط طباعي مقروء ومتماسك ومريح بصرياً يؤدي وظيفته بسلاسة ودون لفت انتباه القارئ عن المحتوى ذاته. يهدف التوزيع المتجانس للمادة المطبوعة بأقل قدر من التشويش إلى إبراز وضوح المعنى وبلاغة التعبير. يُعد اختيار نوع الخط الركيزة الأساسية للطباعة الفنية والعملية، حيث تتطلب مختلف النصوص توازناً دقيقاً في المسافات وانسجاماً متقناً في الحروف والكلمات.',
  },
  {
    id: 'hebrew',
    name: 'HEBREW',
    direction: 'rtl',
    isMatch: u => u >= 0x0590 && u <= 0x05ff,
    sampleText:
      'באופן מסורתי, טקסט מעוצב כך שייצור טיפוגרפיה קריאה, קוהרנטית ונעימה לעין, הפועלת באופן בלתי מורגש עבור הקורא. פיזור אחיד של אותיות ומילים במינימום הסחות דעת נועד לייצר בהירות מוחלטת ושקיפות. בחירת הגופן היא ההיבט המרכزي בטיפוגרפיה של ספרים, עיתונות וכתבי עת, ומאפשרת זרימת קריאה טבעית ומרתקת.',
  },
  {
    id: 'armenian',
    name: 'ARMENIAN',
    direction: 'ltr',
    isMatch: u => u >= 0x0530 && u <= 0x058f,
    sampleText:
      'Ավանդաբար, տեքստը շարադրվում է այնպես, որ ստեղծի ընթեռնելի, համահունչ և տեսողականորեն հաճելի տպագրություն, որը գործում է աննկատ՝ չշեղելով ընթերցողին: Տառատեսակի ճիշտ ընտրությունը հանդիսանում է հիմնական գործոնը ինչպես գեղարվեստական գրականության, այնպես էլ գիտական հրատարակությունների համար:',
  },
  {
    id: 'devanagari',
    name: 'DEVANAGARI',
    direction: 'ltr',
    isMatch: u => u >= 0x0900 && u <= 0x097f,
    sampleText:
      'पारंपरिक रूप से, पाठ को इस तरह व्यवस्थित किया जाता है कि वह एक पठनीय, सुसंगत और दृष्टिगत रूप से संतुलित रूप तैयार करे जो पाठक को बिना विचलित किए सहजता से समझ में आए। अक्षरों का उचित वितरण और सही रिक्ति मुद्रण की स्पष्टता को बढ़ाती है। किसी भी पुस्तक या समाचार पत्र के लिए फ़ॉन्ट का चयन उसके पठन अनुभव को निर्धारित करता है।',
  },
  {
    id: 'georgian',
    name: 'GEORGIAN',
    direction: 'ltr',
    isMatch: u => (u >= 0x10a0 && u <= 0x10ff) || (u >= 0x1c90 && u <= 0x1cbf),
    sampleText:
      'ტრადიციულად, ტექსტი ისე იკინძება, რომ შეიქმნას იოლად წასაკითხი, შეკრული და ვიზუალურად სასიამოვნო ტიპოგრაფიული წყობა, რომელიც შეუმჩნევლად ემსახურება მკითხველს. შრიფტის ზუსტი შერჩევა გადამწყვეტია ნებისმიერი წიგნისა თუ პერიოდული გამოცემისთვის.',
  },
  {
    id: 'thai',
    name: 'THAI',
    direction: 'ltr',
    isMatch: u => u >= 0x0e00 && u <= 0x0e7f,
    sampleText:
      'โดยธรรมเนียมดั้งเดิมแล้ว ตัวอักษรและข้อความถูกจัดวางขึ้นเพื่อสร้างความต่อเนื่อง ความสามารถในการอ่านที่ลื่นไหล และความสวยงามสบายตา การจัดสัดส่วนและระยะห่างระหว่างวรรคตอนช่วยให้อ่านง่ายและชัดเจนสำหรับสื่อสิ่งพิมพ์ทุกประเภท',
  },
];

// Blind Text Generator Presets (Inspired by blindtextgenerator.com)
interface DummyPreset {
  id: string;
  name: string;
  text: string;
}

const BLIND_TEXT_PRESETS: DummyPreset[] = [
  {
    id: 'typography',
    name: 'Typography (FontDrop)',
    text: 'Traditionally, text is composed to create a readable, coherent, and visually satisfying typeface that works invisibly, without the awareness of the reader. Even distribution of typeset material, with a minimum of distractions and anomalies, is aimed at producing clarity and transparency. Choice of typeface(s) is the primary aspect of text typography—prose fiction, non-fiction, editorial, educational, religious, scientific, and commercial writing all have differing characteristics and requirements of appropriate typefaces (and their fonts or styles). For historic material, established text typefaces frequently are chosen according to a scheme of historical genre acquired by a long process of accretion, with considerable overlap among historical periods. Contemporary books are more likely to be set with state-of-the-art "text roman" or "book romans" typefaces with serifs and design values echoing present-day design arts, which are closely based on traditional models such as those of Nicolas Jenson, Francesco Griffo (a punchcutter who created the model for Aldine typefaces), and Claude Garamond. [Source: Wikipedia, Typography]',
  },
  {
    id: 'lorem_ipsum',
    name: 'Lorem Ipsum',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 'cicero',
    name: 'Cicero (De finibus)',
    text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
  },
  {
    id: 'kafka',
    name: 'Kafka (The Metamorphosis)',
    text: "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. 'What's happened to me?' he thought. It wasn't a dream.",
  },
  {
    id: 'werther',
    name: 'Werther (Goethe)',
    text: 'A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart. I am alone, and feel the charm of existence in this spot, which was created for the bliss of souls like mine. I am so happy, my dear friend, so absorbed in the exquisite sense of mere tranquil existence, that I neglect my talents. I should be incapable of drawing a single stroke at the present moment; and yet I feel that I never was a greater artist than now.',
  },
  {
    id: 'pangrams',
    name: 'Multi-Sentence Pangrams',
    text: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow. Two driven jocks help fax my big quiz. The five boxing wizards jump quickly. Waltz, bad nymph, for quick jigs vex! Jackdaws love my big sphinx of quartz. Bright vixens jump; dozy fowl quack. Quick zephyrs blow, vexing daft Jim.',
  },
  {
    id: 'alice',
    name: 'English Literature (Carroll)',
    text: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?' So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies.",
  },
];

export const BodyTextTester: React.FC<BodyTextTesterProps> = ({
  font,
  fontFamily,
  featureSettingsCss = '"normal"',
  variationSettingsCss = '"normal"',
}) => {
  // 1. Detect which scripts the font ACTUALLY supports (Strict zero false-positives)
  const availableScripts = useMemo(() => {
    if (!font || !font.glyphs) {
      return [SUPPORTED_SCRIPTS[0]];
    }

    const unicodes = new Set<number>();
    const len = font.glyphs.length;
    for (let i = 0; i < len; i++) {
      const g = font.glyphs.get(i);
      if (g.unicode) unicodes.add(g.unicode);
      if (g.unicodes && Array.isArray(g.unicodes)) {
        g.unicodes.forEach(u => unicodes.add(u));
      }
    }

    // Filter scripts where font has at least 8 characters
    const matched = SUPPORTED_SCRIPTS.filter(script => {
      let count = 0;
      for (const u of unicodes) {
        if (script.isMatch(u)) {
          count++;
          if (count >= 8) return true;
        }
      }
      return false;
    });

    return matched.length > 0 ? matched : [SUPPORTED_SCRIPTS[0]];
  }, [font]);

  // Selected script
  const [activeScriptId, setActiveScriptId] = useState<string>('latin');

  // Verify active script is supported, otherwise fallback to first available
  const activeScript = useMemo(() => {
    const found = availableScripts.find(s => s.id === activeScriptId);
    return found || availableScripts[0];
  }, [availableScripts, activeScriptId]);

  // Blind Text Generator State
  const [activePresetId, setActivePresetId] = useState<string>('typography');
  const [paragraphCount, setParagraphCount] = useState<number>(1);
  const [lineHeight, setLineHeight] = useState<number>(1.5);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [customText, setCustomText] = useState<string | null>(null);

  // Generate current text body
  const currentBodyText = useMemo(() => {
    if (customText !== null) return customText;

    // If script is not Latin, use the authentic script sample text
    if (activeScript.id !== 'latin') {
      const base = activeScript.sampleText;
      return Array(paragraphCount).fill(base).join('\n\n');
    }

    // If Latin, use the selected blind text generator preset
    const preset = BLIND_TEXT_PRESETS.find(p => p.id === activePresetId) || BLIND_TEXT_PRESETS[0];
    return Array(paragraphCount).fill(preset.text).join('\n\n');
  }, [customText, activeScript, activePresetId, paragraphCount]);

  const handleSelectScript = (id: string) => {
    setActiveScriptId(id);
    setCustomText(null); // Reset custom text when switching script
  };

  const handleSelectPreset = (id: string) => {
    setActivePresetId(id);
    setCustomText(null);
  };

  const handleReset = () => {
    setCustomText(null);
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR CONTROLS */}
      <div className="p-4 rounded-2xl lab-card border-zinc-800 space-y-3.5 text-xs font-mono">
        {/* Row 1: Smart Script Selector (Only appears if the font actually supports that script) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">
              Detected Scripts ({availableScripts.length}):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableScripts.map(script => {
                const isActive = script.id === activeScript.id;
                return (
                  <button
                    key={script.id}
                    onClick={() => handleSelectScript(script.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-black shadow-xs'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {script.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-zinc-500">
            {activeScript.direction === 'rtl' ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
          </div>
        </div>

        {/* Row 2: Blind Text Generator Options (Only active for Latin, or shows script text) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {activeScript.id === 'latin' ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-500 flex items-center gap-1">
                <FileText size={13} />
                <span>Preset:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {BLIND_TEXT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                      activePresetId === preset.id && customText === null
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                        : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Authentic {activeScript.name} sample text loaded from font repertoire</span>
            </div>
          )}

          {/* Reset custom text button */}
          {customText !== null && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800/80 text-amber-300 text-[11px] flex items-center gap-1.5 hover:bg-amber-900 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset to Generator Preset</span>
            </button>
          )}
        </div>

        {/* Row 3: Typography Layout Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/40">
          <div className="flex flex-wrap items-center gap-4">
            {/* Paragraph Count */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Paragraphs:</span>
              {[1, 2, 3].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => {
                    setParagraphCount(cnt);
                    setCustomText(null);
                  }}
                  className={`px-2 py-0.5 rounded text-xs ${
                    paragraphCount === cnt
                      ? 'bg-zinc-700 text-white font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            {/* Line Height (Leading) */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Leading:</span>
              <input
                type="range"
                min="1.0"
                max="2.2"
                step="0.05"
                value={lineHeight}
                onChange={e => setLineHeight(Number(e.target.value))}
                className="w-20 accent-cyan-400"
              />
              <span className="text-zinc-200 min-w-[28px]">{lineHeight.toFixed(2)}</span>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 ml-auto">
            {(['left', 'center', 'right', 'justify'] as const).map(a => (
              <button
                key={a}
                onClick={() => setTextAlign(a)}
                className={`p-1 rounded ${
                  textAlign === a ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-400 hover:text-white'
                }`}
                title={`Align ${a}`}
              >
                {a === 'left' && <AlignLeft size={14} />}
                {a === 'center' && <AlignCenter size={14} />}
                {a === 'right' && <AlignRight size={14} />}
                {a === 'justify' && <AlignJustify size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CASCADING BODY TEXT WATERFALL (FontDrop Style) */}
      <div className="space-y-6" dir={activeScript.direction || 'ltr'}>
        {/* 1. Large Lead / Editorial Paragraph (22px / 16.5pt) */}
        <div className="p-6 rounded-2xl lab-card border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-2 border-b border-zinc-800/40 select-none">
            <span className="font-bold text-cyan-400">22px · 16.5pt (Lead / Introductory)</span>
            <span className="text-[11px] text-zinc-500">Editable Paragraph</span>
          </div>
          <div
            contentEditable
            suppressContentEditableWarning
            onInput={e => setCustomText(e.currentTarget.innerText)}
            style={{
              fontFamily: `'${fontFamily}', sans-serif`,
              fontSize: '22px',
              lineHeight,
              textAlign,
              fontFeatureSettings: featureSettingsCss,
              fontVariationSettings: variationSettingsCss,
            }}
            className="text-zinc-100 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
          >
            {currentBodyText}
          </div>
        </div>

        {/* 2. Multi-Column Cascading Body Sizes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column A: Editorial & Standard Book Sizes */}
          <div className="space-y-6">
            {/* 16px / 12pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-cyan-400">16px · 12pt (Standard Body Reading)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '16px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-100 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>

            {/* 13px / 9.75pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-cyan-400">13px · 9.75pt (Compact Novel / Journal)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '13px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-100 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>

            {/* 10px / 7.5pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-amber-400">10px · 7.5pt (Caption & Legal)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '10px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-200 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>

            {/* 8px / 6pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-rose-400">8px · 6pt (Micro-Typography & Raster Test)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '8px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-200 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>
          </div>

          {/* Column B: Dense Multi-Column & Footnote Sizes */}
          <div className="space-y-6">
            {/* 14px / 10.5pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-cyan-400">14px · 10.5pt (Secondary Body / Sub-Article)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '14px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-100 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>

            {/* 11px / 8.25pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-cyan-400">11px · 8.25pt (Multi-Column Newspaper)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '11px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-100 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>

            {/* 9px / 6.75pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-amber-400">9px · 6.75pt (Footnotes & Indices)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '9px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-200 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>

            {/* 7px / 5.25pt */}
            <div className="p-5 rounded-2xl lab-card border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-800/40 select-none">
                <span className="font-bold text-rose-400">7px · 5.25pt (Extreme Legibility Test)</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => setCustomText(e.currentTarget.innerText)}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: '7px',
                  lineHeight,
                  textAlign,
                  fontFeatureSettings: featureSettingsCss,
                  fontVariationSettings: variationSettingsCss,
                }}
                className="text-zinc-200 outline-none whitespace-pre-wrap leading-relaxed cursor-text"
              >
                {currentBodyText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
