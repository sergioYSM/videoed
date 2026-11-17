'use client';
import { useEditor } from '@/store/editor';
import { addText, TEXT_PRESETS } from '@/lib/project';

const labels = { titulo: ['Título', 'Grande, con contorno'], subtitulo: ['Texto', 'Limpio, para frases'], etiqueta: ['Etiqueta', 'Sobre fondo de color'] } as const;

export function TextPanel() {
  const add = (k: keyof typeof TEXT_PRESETS) => {
    const s = useEditor.getState();
    s.apply((q) => addText(q, k, s.playhead));
    const t = useEditor.getState().project!.texts.at(-1)!;
    s.select(t.id); s.notify('Texto añadido en el cabezal');
  };
  return (
    <div>
      <h2 className="mb-3 font-semibold">Texto</h2>
      <div className="space-y-2">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => {
          const st = TEXT_PRESETS[k].style;
          return (
            <button key={k} type="button" onClick={() => add(k)} className="block w-full rounded-md border border-border bg-surface-raised p-3 text-left hover:border-accent">
              <span className="block truncate" style={{ fontFamily: `"${st.font}"`, fontWeight: st.weight, fontSize: 22, color: st.color, background: st.bg ?? undefined, textShadow: st.stroke ? `0 0 3px ${st.stroke}, 0 0 1px ${st.stroke}` : undefined, padding: st.bg ? '0 6px' : undefined, display: 'inline-block' }}>{TEXT_PRESETS[k].text}</span>
              <span className="mt-1 block text-xs text-text-muted">Añadir {labels[k][0].toLowerCase()} · {labels[k][1]}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-text-subtle">Se añade en la posición del cabezal y dura 3 s. Arrástralo en el vídeo para moverlo; cambia el texto y el estilo en Ajustes.</p>
    </div>
  );
}
