import Link from 'next/link';
import type { Metadata } from 'next';
import { HardDrive, Captions, ShieldCheck, BadgeCheck, Music, Smartphone, Upload, Scissors, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ownframe · Edita tus vídeos sin entregarlos',
  description: 'Editor de vídeo en tu navegador. Tus vídeos no se suben a ningún sitio. Subtítulos automáticos sin límite y exportación sin marca de agua.',
  openGraph: { title: 'Ownframe', description: 'Edita tus vídeos sin entregarlos.', images: [{ url: '/landing/editor.png', width: 1440, height: 900 }] },
};

const cta = 'inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 text-lg font-bold text-on-accent hover:brightness-110';

function Feature({ Icon, title, children }: { Icon: typeof HardDrive; title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-surface p-5"><Icon size={22} className="mb-3 text-accent" aria-hidden /><h3 className="mb-1 text-lg font-semibold">{title}</h3><p className="text-text-muted">{children}</p></div>;
}

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/icon.svg" alt="" width={28} height={28} />ownframe</Link>
        <nav aria-label="Principal" className="flex items-center gap-5 text-sm font-semibold text-text-muted">
          <a href="#como" className="hover:text-text max-sm:hidden">Cómo funciona</a><a href="#precios" className="hover:text-text max-sm:hidden">Precios</a>
          <Link href="/app" className="rounded-full bg-accent px-4 py-2 text-on-accent hover:brightness-110">Abrir el editor</Link>
        </nav>
      </header>
      <main>
        <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-10 text-center">
          <h1 className="mx-auto max-w-[18ch] text-[clamp(36px,6vw,64px)] font-extrabold leading-[1.05] tracking-tight">Edita tus vídeos <span className="text-accent">sin entregarlos.</span></h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-lg text-text-muted">Ownframe es un editor de vídeo que funciona en tu navegador. Tus vídeos no se suben a ningún sitio y no te pedimos ninguna licencia sobre ellos.</p>
          <div className="mt-8"><Link href="/app" className={cta}>Abrir el editor</Link><p className="mt-3 text-sm text-text-subtle">Gratis. Sin cuenta. Sin marca de agua.</p></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/editor.png" alt="El editor de Ownframe con un vídeo vertical, un título, subtítulos y una pista de música en la línea de tiempo" width={1440} height={900} className="mx-auto mt-12 w-full max-w-[1000px] rounded-lg border border-border shadow-pop" />
        </section>

        <section aria-labelledby="problema" className="border-t border-border py-16">
          <div className="mx-auto max-w-[1120px] px-4">
            <h2 id="problema" className="mb-6 text-3xl font-extrabold">¿Por qué otro editor?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <p className="rounded-lg border border-border bg-surface p-5 text-lg">Muchos editores guardan tus vídeos en sus servidores, y sus condiciones les dan derechos amplios sobre lo que subes.</p>
              <p className="rounded-lg border border-border bg-surface p-5 text-lg">Y lo que hoy es gratis, mañana es de pago: subtítulos, efectos, la exportación sin marca de agua.</p>
            </div>
          </div>
        </section>

        <section id="como" aria-labelledby="como-t" className="border-t border-border py-16">
          <div className="mx-auto max-w-[1120px] px-4">
            <h2 id="como-t" className="mb-6 text-3xl font-extrabold">Cómo funciona</h2>
            <ol className="grid gap-4 md:grid-cols-3">
              <li className="rounded-lg border border-border bg-surface p-5"><Upload className="mb-3 text-accent" aria-hidden /><h3 className="text-lg font-semibold">1. Importa</h3><p className="text-text-muted">Tus clips se copian al almacenamiento privado de tu navegador. No salen de tu dispositivo.</p></li>
              <li className="rounded-lg border border-border bg-surface p-5"><Scissors className="mb-3 text-accent" aria-hidden /><h3 className="text-lg font-semibold">2. Edita</h3><p className="text-text-muted">Corta, ordena, añade texto, subtítulos y música. En el móvil o en el ordenador.</p></li>
              <li className="rounded-lg border border-border bg-surface p-5"><Download className="mb-3 text-accent" aria-hidden /><h3 className="text-lg font-semibold">3. Exporta</h3><p className="text-text-muted">Un MP4 listo para TikTok, Reels o Shorts. Se genera en tu dispositivo, sin colas.</p></li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="feat" className="border-t border-border py-16">
          <div className="mx-auto max-w-[1120px] px-4">
            <h2 id="feat" className="mb-6 text-3xl font-extrabold">Lo que no cambia</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Feature Icon={HardDrive} title="Tus vídeos no salen de tu dispositivo">Ni para editar, ni para exportar, ni para los subtítulos. No los vemos porque no los tenemos.</Feature>
              <Feature Icon={Captions} title="Subtítulos automáticos sin límite">Se generan en tu dispositivo. Como no nos cuestan nada, no te ponemos un tope al mes.</Feature>
              <Feature Icon={ShieldCheck} title="Lo gratis sigue gratis">Por escrito: si cambiamos algo del plan gratuito, lo anunciamos con 60 días y no afecta a tus proyectos.</Feature>
              <Feature Icon={BadgeCheck} title="Sin marca de agua, nunca">En ningún plan. Lo que exportas es tuyo, tal cual.</Feature>
              <Feature Icon={Music} title="Música con licencia clara">Canciones de Clipsong con su licencia a la vista y el crédito listo para tu descripción.</Feature>
              <Feature Icon={Smartphone} title="En el móvil y en el ordenador">Funciona en el navegador, sin instalar nada.</Feature>
            </div>
          </div>
        </section>

        <section id="precios" aria-labelledby="precios-t" className="border-t border-border py-16">
          <div className="mx-auto max-w-[1120px] px-4">
            <h2 id="precios-t" className="mb-6 text-3xl font-extrabold">Precios</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border-2 border-accent bg-surface p-6"><h3 className="text-xl font-bold">Gratis</h3><p className="my-2 text-4xl font-extrabold">0 €</p><p className="mb-4 text-text-muted">Para siempre</p>
                <ul className="space-y-1.5 text-text-muted"><li>Proyectos ilimitados</li><li>Exportación 1080p sin marca de agua</li><li>Subtítulos automáticos sin límite</li><li>Texto, música, .srt</li></ul>
                <Link href="/app" className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-accent font-bold text-on-accent">Abrir el editor</Link></div>
              <div className="rounded-lg border border-border bg-surface p-6"><h3 className="text-xl font-bold">Pro</h3><p className="my-2 text-4xl font-extrabold">4 € <span className="text-base font-semibold text-text-muted">/mes</span></p><p className="mb-4 text-text-muted">o 40 € al año · próximamente</p>
                <ul className="space-y-1.5 text-text-muted"><li>Todo lo de Gratis</li><li>Exportación 4K y 60 fps</li><li>Copia en la nube de tus ediciones (nunca de tus vídeos)</li><li>Kit de marca</li></ul></div>
              <div className="rounded-lg border border-border bg-surface p-6"><h3 className="text-xl font-bold">Creador+</h3><p className="my-2 text-4xl font-extrabold">8 € <span className="text-base font-semibold text-text-muted">/mes</span></p><p className="mb-4 text-text-muted">o 80 € al año · próximamente</p>
                <ul className="space-y-1.5 text-text-muted"><li>Ownframe Pro</li><li>Clipsong Creador: descargas y recibos de licencia</li></ul></div>
            </div>
            <p className="mt-4 text-sm text-text-subtle">Precio fijo, sin cobro por persona. Cancelas en dos clics. Te avisamos 7 días antes de cada renovación anual.</p>
          </div>
        </section>

        <section aria-labelledby="faq" className="border-t border-border py-16">
          <div className="mx-auto max-w-[760px] px-4">
            <h2 id="faq" className="mb-6 text-3xl font-extrabold">Preguntas</h2>
            {[
              ['¿De verdad no subís mis vídeos?', 'No. Los archivos se guardan en el almacenamiento privado de tu navegador y la exportación se hace en tu dispositivo. Nuestro servidor no recibe tus vídeos.'],
              ['¿Qué pasa si borro los datos del navegador?', 'Se borran también tus proyectos y sus vídeos, porque solo están ahí. Exporta lo que quieras conservar.'],
              ['¿Funciona en iPhone?', 'Está pensado para Chrome, Edge y Safari recientes. Aún lo estamos probando en iPhone: si algo falla, cuéntanoslo.'],
              ['¿Los subtítulos necesitan internet?', 'Solo la primera vez, para descargar el modelo de voz (unos 200 MB). Después se generan en tu dispositivo.'],
              ['¿Puedo usar mis vídeos donde quiera?', 'Sí. Son tuyos. No pedimos ninguna licencia sobre lo que editas o exportas.'],
              ['¿Puedo abrir proyectos de otros editores?', 'No. Puedes importar tus clips, audio e imágenes y montarlos de nuevo.'],
            ].map(([q, a]) => (
              <details key={q} className="mb-3 rounded-lg border border-border bg-surface px-5 py-4"><summary className="cursor-pointer text-lg font-semibold">{q}</summary><p className="mt-2 text-text-muted">{a}</p></details>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-20 text-center">
          <h2 className="mb-6 text-3xl font-extrabold">Abre el editor y monta tu primer vídeo.</h2>
          <Link href="/app" className={cta}>Abrir el editor</Link>
        </section>
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-text-subtle">© 2026 Ownframe · <a href="#faq" className="hover:text-text">Preguntas</a></footer>
    </div>
  );
}
