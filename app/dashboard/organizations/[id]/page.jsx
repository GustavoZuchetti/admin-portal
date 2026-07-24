'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function OrgDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [org,      setOrg]      = useState(null)
  const [users,    setUsers]    = useState([])
  const [empresas, setEmpresas] = useState([])
  const [invEmail, setInvEmail] = useState('')
  const [invRole,  setInvRole]  = useState('org_admin')
  const [invLink,  setInvLink]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [loading,  setLoading]  = useState(true)
  const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || 'http://localhost:3000'

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch(`/api/admin/data?scope=org&id=${id}`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
      const j = await r.json()
      setOrg(j.org); setUsers(j.profiles||[]); setEmpresas(j.empresas||[])
    } catch { /* mantém estado */ }
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  const saveOrg = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ id, nome:org.nome, plano:org.plano, status:org.status, api_dre_liberado:!!org.api_dre_liberado, api_fluxo_liberado:!!org.api_fluxo_liberado }),
      })
      const j = await r.json()
      alert(j.ok ? 'Salvo!' : ('Erro: ' + (j.error||'desconhecido')))
    } catch (e) { alert('Erro: ' + e.message) }
    setSaving(false)
  }

  const createInvite = async () => {
    if (!invEmail.trim()) return
    const { data, error } = await supabase.from('invites').insert({ organization_id:id, email:invEmail, role:invRole }).select().single()
    if (error) { alert('Erro: '+error.message); return }
    const link = `${CLIENT_URL}/aceitar-convite?token=${data.token}`
    setInvLink(link)
    setInvEmail('')
  }

  if (loading) return <div style={{ color:'var(--text4)',padding:40 }}>Carregando...</div>
  if (!org) return <div style={{ color:'var(--danger)',padding:40 }}>Organização não encontrada.</div>

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:28 }}>
        <Link href="/dashboard/organizations" style={{ color:'var(--text4)',fontSize:13,textDecoration:'none' }}>← Organizações</Link>
        <span style={{ color:'var(--text4)' }}>/</span>
        <h1 style={{ fontSize:20,fontWeight:800,color:'var(--text1)',margin:0 }}>{org.nome}</h1>
        <a href={`${CLIENT_URL}?org=${id}`} target="_blank" rel="noreferrer"
          style={{ marginLeft:'auto',background:'rgba(139,92,246,0.1)',color:'var(--purple)',border:'1px solid rgba(139,92,246,0.2)',padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none' }}>
          Ver como cliente
        </a>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
        {/* Dados da Org */}
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'20px 24px' }}>
          <h2 style={{ fontSize:14,fontWeight:700,color:'var(--text1)',marginBottom:16 }}>Dados da Organização</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {/* ── Liberação de Importação via API (por módulo) ── */}
            <div style={{ gridColumn:'1 / -1', background:'var(--surface2)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px 16px', marginBottom:4 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
                Importação via API (Bling)
              </div>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                {[['api_dre_liberado','Liberar módulo DRE'],['api_fluxo_liberado','Liberar módulo Fluxo de Caixa']].map(([campo,rotulo])=>(
                  <label key={campo} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text1)', cursor:'pointer' }}>
                    <input type="checkbox" checked={!!org[campo]} onChange={e=>setOrg({...org,[campo]:e.target.checked})} />
                    {rotulo}
                  </label>
                ))}
              </div>
              <div style={{ fontSize:11, color:'var(--text4)', marginTop:8, lineHeight:1.5 }}>
                Com a liberação, a organização configura credenciais e conexão OAuth em Configurações → Integrações (API).
                Ativar um módulo via API desabilita a importação por arquivo desse módulo.
              </div>
            </div>

            {[['Nome',org.nome,'nome'],['Plano','','plano'],['Status','','status']].map(([label,val,key])=>(
              <div key={key}>
                <label style={{ fontSize:11,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4 }}>{label}</label>
                {key==='plano'?(
                  <select value={org.plano} onChange={e=>setOrg({...org,plano:e.target.value})} style={{width:'100%',background:'var(--surface3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:7,color:'var(--text1)',padding:'8px 10px',fontSize:13,outline:'none',appearance:'none',WebkitAppearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',paddingRight:32}}>
                    <option>Basico</option><option>Pro</option><option>Enterprise</option>
                  </select>
                ):key==='status'?(
                  <select value={org.status} onChange={e=>setOrg({...org,status:e.target.value})} style={{width:'100%',background:'var(--surface3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:7,color:'var(--text1)',padding:'8px 10px',fontSize:13,outline:'none',appearance:'none',WebkitAppearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',paddingRight:32}}>
                    <option>Ativo</option><option>Trial</option><option>Suspenso</option>
                  </select>
                ):(
                  <input value={org[key]} onChange={e=>setOrg({...org,[key]:e.target.value})} style={{width:'100%',background:'var(--surface3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:7,color:'var(--text1)',padding:'8px 10px',fontSize:13,outline:'none',appearance:'none',WebkitAppearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',paddingRight:32}}/>
                )}
              </div>
            ))}
            <button onClick={saveOrg} disabled={saving} style={{background:'var(--brand)',color:'#fff',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',marginTop:4}}>
              {saving?'Salvando...':'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Convidar usuário */}
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'20px 24px' }}>
          <h2 style={{ fontSize:14,fontWeight:700,color:'var(--text1)',marginBottom:16 }}>Convidar Usuário</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            <input type="email" placeholder="email@cliente.com" value={invEmail} onChange={e=>setInvEmail(e.target.value)}
              style={{background:'var(--surface3)',border:'1px solid var(--border)',borderRadius:7,color:'var(--text1)',padding:'9px 12px',fontSize:13,outline:'none'}}/>
            <select value={invRole} onChange={e=>setInvRole(e.target.value)} style={{background:'var(--surface3)',border:'1px solid var(--border)',borderRadius:7,color:'var(--text1)',padding:'9px 12px',fontSize:13,outline:'none'}}>
              <option value="org_admin">Administrador da Org</option>
              <option value="user">Usuário</option>
            </select>
            <button onClick={createInvite} style={{background:'var(--success)',color:'#fff',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer'}}>Gerar Link de Convite</button>
            {invLink&&(
              <div style={{ background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,padding:'10px 12px' }}>
                <div style={{ fontSize:11,color:'var(--success)',marginBottom:6 }}>Link gerado (válido por 7 dias):</div>
                <div style={{ fontSize:11,color:'var(--success)',wordBreak:'break-all',cursor:'pointer' }} onClick={()=>navigator.clipboard.writeText(invLink)}>{invLink}</div>
                <div style={{ fontSize:11,color:'var(--text4)',marginTop:4 }}>Clique para copiar</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usuários */}
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'20px 24px',marginBottom:16 }}>
        <h2 style={{ fontSize:14,fontWeight:700,color:'var(--text1)',marginBottom:14 }}>Usuários ({users.length})</h2>
        {users.length===0?<div style={{ color:'var(--text4)',fontSize:13 }}>Nenhum usuário cadastrado ainda.</div>:(
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['E-mail','Perfil','Desde'].map(h=><th key={h} style={{ padding:'7px 10px',textAlign:'left',color:'var(--text4)',fontSize:11,fontWeight:700,textTransform:'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'9px 10px',color:'var(--text1)' }}>{u.email}</td>
                  <td style={{ padding:'9px 10px' }}>
                    <span style={{ background:u.role==='super_admin'?'rgba(239,68,68,0.1)':'rgba(59,130,246,0.1)', color:u.role==='super_admin'?'var(--danger)':'var(--brand-text)', padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700 }}>{u.role}</span>
                  </td>
                  <td style={{ padding:'9px 10px',color:'var(--text4)',fontSize:12 }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Empresas */}
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'20px 24px' }}>
        <h2 style={{ fontSize:14,fontWeight:700,color:'var(--text1)',marginBottom:14 }}>Empresas ({empresas.length})</h2>
        <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
          {empresas.map(e=>(
            <span key={e.id} style={{ background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 14px',fontSize:13,color:'var(--text2)' }}>{e.nome}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
