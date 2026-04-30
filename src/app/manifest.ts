import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Presenda',
    short_name: 'Presenda',
    description: 'Aplikasi Presensi Cerdas',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1b5e20',
    icons: [
      {
        src: '/logo_presenda.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo_presenda.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
