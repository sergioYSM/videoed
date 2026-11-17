import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'videoed', description: 'Editor de vídeo en tu navegador. Tus vídeos no salen de tu dispositivo.' };
export const viewport: Viewport = { themeColor: '#0b0b0e', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
