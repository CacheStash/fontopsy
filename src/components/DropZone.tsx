import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileType, ShieldCheck, Cpu } from 'lucide-react';

interface DropZoneProps {
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  isLoading: boolean;
  hasFont: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileLoaded,
  isLoading,
  hasFont,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global drag-and-drop listener across entire window
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragOver(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
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

  // If a font is already loaded and user is not actively dragging over, render nothing or a mini bar
  if (hasFont && !isDragOver) {
    return (
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept=".otf,.ttf,.woff,.woff2"
        className="hidden"
      />
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept=".otf,.ttf,.woff,.woff2"
        className="hidden"
      />

      {/* Full-screen drag overlay when dragging */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-cyan-400 animate-pulse">
          <UploadCloud size={64} className="text-cyan-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold font-mono text-cyan-300">DROP FONT TO DISSECT</h2>
          <p className="text-zinc-400 font-mono text-sm mt-2">
            Release `.otf`, `.ttf`, `.woff`, or `.woff2` to parse in-memory
          </p>
        </div>
      )}

      {/* Initial Hero Dropzone if no font is loaded */}
      {!hasFont && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative max-w-3xl mx-auto my-12 p-10 rounded-2xl lab-card border-2 border-dashed border-zinc-700 hover:border-cyan-500/60 transition-all cursor-pointer group text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-cyan-500/50 flex items-center justify-center text-cyan-400 transition-transform group-hover:scale-110">
            {isLoading ? (
              <Cpu size={32} className="animate-spin text-cyan-400" />
            ) : (
              <UploadCloud size={32} />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Drop your font file here to inspect
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
            Drag & drop any font file or click to browse. Instant client-side parsing with zero server uploads.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {['.OTF', '.TTF', '.WOFF', '.WOFF2'].map(fmt => (
              <span
                key={fmt}
                className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 group-hover:border-zinc-700"
              >
                {fmt}
              </span>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              100% In-Memory Forensic Parsing
            </span>
            <span className="flex items-center gap-1.5">
              <FileType size={14} className="text-cyan-400" />
              Brotli/WOFF2 Wasm Decompression
            </span>
          </div>
        </div>
      )}
    </>
  );
};
