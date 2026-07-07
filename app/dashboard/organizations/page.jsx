'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Organizations() {
  const [orgs, setOrgs]       = useState([])
  const [busca, setBusca]     = useState('')
  const [loading,setLoading]  = useState(true)
  const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || 'http://localhost:3000'

  const load = async () => {
    setLoading(true)
    try {
      // Via service role (server-side): o super admin enxerga TODAS as
      // organizações e suas empresas/usuários, sem o recorte do RLS
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/admin/organizations', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      const j = await r.json()
      setOrgs(j.orgs || [])
    } catch { setOrgs([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtradas = orgs.filter(o => o.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:800,color:'var(--text1)',margin:0 }}>Organizações</h1>
        <Link href="/dashboard/organizations/new" style={{ background:'#3b82f6',color:'#fff',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:700,textDecoration:'none' }}>+ Nova Organização</Link>
      </div>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar organização..."
        style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 14px',fontSize:13,outline:'none',marginBottom:16 }}/>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {loading ? <div style={{ textAlign:'center',padding:40,color:'var(--text4)' }}>Carregando...</div>
        : filtradas.map(o => (
          <div key={o.id} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,color:'var(--text1)',fontSize:15 }}>{o.nome}</div>
              <div style={{ fontSize:12,color:'var(--text4)',marginTop:3 }}>
                {o.empresas?.length || 0} empresa(s) • {o.profiles?.length || 0} usuário(s) • Plano: {o.plano}
              </div>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <Link href={`/dashboard/organizations/${o.id}`}
                style={{ background:'rgba(59,130,246,0.1)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.2)',padding:'6px 14px',borderRadius:7,fontSize:12,fontWeight:600,textDecoration:'none' }}>
                Gerenciar
              </Link>
              <a href={`${CLIENT_URL}?org=${o.id}`} target="_blank" rel="noreferrer"
                style={{ background:'rgba(139,92,246,0.1)',color:'#a78bfa',border:'1px solid rgba(139,92,246,0.2)',padding:'6px 14px',borderRadius:7,fontSize:12,fontWeight:600,textDecoration:'none' }}>
                👁 Ver Portal
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
