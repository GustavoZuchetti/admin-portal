import './globals.css'
export const metadata = { title: 'Admin Portal — Financial Dashboard' }
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin:0, fontFamily:"'Inter','Segoe UI',sans-serif", background:'#0f1117', color:'#f1f5f9' }}>
        {children}
      </body>
    </html>
  )
}
