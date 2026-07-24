import '@fontsource-variable/manrope'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'
export const metadata = {
  title: 'Admin Portal — Facesign',
  description: 'Portal administrativo da plataforma Facesign',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin:0, fontFamily:'var(--font-body)', background:'var(--bg)', color:'var(--text1)' }}>
        {children}
      </body>
    </html>
  )
}
