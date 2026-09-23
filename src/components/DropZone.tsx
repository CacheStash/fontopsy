import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Cpu, ArrowUpRight } from 'lucide-react';

interface DropZoneProps {
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  isLoading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileLoaded,
  isLoading,
}) => {
  const [isWindowDragOver, setIsWindowDragOver] = useState(false);
  const [isBannerHover, setIsBannerHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global drag-and-drop listener across entire window
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragOver(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setIsWindowDragOver(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragOver(false);
      setIsBannerHover(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        onFileLoaded(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept=".otf,.ttf,.woff,.woff2"
        className="hidden"
      />

      {/* Full-Screen Drag-and-Drop Active Overlay */}
      {isWindowDragOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-cyan-400 animate-pulse pointer-events-none">
          <UploadCloud size={64} className="text-cyan-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold font-mono text-cyan-300 tracking-wider">
            RELEASE FONT TO DISSECT
          </h2>
          <p className="text-zinc-400 font-mono text-sm mt-2">
            In-memory forensic parsing for `.otf`, `.ttf`, `.woff`, `.woff2`
          </p>
        </div>
      )}

      {/* Main Content Full-Width Drag & Drop Banner */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setIsBannerHover(true);
        }}
        onDragLeave={() => setIsBannerHover(false)}
        onDrop={e => {
          e.preventDefault();
          setIsBannerHover(false);
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
          }
        }}
        className={`w-full p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 group lab-card flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-dashed ${
          isBannerHover
            ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_30px_rgba(6,182,212,0.25)] scale-[1.01]'
            : 'border-zinc-700/80 hover:border-cyan-500/60 hover:bg-zinc-900/60'
        }`}
      >
        {/* Left Side: Upload Icon & Title */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 group-hover:border-cyan-500/60 flex items-center justify-center text-cyan-400 flex-shrink-0 transition-transform group-hover:scale-105 shadow-inner">
            {isLoading ? (
              <Cpu size={24} className="animate-spin text-cyan-400" />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-mono font-bold text-sm sm:text-base text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                DRAG & DROP FONT FILE HERE
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                CLICK TO BROWSE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Instant in-memory parsing for <span className="text-zinc-200">.OTF</span>, <span className="text-zinc-200">.TTF</span>, <span className="text-zinc-200">.WOFF</span>, <span className="text-zinc-200">.WOFF2</span> with zero server uploads
            </p>
          </div>
        </div>

        {/* Right Side: Format Badges & Action Prompt */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden lg:flex items-center gap-1.5">
            {['.OTF', '.TTF', '.WOFF', '.WOFF2'].map(ext => (
              <span
                key={ext}
                className="px-2 py-1 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-400 group-hover:border-zinc-700"
              >
                {ext}
              </span>
            ))}
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-black border border-cyan-500/40 font-mono text-xs font-bold transition-all flex items-center gap-1">
            <span>CHOOSE FILE</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </>
  );
};
