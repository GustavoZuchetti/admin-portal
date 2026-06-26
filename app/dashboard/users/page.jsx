'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || 'https://financial-dashboard-omega-six.vercel.app'

// ── Estilos base ─────────────────────────────────────────────────────
const inp = { width:'100%', background:'#242938', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', padding:'10px 13px', fontSize:13, outline:'none', fontFamily:'inherit' }
const selStyle = { ...inp, appearance:'none', WebkitAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:36 }
const lbl = { fontSize:11, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:6 }
const card = { background:'#1a1f2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12 }
const btnPrimary = { background:'#3b82f6', color:'#fff', border:'none', borderRadius:8, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(59,130,246,0.25)' }
const btnGhost  = { background:'transparent', color:'#64748b', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }

// ── Gerador de senha aleatória ────────────────────────────────────────
function gerarSenha() {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Força da senha ────────────────────────────────────────────────────
function forcaSenha(p) {
  let pts = 0
  if (p.length >= 8)  pts++
  if (p.length >= 12) pts++
  if (/[A-Z]/.test(p)) pts++
  if (/[0-9]/.test(p)) pts++
  if (/[^a-zA-Z0-9]/.test(p)) pts++
  if (pts <= 1) return { label:'Fraca', color:'#ef4444', w:'25%' }
  if (pts <= 2) return { label:'Razoável', color:'#f59e0b', w:'50%' }
  if (pts <= 3) return { label:'Boa', color:'#3b82f6', w:'75%' }
  return { label:'Forte', color:'#22c55e', w:'100%' }
}

// ── Modal principal ───────────────────────────────────────────────────
function ModalUsuario({ orgs, onClose, onSuccess }) {
  const [aba,       setAba]       = useState('criar')   // 'criar' | 'convidar'
  const [email,     setEmail]     = useState('')
  const [senha,     setSenha]     = useState('')
  const [verSenha,  setVerSenha]  = useState(false)
  const [role,      setRole]      = useState('user')
  const [orgId,     setOrgId]     = useState(orgs[0]?.id || '')
  const [orgsSelec, setOrgsSelec] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [erro,      setErro]      = useState('')
  const [sucesso,   setSucesso]   = useState(null)    // { tipo, dados }

  const forca = forcaSenha(senha)
  const toggleOrg = id => setOrgsSelec(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id])

  // ── ABA: Criar conta diretamente ─────────────────────────────────
  const criarConta = async () => {
    if (!email.trim()) { setErro('Informe o e-mail.'); return }
    if (senha.length < 8) { setErro('A senha deve ter ao menos 8 caracteres.'); return }
    if (!orgId) { setErro('Selecione a organização.'); return }
    setErro(''); setLoading(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: senha, organization_id: orgId, role })
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao criar usuário.'); return }
      setSucesso({
        tipo: 'conta',
        email: email.trim(),
        senha,
        org: orgs.find(o => o.id === orgId)?.nome || orgId,
      })
      onSuccess?.()
    } catch (e) {
      setErro('Erro de rede: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── ABA: Convidar por link ────────────────────────────────────────
  const gerarConvites = async () => {
    if (!email.trim()) { setErro('Informe o e-mail.'); return }
    if (orgsSelec.length === 0) { setErro('Selecione ao menos uma organização.'); return }
    setErro(''); setLoading(true)
    const links = []
    for (const oId of orgsSelec) {
      await supabase.from('invites').delete().eq('email', email.trim()).eq('organization_id', oId)
      const { data, error } = await supabase.from('invites').insert({ organization_id: oId, email: email.trim(), role }).select().single()
      if (error) { setErro('Erro: ' + error.message); setLoading(false); return }
      links.push({ orgNome: orgs.find(o=>o.id===oId)?.nome || oId, link: `${CLIENT_URL}/aceitar-convite?token=${data.token}` })
    }
    setSucesso({ tipo: 'convite', email: email.trim(), links })
    onSuccess?.()
    setLoading(false)
  }

  const copiar = txt => navigator.clipboard.writeText(txt)

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:998, backdropFilter:'blur(2px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:999, width:540, maxHeight:'92vh', overflowY:'auto', ...card, padding:28, boxShadow:'0 32px 72px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:800, color:'#f1f5f9', margin:0 }}>Adicionar Usuário</h2>
            <p style={{ fontSize:12, color:'#64748b', marginTop:3 }}>Crie uma conta imediata ou envie um link de convite</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', fontSize:22, cursor:'pointer', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>

        {/* Abas */}
        {!sucesso && (
          <div style={{ display:'flex', background:'#0f1117', borderRadius:10, padding:4, marginBottom:22, gap:4 }}>
            {[['criar','⚡ Criar conta agora'],['convidar','✉ Convidar por link']].map(([id,label])=>(
              <button key={id} onClick={()=>{setAba(id);setErro('')}} style={{ flex:1, padding:'8px 0', borderRadius:7, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s', background: aba===id?'#1e293b':'transparent', color: aba===id?'#f1f5f9':'#475569', boxShadow: aba===id?'0 1px 4px rgba(0,0,0,0.4)':'' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── SUCESSO ── */}
        {sucesso && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10, padding:'14px 16px', color:'#86efac', fontSize:13, fontWeight:600 }}>
              ✅ {sucesso.tipo==='conta' ? 'Usuário criado com sucesso!' : `${sucesso.links.length} convite(s) gerado(s)`}
            </div>

            {sucesso.tipo === 'conta' ? (
              <>
                <div style={{ background:'#242938', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontSize:12, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Credenciais para compartilhar</div>
                  {[['E-mail', sucesso.email],['Senha temporária', sucesso.senha],['Organização', sucesso.org]].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:12, color:'#94a3b8' }}>{k}:</span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <code style={{ fontSize:13, color:'#f1f5f9', fontFamily:'monospace' }}>{v}</code>
                        <button onClick={()=>copiar(v)} style={{ background:'rgba(59,130,246,0.1)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)', borderRadius:5, padding:'2px 8px', fontSize:10, cursor:'pointer', fontWeight:700 }}>Copiar</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'10px 13px', fontSize:12, color:'#fbbf24', lineHeight:1.6 }}>
                  ⚠️ Compartilhe as credenciais com segurança. Oriente o usuário a trocar a senha no primeiro acesso.
                </div>
              </>
            ) : (
              sucesso.links.map((l,i)=>(
                <div key={i} style={{ background:'#242938', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>{l.orgNome}</div>
                  <div style={{ fontSize:11, color:'#60a5fa', wordBreak:'break-all', marginBottom:8, lineHeight:1.5 }}>{l.link}</div>
                  <button onClick={()=>copiar(l.link)} style={{ background:'rgba(59,130,246,0.1)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)', borderRadius:6, padding:'5px 12px', fontSize:11, cursor:'pointer', fontWeight:700 }}>Copiar link</button>
                </div>
              ))
            )}
            <button onClick={onClose} style={{ ...btnGhost, marginTop:4 }}>Fechar</button>
          </div>
        )}

        {/* ── ABA: CRIAR ── */}
        {!sucesso && aba === 'criar' && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:8, padding:'10px 13px', fontSize:12, color:'#93c5fd', lineHeight:1.6 }}>
              O usuário poderá fazer login imediatamente com as credenciais geradas.
            </div>

            <div>
              <label style={lbl}>E-mail</label>
              <input style={inp} type="email" placeholder="usuario@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Senha temporária</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inp, paddingRight:80 }} type={verSenha?'text':'password'} placeholder="Mínimo 8 caracteres" value={senha} onChange={e=>setSenha(e.target.value)} />
                <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', display:'flex', gap:4 }}>
                  <button type="button" onClick={()=>setVerSenha(v=>!v)} title={verSenha?'Ocultar':'Mostrar'} style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer', padding:'2px 4px', fontSize:14 }}>{verSenha?'🙈':'👁'}</button>
                  <button type="button" onClick={()=>setSenha(gerarSenha())} title="Gerar senha" style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer', padding:'2px 4px', fontSize:14 }}>🎲</button>
                </div>
              </div>
              {senha && (
                <div style={{ marginTop:6 }}>
                  <div style={{ height:3, background:'#1e293b', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:forca.w, background:forca.color, borderRadius:99, transition:'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize:10, color:forca.color, fontWeight:600 }}>Senha {forca.label}</span>
                </div>
              )}
            </div>

            <div>
              <label style={lbl}>Organização</label>
              <select style={selStyle} value={orgId} onChange={e=>setOrgId(e.target.value)}>
                {orgs.map(o=><option key={o.id} value={o.id}>{o.nome} ({o.status})</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Perfil de acesso</label>
              <select style={selStyle} value={role} onChange={e=>setRole(e.target.value)}>
                <option value="user">Usuário — visualização e leitura</option>
                <option value="org_admin">Administrador da Org — acesso total à organização</option>
              </select>
            </div>

            {erro && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'10px 13px', color:'#fca5a5', fontSize:13 }}>{erro}</div>}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ ...btnGhost, flex:1 }}>Cancelar</button>
              <button onClick={criarConta} disabled={loading} style={{ ...btnPrimary, flex:2, opacity:loading?0.7:1 }}>
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </div>
          </div>
        )}

        {/* ── ABA: CONVIDAR ── */}
        {!sucesso && aba === 'convidar' && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ background:'rgba(139,92,246,0.05)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:8, padding:'10px 13px', fontSize:12, color:'#c4b5fd', lineHeight:1.6 }}>
              O usuário receberá um link para definir a própria senha. Útil quando a senha deve ser criada pelo próprio usuário.
            </div>

            <div>
              <label style={lbl}>E-mail</label>
              <input style={inp} type="email" placeholder="usuario@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Perfil de acesso</label>
              <select style={selStyle} value={role} onChange={e=>setRole(e.target.value)}>
                <option value="user">Usuário — visualização e leitura</option>
                <option value="org_admin">Administrador da Org — acesso total à organização</option>
              </select>
            </div>

            <div>
              <label style={lbl}>Organizações com acesso</label>
              <p style={{ fontSize:11, color:'#475569', marginBottom:10 }}>Um link separado é gerado por organização.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {orgs.map(org => {
                  const sel_ = orgsSelec.includes(org.id)
                  return (
                    <label key={org.id} onClick={()=>toggleOrg(org.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background:sel_?'rgba(59,130,246,0.08)':'#242938', border:`1px solid ${sel_?'rgba(59,130,246,0.35)':'rgba(255,255,255,0.07)'}`, borderRadius:8, cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ width:18, height:18, borderRadius:5, background:sel_?'#3b82f6':'transparent', border:`2px solid ${sel_?'#3b82f6':'#475569'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                        {sel_ && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:sel_?'#93c5fd':'#f1f5f9' }}>{org.nome}</div>
                        <div style={{ fontSize:11, color:'#475569' }}>{org.plano} · {org.status}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {erro && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'10px 13px', color:'#fca5a5', fontSize:13 }}>{erro}</div>}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ ...btnGhost, flex:1 }}>Cancelar</button>
              <button onClick={gerarConvites} disabled={loading} style={{ ...btnPrimary, flex:2, background:'#7c3aed', boxShadow:'0 4px 12px rgba(124,58,237,0.25)', opacity:loading?0.7:1 }}>
                {loading ? 'Gerando...' : `Gerar ${orgsSelec.length>1?orgsSelec.length+' convites':'convite'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Página ────────────────────────────────────────────────────────────
export default function Users() {
  const [users,     setUsers]     = useState([])
  const [orgs,      setOrgs]      = useState([])
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadData = useCallback(async () => {
    const [{ data: u }, { data: o }] = await Promise.all([
      supabase.from('profiles').select('*, organizations(nome, status, plano)').order('created_at', { ascending: false }),
      supabase.from('organizations').select('id, nome, status, plano').order('nome'),
    ])
    setUsers(u || [])
    setOrgs(o || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtrados = users.filter(u =>
    (u.email||'').toLowerCase().includes(busca.toLowerCase()) ||
    (u.organizations?.nome||'').toLowerCase().includes(busca.toLowerCase())
  )

  const roleLabel = r => r==='super_admin'?'Super Admin':r==='org_admin'?'Admin da Org':'Usuário'
  const roleColor = r => r==='super_admin'?'#ef4444':r==='org_admin'?'#3b82f6':'#64748b'

  return (
    <div>
      {showModal && <ModalUsuario orgs={orgs} onClose={()=>setShowModal(false)} onSuccess={()=>{setShowModal(false);loadData()}} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#f1f5f9', margin:0 }}>Usuários</h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>Gerencie acessos por organização</p>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ ...btnPrimary, display:'flex', alignItems:'center', gap:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar Usuário
        </button>
      </div>

      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por e-mail ou organização..."
        style={{ ...inp, marginBottom:16 }} />

      <div style={{ ...card, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              {['E-mail','Organização','Perfil','Criado em'].map(h=>(
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', color:'#475569', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#475569' }}>Carregando...</td></tr>
              : filtrados.length === 0
              ? <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#475569' }}>Nenhum usuário encontrado.</td></tr>
              : filtrados.map((u,i)=>(
                <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding:'12px 16px', color:'#f1f5f9', fontWeight:500 }}>{u.email||'—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    {u.organizations
                      ? <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                          <span style={{ color:'#94a3b8' }}>{u.organizations.nome}</span>
                          <span style={{ fontSize:10, fontWeight:700, color:u.organizations.status==='Ativo'?'#4ade80':'#fbbf24', background:u.organizations.status==='Ativo'?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)', padding:'1px 6px', borderRadius:20 }}>{u.organizations.status}</span>
                        </span>
                      : <span style={{ color:'#475569' }}>—</span>}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ background:`${roleColor(u.role)}18`, color:roleColor(u.role), border:`1px solid ${roleColor(u.role)}40`, padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#475569', fontSize:12 }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
