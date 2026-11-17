'use client';
import { Upload, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
export interface ImportRow { name: string; progress?: number; error?: string }
export function Dropzone({ onFiles, rows = [], compact }: { onFiles: (f: File[]) => void; rows?: ImportRow[]; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const pick = () => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.accept = 'video/*,audio/*,image/*'; i.onchange = () => i.files && onFiles([...i.files]); i.click(); };
  return (
    <div>
      <button type="button" onClick={pick}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...e.dataTransfer.files]); }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors ${compact ? 'py-4' : 'py-10'} ${over ? 'border-accent bg-surface-hover text-text' : 'border-border text-text-muted hover:border-border-input hover:text-text'}`}>
        <Upload size={22} aria-hidden />
        <span className="font-semibold">{over ? 'Suelta para importar' : 'Importar vídeos, audio o imágenes'}</span>
        {!compact && <span className="text-xs text-text-subtle">Arrástralos aquí o pulsa para elegir. No se suben a ningún sitio.</span>}
      </button>
      {rows.length > 0 && (
        <ul className="mt-2 space-y-1" aria-live="polite">
          {rows.map((r) => (
            <li key={r.name} className="rounded-md bg-surface-raised px-3 py-2 text-sm">
              <div className="flex items-center gap-2"><span className="flex-1 truncate">{r.name}</span>
                {r.error ? <AlertTriangle size={14} className="text-danger" aria-label="Error" /> : r.progress !== undefined && <span className="mono text-xs text-text-muted">{Math.round(r.progress * 100)} %</span>}</div>
              {r.error ? <p className="mt-1 text-xs text-danger">{r.error}</p> : r.progress !== undefined && r.progress < 1 && (
                <div role="progressbar" aria-label={`Importando ${r.name}`} aria-valuenow={Math.round(r.progress * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-1 rounded-full bg-surface-active"><div className="h-full rounded-full bg-accent" style={{ width: `${r.progress * 100}%` }} /></div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
