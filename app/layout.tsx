import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/700.css';
import '@fontsource/figtree/900.css';
import '@fontsource/anton/400.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/bebas-neue/400.css';
import '@fontsource/permanent-marker/400.css';
export const metadata: Metadata = {
  // absolute URLs for link previews: set NEXT_PUBLIC_SITE_URL in the host (Vercel sets VERCEL_PROJECT_PRODUCTION_URL)
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3100')),
  robots: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? undefined : { index: false, follow: false },   // beta: not in search engines until launch
  title: 'Ownframe', description: 'Editor de vídeo en tu navegador. Tus vídeos no salen de tu dispositivo.', icons: { icon: '/icon.svg' } };
export const viewport: Viewport = { themeColor: '#0b0b0e', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
