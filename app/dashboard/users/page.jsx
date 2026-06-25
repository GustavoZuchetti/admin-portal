'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || 'https://financial-dashboard-omega-six.vercel.app'

// ── Estilos reutilizáveis ────────────────────────────────────────────
const inp = {
  width: '100%', background: '#242938', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#f1f5f9', padding: '10px 13px', fontSize: 13,
  outline: 'none', fontFamily: 'inherit',
}
const sel = {
  ...inp,
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  paddingRight: 36,
}
const lbl = { fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }
const btn  = (bg, col='#fff') => ({ background: bg, color: col, border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })
const card = { background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px' }

// ── Modal de criação de usuário ──────────────────────────────────────
function ModalCriarUsuario({ orgs, onClose, onSuccess }) {
  const [email,     setEmail]     = useState('')
  const [role,      setRole]      = useState('user')
  const [orgsSelec, setOrgsSelec] = useState([])          // ids selecionados
  const [creating,  setCreating]  = useState(false)
  const [links,     setLinks]     = useState([])           // links gerados
  const [erro,      setErro]      = useState('')

  const toggleOrg = (id) =>
    setOrgsSelec(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const criar = async () => {
    if (!email.trim()) { setErro('Informe o e-mail.'); return }
    if (orgsSelec.length === 0) { setErro('Selecione ao menos uma organização.'); return }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailValido) { setErro('E-mail inválido.'); return }
    setErro('')
    setCreating(true)
    const gerados = []
    for (const orgId of orgsSelec) {
      // Verificar se já existe invite ativo para este email+org
      await supabase.from('invites').delete().eq('email', email.trim()).eq('organization_id', orgId)
      const { data, error } = await supabase.from('invites').insert({
        organization_id: orgId,
        email: email.trim(),
        role,
      }).select().single()
      if (error) { setErro('Erro ao gerar convite: ' + error.message); setCreating(false); return }
      const orgNome = orgs.find(o => o.id === orgId)?.nome || orgId
      gerados.push({ orgNome, link: `${CLIENT_URL}/aceitar-convite?token=${data.token}` })
    }
    setLinks(gerados)
    setCreating(false)
    onSuccess?.()
  }

  const copiar = (txt) => { navigator.clipboard.writeText(txt); }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:998 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:999, width:520, maxHeight:'90vh', overflowY:'auto', ...card, boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:800, color:'#f1f5f9', margin:0 }}>Convidar Novo Usuário</h2>
            <p style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Gera links de convite por organização</p>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#475569', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {links.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {/* Email */}
            <div>
              <label style={lbl}>E-mail do usuário</label>
              <input style={inp} type="email" placeholder="usuario@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            {/* Perfil */}
            <div>
              <label style={lbl}>Perfil de acesso</label>
              <select style={sel} value={role} onChange={e => setRole(e.target.value)}>
                <option value="user">Usuário — leitura e visualização</option>
                <option value="org_admin">Administrador da Org — acesso total à org</option>
              </select>
            </div>

            {/* Organizações */}
            <div>
              <label style={lbl}>Organizações com acesso</label>
              <p style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>
                Selecione uma ou mais. Um link de convite será gerado por organização.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {orgs.map(org => {
                  const sel_ = orgsSelec.includes(org.id)
                  return (
                    <label key={org.id} onClick={() => toggleOrg(org.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background: sel_ ? 'rgba(59,130,246,0.08)' : '#242938', border:`1px solid ${sel_ ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius:8, cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ width:18, height:18, borderRadius:5, background: sel_ ? '#3b82f6' : 'transparent', border:`2px solid ${sel_ ? '#3b82f6' : '#475569'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                        {sel_ && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color: sel_ ? '#93c5fd' : '#f1f5f9' }}>{org.nome}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>
                          <span style={{ background: org.status==='Ativo'?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)', color: org.status==='Ativo'?'#4ade80':'#fbbf24', padding:'1px 7px', borderRadius:20, fontSize:10, fontWeight:700 }}>{org.status}</span>
                          {' · '}{org.plano}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {erro && (
              <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'10px 13px', color:'#fca5a5', fontSize:13 }}>{erro}</div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={onClose} style={{ ...btn('transparent','#64748b'), border:'1px solid rgba(255,255,255,0.08)', flex:1 }}>Cancelar</button>
              <button onClick={criar} disabled={creating} style={{ ...btn('#3b82f6'), flex:2, opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Gerando convites...' : `Gerar ${orgsSelec.length > 1 ? orgsSelec.length + ' convites' : 'convite'}`}
              </button>
            </div>
          </div>
        ) : (
          /* Links gerados */
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, padding:'12px 14px', color:'#86efac', fontSize:13, fontWeight:600 }}>
              ✅ {links.length} {links.length === 1 ? 'convite gerado' : 'convites gerados'} — válidos por 7 dias
            </div>
            {links.map((l, i) => (
              <div key={i} style={{ background:'#242938', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>{l.orgNome}</div>
                <div style={{ fontSize:11, color:'#60a5fa', wordBreak:'break-all', marginBottom:8, lineHeight:1.5 }}>{l.link}</div>
                <button onClick={() => copiar(l.link)} style={{ ...btn('rgba(59,130,246,0.1)','#60a5fa'), fontSize:11, padding:'5px 12px', border:'1px solid rgba(59,130,246,0.2)' }}>
                  Copiar link
                </button>
              </div>
            ))}
            <p style={{ fontSize:11, color:'#475569', lineHeight:1.6 }}>
              Compartilhe cada link com o usuário <strong style={{ color:'#94a3b8' }}>{email}</strong>. Ao acessar o link, ele irá criar sua senha e terá acesso à respectiva organização.
            </p>
            <button onClick={onClose} style={{ ...btn('#1e293b','#94a3b8'), border:'1px solid rgba(255,255,255,0.08)' }}>Fechar</button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Página principal ─────────────────────────────────────────────────
export default function Users() {
  const [users,      setUsers]      = useState([])
  const [orgs,       setOrgs]       = useState([])
  const [busca,      setBusca]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)

  const loadData = async () => {
    const [{ data: u }, { data: o }] = await Promise.all([
      supabase.from('profiles').select('*, organizations(nome, status, plano)').order('created_at', { ascending: false }),
      supabase.from('organizations').select('id, nome, status, plano').order('nome'),
    ])
    setUsers(u || [])
    setOrgs(o || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filtrados = users.filter(u =>
    (u.email || '').toLowerCase().includes(busca.toLowerCase()) ||
    (u.organizations?.nome || '').toLowerCase().includes(busca.toLowerCase())
  )

  const roleLabel = r => r === 'super_admin' ? 'Super Admin' : r === 'org_admin' ? 'Admin da Org' : 'Usuário'
  const roleColor = r => r === 'super_admin' ? '#ef4444' : r === 'org_admin' ? '#3b82f6' : '#64748b'

  return (
    <div>
      {showModal && (
        <ModalCriarUsuario
          orgs={orgs}
          onClose={() => setShowModal(false)}
          onSuccess={() => loadData()}
        />
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#f1f5f9', margin:0 }}>Usuários</h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>Gerencie acessos por organização</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ ...btn('#3b82f6'), display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(59,130,246,0.25)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Convidar Usuário
        </button>
      </div>

      <input value={busca} onChange={e => setBusca(e.target.value)}
        placeholder="Buscar por e-mail ou organização..."
        style={{ ...inp, marginBottom: 16 }} />

      <div style={{ ...card, padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              {['E-mail', 'Organização', 'Perfil', 'Criado em'].map(h => (
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', color:'#475569', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#475569' }}>Carregando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#475569' }}>Nenhum usuário encontrado.</td></tr>
            ) : filtrados.map((u, i) => (
              <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background: i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                <td style={{ padding:'12px 16px', color:'#f1f5f9', fontWeight:500 }}>{u.email || '—'}</td>
                <td style={{ padding:'12px 16px' }}>
                  {u.organizations ? (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:'#94a3b8' }}>{u.organizations.nome}</span>
                      <span style={{ fontSize:10, fontWeight:700, color: u.organizations.status==='Ativo'?'#4ade80':'#fbbf24', background: u.organizations.status==='Ativo'?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)', padding:'1px 6px', borderRadius:20 }}>{u.organizations.status}</span>
                    </span>
                  ) : <span style={{ color:'#475569' }}>—</span>}
                </td>
                <td style={{ padding:'12px 16px' }}>
                  <span style={{ background:`${roleColor(u.role)}18`, color:roleColor(u.role), border:`1px solid ${roleColor(u.role)}40`, padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td style={{ padding:'12px 16px', color:'#475569', fontSize:12 }}>
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nota sobre multi-org */}
      <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:8, fontSize:12, color:'#64748b', lineHeight:1.6 }}>
        <strong style={{ color:'#94a3b8' }}>ℹ Multi-org:</strong> um usuário pode ter acesso a mais de uma organização — selecione múltiplas orgs ao convidar e o sistema gerará um link de convite por organização. O acesso a cada organização é isolado por política de segurança (RLS).
      </div>
    </div>
  )
}
