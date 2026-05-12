'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const NAV = [
  { href:'/dashboard',                   label:'📊 Dashboard',      exact:true  },
  { href:'/dashboard/organizations',     label:'🏢 Organizações',   exact:false },
  { href:'/dashboard/users',             label:'👥 Usuários',        exact:false },
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

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)',color:'var(--text2)' }}>Verificando permissões...</div>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width:240, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'fixed', height:'100vh', zIndex:50 }}>
        <div style={{ padding:'24px 20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36,height:36,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff' }}>⚡</div>
            <div>
              <div style={{ fontSize:14,fontWeight:800,color:'var(--text1)' }}>Admin Portal</div>
              <div style={{ fontSize:11,color:'#3b82f6' }}>Super Admin</div>
            </div>
          </div>
        </div>
        <nav style={{ padding:'12px 8px', flex:1 }}>
          {NAV.map(n => {
            const active = n.exact ? path === n.href : path.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href} style={{ display:'block', padding:'9px 12px', borderRadius:8, marginBottom:2, fontSize:13, fontWeight: active?700:400, background: active?'rgba(59,130,246,0.15)':'transparent', color: active?'#60a5fa':'var(--text2)', textDecoration:'none', transition:'all 0.15s' }}>
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding:'16px 12px', borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:11, color:'var(--text4)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.email}</div>
          <button onClick={logout} style={{ width:'100%', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#fca5a5', padding:'8px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            Sair
          </button>
        </div>
      </aside>
      {/* Main */}
      <main style={{ marginLeft:240, flex:1, padding:32, minHeight:'100vh' }}>
        {children}
      </main>
    </div>
  )
}
