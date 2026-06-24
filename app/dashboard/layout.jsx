'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Ícones SVG inline (mesmo padrão do portal cliente)
const ICONS = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  orgs: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}

function Icon({ path, size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

const NAV = [
  { href: '/dashboard',               label: 'Dashboard',    icon: 'dashboard', exact: true  },
  { href: '/dashboard/organizations', label: 'Organizações', icon: 'orgs',      exact: false },
  { href: '/dashboard/users',         label: 'Usuários',     icon: 'users',     exact: false },
]

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const path = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role,email').eq('id', session.user.id).single()
      if (p?.role !== 'super_admin') { router.replace('/login'); return }
      setAdmin({ email: p.email || session.user.email, role: p.role })
      setLoading(false)
    })
  }, [router])

  const logout = async () => { await supabase.auth.signOut(); router.replace('/login') }

  const initials = admin?.email ? admin.email.substring(0, 2).toUpperCase() : 'AD'
  const username = admin?.email ? admin.email.split('@')[0] : 'Admin'

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)',color:'var(--text2)' }}>Verificando permissões...</div>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      <style>{`
        .adm-nav-item { transition: all 0.15s; }
        .adm-nav-item:hover { background: rgba(59,130,246,0.08) !important; }
        .adm-logout:hover { background: rgba(239,68,68,0.18) !important; border-color: rgba(239,68,68,0.4) !important; }
      `}</style>

      {/* ── Sidebar: altura fixa, footer sempre visível ── */}
      <aside style={{
        width: 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 50,
      }}>
        {/* Logo + selo Admin (identificação clara do portal) */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <img src="/logo-fs.png" alt="Facesign" style={{ height: 34, maxWidth: 130, objectFit: 'contain' }} />
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#f59e0b',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              padding: '3px 9px', borderRadius: 6, letterSpacing: '1px', textTransform: 'uppercase',
            }}>Admin</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 10, letterSpacing: '0.3px' }}>
            Portal Administrativo
          </div>
        </div>

        {/* Navegação (rola internamente se necessário) */}
        <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          {NAV.map(n => {
            const active = n.exact ? path === n.href : path.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href} className="adm-nav-item" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 13, fontWeight: active ? 700 : 400,
                background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: active ? '#60a5fa' : 'var(--text2)',
                borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
                textDecoration: 'none',
              }}>
                <Icon path={ICONS[n.icon]} size={15} color={active ? '#60a5fa' : 'var(--text2)'} />
                {n.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer fixo: usuário + sair inline (mesmo padrão do portal cliente) */}
        <div style={{ padding: 10, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--surface2)', borderRadius: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#fff', fontWeight: 800, flexShrink: 0,
            }}>{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text1)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</div>
              <div style={{ fontSize: 10, color: 'var(--text4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.email}</div>
            </div>
            <button onClick={logout} className="adm-logout" title="Sair do sistema" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, flexShrink: 0,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, color: '#fca5a5', cursor: 'pointer',
            }}>
              <Icon path={ICONS.logout} size={14} color="currentColor" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minHeight: '100vh', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Barra de identificação — deixa inequívoco que é o Portal Admin */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 32px',
          background: 'linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)',
          borderBottom: '1px solid rgba(245,158,11,0.25)',
          flexShrink: 0,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>
            PORTAL ADMINISTRATIVO
          </span>
          <span style={{ fontSize: 12, color: 'var(--text4)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>
            Você está gerenciando toda a plataforma Facesign
          </span>
        </div>
        <div style={{ padding: 32, flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
