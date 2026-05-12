'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({ orgs:0, usuarios:0, empresas:0, lancamentos:0 })
  const [orgs,    setOrgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || 'http://localhost:3000'

  useEffect(() => {
    const load = async () => {
      const [
        { count: orgsCount },
        { count: usersCount },
        { count: empCount },
        { count: lanCount },
        { data: orgList },
      ] = await Promise.all([
        supabase.from('organizations').select('*',{count:'exact',head:true}),
        supabase.from('profiles').select('*',{count:'exact',head:true}),
        supabase.from('empresas').select('*',{count:'exact',head:true}),
        supabase.from('lancamentos').select('*',{count:'exact',head:true}),
        supabase.from('organizations').select(`*, profiles(count), empresas(count), lancamentos(count)`).order('created_at',{ascending:false}),
      ])
      setMetrics({ orgs: orgsCount||0, usuarios: usersCount||0, empresas: empCount||0, lancamentos: lanCount||0 })
      setOrgs(orgList || [])
      setLoading(false)
    }
    load()
  }, [])

  const statusColor = s => s==='Ativo'?'#22c55e':s==='Trial'?'#f59e0b':'#ef4444'
  const planoColor  = p => p==='Enterprise'?'#8b5cf6':p==='Pro'?'#3b82f6':'#64748b'

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24,fontWeight:800,color:'var(--text1)',margin:0 }}>Dashboard Global</h1>
        <p style={{ color:'var(--text2)',fontSize:13,marginTop:4 }}>Visão consolidada de todos os clientes</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28 }}>
        {[
          { label:'Organizações',  val:metrics.orgs,        color:'#3b82f6', icon:'🏢' },
          { label:'Usuários',      val:metrics.usuarios,    color:'#22c55e', icon:'👥' },
          { label:'Empresas',      val:metrics.empresas,    color:'#8b5cf6', icon:'🏭' },
          { label:'Lançamentos',   val:metrics.lancamentos, color:'#f59e0b', icon:'📊' },
        ].map(k=>(
          <div key={k.label} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px',borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:24,marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize:28,fontWeight:900,color:k.color }}>{loading?'…':k.val.toLocaleString('pt-BR')}</div>
            <div style={{ fontSize:12,color:'var(--text2)',marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de clientes */}
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text1)',margin:0 }}>Clientes Ativos</h2>
          <Link href="/dashboard/organizations/new" style={{ background:'#3b82f6',color:'#fff',borderRadius:8,padding:'7px 16px',fontSize:13,fontWeight:700,textDecoration:'none' }}>+ Nova Organização</Link>
        </div>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['Organização','Plano','Status','Empresas','Lançamentos','Criado em','Ações'].map(h=>(
                <th key={h} style={{ padding:'9px 16px',textAlign:'left',color:'var(--text4)',fontSize:11,fontWeight:700,textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:30,textAlign:'center',color:'var(--text4)' }}>Carregando...</td></tr>
            ) : orgs.map((o,i) => (
              <tr key={o.id} style={{ borderBottom:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                <td style={{ padding:'11px 16px',fontWeight:600,color:'var(--text1)' }}>{o.nome}</td>
                <td style={{ padding:'11px 16px' }}>
                  <span style={{ background:`${planoColor(o.plano)}20`,color:planoColor(o.plano),border:`1px solid ${planoColor(o.plano)}40`,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700 }}>{o.plano}</span>
                </td>
                <td style={{ padding:'11px 16px' }}>
                  <span style={{ background:`${statusColor(o.status)}20`,color:statusColor(o.status),border:`1px solid ${statusColor(o.status)}40`,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700 }}>{o.status}</span>
                </td>
                <td style={{ padding:'11px 16px',color:'var(--text2)' }}>{o.empresas?.[0]?.count ?? 0}</td>
                <td style={{ padding:'11px 16px',color:'var(--text2)' }}>{(o.lancamentos?.[0]?.count ?? 0).toLocaleString('pt-BR')}</td>
                <td style={{ padding:'11px 16px',color:'var(--text4)',fontSize:12 }}>{fmtDate(o.created_at)}</td>
                <td style={{ padding:'11px 16px' }}>
                  <div style={{ display:'flex',gap:6 }}>
                    <Link href={`/dashboard/organizations/${o.id}`} style={{ background:'rgba(59,130,246,0.1)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.2)',padding:'4px 10px',borderRadius:6,fontSize:12,fontWeight:600,textDecoration:'none' }}>
                      Gerenciar
                    </Link>
                    <a href={`${CLIENT_URL}?org=${o.id}`} target="_blank" rel="noreferrer"
                      style={{ background:'rgba(139,92,246,0.1)',color:'#a78bfa',border:'1px solid rgba(139,92,246,0.2)',padding:'4px 10px',borderRadius:6,fontSize:12,fontWeight:600,textDecoration:'none' }}>
                      👁 Ver Portal
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
