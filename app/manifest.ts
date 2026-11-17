import type { MetadataRoute } from 'next';
// Colours: the bg / accent token values (the manifest cannot read CSS variables).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ownframe · Editor de vídeo', short_name: 'Ownframe', lang: 'es',
    description: 'Edita tus vídeos sin entregarlos. Funciona sin conexión.',
    start_url: '/app?source=pwa', scope: '/', display: 'standalone', background_color: '#0b0b0e', theme_color: '#0b0b0e',
    categories: ['photo', 'video', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
