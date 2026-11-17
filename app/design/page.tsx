'use client';
import { useState } from 'react';
import { Scissors, Undo2, Redo2, Trash2, Magnet, ZoomIn } from 'lucide-react';
import { Button, IconButton, Kbd } from '@/components/ui/Button';
import { NumberField } from '@/components/ui/NumberField';
import { Rail, type RailTab } from '@/components/ui/Rail';
import { Dropzone } from '@/components/ui/Dropzone';
import { MediaTile } from '@/components/ui/MediaTile';
import { ClipBlock } from '@/components/ui/ClipBlock';
import { Transport } from '@/components/ui/Transport';

const wave = Array.from({ length: 120 }, (_, i) => Math.abs(Math.sin(i / 5) * Math.sin(i / 17)) * 0.9 + 0.05);
const thumbs = ['#3a4a6b', '#4a5b7c', '#5a6b8c', '#3a4a6b', '#4a5b7c'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section aria-labelledby={title} className="rounded-lg border border-border bg-surface p-5"><h2 id={title} className="mb-4 text-lg font-semibold">{title}</h2>{children}</section>;
}

export default function DesignPage() {
  const [tab, setTab] = useState<RailTab>('media');
  const [scale, setScale] = useState(100);
  const [vol, setVol] = useState(-6);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(3200);
  const px = 60; // px per second in the demo timeline
  return (
    <main className="mx-auto max-w-[1200px] space-y-6 p-6">
      <header><h1 className="text-2xl font-extrabold">Sistema de diseño · editor</h1><p className="text-text-muted">Componentes base con sus estados. Colores desde <code className="font-mono text-sm">replica/design/tokens.json</code>.</p></header>

      <Section title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Exportar</Button><Button>Secundario</Button><Button variant="ghost">Fantasma</Button><Button variant="danger">Borrar</Button>
          <Button variant="primary" loading>Exportando</Button><Button disabled>Desactivado</Button><Button size="sm">Pequeño</Button><Button size="lg" variant="primary">Grande</Button>
        </div>
        <div className="mt-4 flex items-center gap-1">
          <IconButton label="Deshacer (Ctrl+Z)"><Undo2 size={16} /></IconButton><IconButton label="Rehacer (Ctrl+Shift+Z)"><Redo2 size={16} /></IconButton>
          <IconButton label="Cortar en el cabezal (S)"><Scissors size={16} /></IconButton><IconButton label="Borrar (Supr)"><Trash2 size={16} /></IconButton>
          <IconButton label="Imán activado" active><Magnet size={16} /></IconButton><IconButton label="Acercar" disabled><ZoomIn size={16} /></IconButton>
          <span className="ml-4 flex items-center gap-1 text-sm text-text-muted"><Kbd>S</Kbd> cortar · <Kbd>Espacio</Kbd> reproducir · <Kbd>Ctrl</Kbd>+<Kbd>Z</Kbd> deshacer</span>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Section title="Raíl y panel">
          <div className="flex h-[360px] overflow-hidden rounded-md border border-border">
            <Rail active={tab} onChange={setTab} />
            <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`rail-${tab}`} className="w-[300px] overflow-y-auto bg-surface p-3">
              <h3 className="mb-3 font-semibold">{{ media: 'Medios', text: 'Texto', captions: 'Subtítulos', audio: 'Audio' }[tab]}</h3>
              <Dropzone compact onFiles={() => {}} rows={[{ name: 'playa-amanecer.mp4', progress: 0.42 }, { name: 'iphone-hevc.mov', error: 'Este vídeo usa HEVC y tu navegador no puede leerlo. Prueba en Safari o graba en «Más compatible».' }]} />
              <div role="list" aria-label="Medios del proyecto" className="mt-3 grid grid-cols-2 gap-1">
                <div role="listitem"><MediaTile name="playa-amanecer.mp4" kind="video" durationMs={12400} thumb="linear-gradient(135deg,#f59f00,#e8590c)" used /></div>
                <div role="listitem"><MediaTile name="entrevista-larga-con-un-nombre-muy-largo.mp4" kind="video" durationMs={184000} thumb="linear-gradient(135deg,#1971c2,#0b7285)" selected /></div>
                <div role="listitem"><MediaTile name="musica.mp3" kind="audio" durationMs={95000} /></div>
                <div role="listitem"><MediaTile name="logo.png" kind="image" state="importing" /></div>
                <div role="listitem"><MediaTile name="roto.mp4" kind="video" state="error" reason="Archivo dañado" /></div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Inspector">
          <div className="space-y-3">
            <NumberField label="Escala" value={scale} min={10} max={400} step={1} unit="%" onChange={setScale} />
            <NumberField label="Volumen" value={vol} min={-60} max={12} step={0.5} unit="dB" onChange={setVol} />
            <NumberField label="Rotación" value={0} min={-180} max={180} step={1} unit="°" onChange={() => {}} disabled />
            <p className="rounded-md bg-surface-raised p-3 text-sm text-text-muted">Sin selección: «Selecciona algo en la línea de tiempo para ver sus ajustes».</p>
          </div>
        </Section>
      </div>

      <Section title="Línea de tiempo">
        <Transport playing={playing} timeMs={t} durationMs={14000} fps={30} onToggle={() => setPlaying(!playing)} onStep={(d) => setT(Math.max(0, t + (d * 1000) / 30))} />
        <div className="relative overflow-hidden rounded-b-md border border-t-0 border-border bg-bg" role="region" aria-label="Línea de tiempo de ejemplo">
          <div className="relative h-6 border-b border-border bg-surface" aria-hidden>
            {Array.from({ length: 15 }, (_, s) => <span key={s} className="mono absolute top-0.5 text-2xs text-text-subtle" style={{ left: 8 + s * px }}>{`0:${String(s).padStart(2, '0')}`}</span>)}
          </div>
          {([['video', 48, [<ClipBlock key="a" kind="video" label="playa-amanecer.mp4" left={8} width={4 * px} thumbs={thumbs} describe="Clip playa-amanecer.mp4, de 0:00 a 0:04" />, <ClipBlock key="b" kind="video" label="entrevista.mp4" left={8 + 4 * px} width={6 * px} thumbs={thumbs} selected describe="Clip entrevista.mp4, de 0:04 a 0:10, seleccionado" />, <ClipBlock key="c" kind="video" label="falta-el-archivo.mp4" left={8 + 10 * px} width={3 * px} error describe="Clip falta-el-archivo.mp4, archivo no encontrado" />]],
             ['text', 32, [<ClipBlock key="t" kind="text" label="«Mañana en la playa»" left={8 + px} width={3 * px} describe="Texto Mañana en la playa, de 0:01 a 0:04" />]],
             ['caption', 32, [<ClipBlock key="c1" kind="caption" label="hola a todos" left={8 + 4 * px} width={2 * px} describe="Subtítulo hola a todos" />, <ClipBlock key="c2" kind="caption" label="hoy os enseño…" left={8 + 6 * px} width={3 * px} describe="Subtítulo hoy os enseño" />]],
             ['audio', 40, [<ClipBlock key="m" kind="audio" label="musica.mp3 · CC BY" left={8} width={13 * px} wave={wave} fadeIn={30} fadeOut={40} describe="Audio musica.mp3, de 0:00 a 0:13, con fundidos" />, ]],
          ] as const).map(([kind, h, clips]) => (
            <div key={kind} role="listbox" aria-label={`Pista de ${kind}`} className="relative border-b border-border" style={{ height: h }}>{clips}</div>
          ))}
          <div className="pointer-events-none absolute inset-y-0 w-[var(--playhead-width)] bg-playhead" style={{ left: 8 + (t / 1000) * px }} aria-hidden>
            <div className="absolute -left-[5px] top-0 h-3 w-3 rotate-45 bg-playhead" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 w-px bg-snap-guide" style={{ left: 8 + 4 * px }} aria-hidden />
        </div>
      </Section>

      <Section title="Exportación">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md bg-surface-raised p-4"><p className="mb-2 font-semibold">Exportando… 63 %</p>
            <div role="progressbar" aria-label="Progreso de exportación" aria-valuenow={63} aria-valuemin={0} aria-valuemax={100} className="h-2 rounded-full bg-surface-active"><div className="h-full w-[63%] rounded-full bg-accent" /></div>
            <p className="mt-2 text-sm text-text-muted">Quedan unos 12 s · no cierres esta pestaña</p><Button size="sm" className="mt-3">Cancelar</Button></div>
          <div className="rounded-md bg-surface-raised p-4"><p className="mb-1 font-semibold text-success">Listo</p><p className="mb-3 text-sm text-text-muted">mi-video.mp4 · 1080×1920 · 18,4 MB</p><Button variant="primary" size="sm">Descargar</Button></div>
          <div className="rounded-md bg-surface-raised p-4" role="alert"><p className="mb-1 font-semibold text-danger">No se ha podido exportar</p><p className="mb-3 text-sm text-text-muted">Tu navegador se quedó sin memoria. Prueba a 720p o cierra otras pestañas.</p><Button size="sm">Reintentar</Button></div>
        </div>
      </Section>

      <Section title="Avisos">
        <div className="flex flex-wrap gap-3">
          <div role="status" className="flex items-center gap-4 rounded-md bg-text px-4 py-2 text-sm font-semibold text-bg shadow-pop">Clip borrado <button type="button" className="underline">Deshacer</button></div>
          <span className="text-sm text-warning">Sin guardar: el navegador no tiene espacio</span>
          <span className="text-sm text-success">Guardado</span>
        </div>
      </Section>
    </main>
  );
}
