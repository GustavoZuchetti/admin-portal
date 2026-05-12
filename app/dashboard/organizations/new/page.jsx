'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NewOrg() {
  const [form, setForm] = useState({ nome:'', plano:'Pro', status:'Trial' })
  const [adminEmail, setAdminEmail] = useState('')
  const [saving, setSaving]   = useState(false)
  const [result, setResult]   = useState(null)
  const router = useRouter()

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // 1. Criar organização
      const { data: org, error: orgErr } = await supabase.from('organizations').insert(form).select().single()
      if (orgErr) throw orgErr

      // 2. Criar convite para o admin
      let inviteLink = null
      if (adminEmail.trim()) {
        const { data: inv } = await supabase.from('invites').insert({
          organization_id: org.id, email: adminEmail, role: 'org_admin'
        }).select().single()
        if (inv) {
          const base = typeof window !== 'undefined' ? window.location.origin : ''
          inviteLink = `${base}/aceitar-convite?token=${inv.token}`
        }
      }

      setResult({ org, inviteLink })
    } catch (e) {
      alert('Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (result) return (
    <div>
      <h1 style={{ fontSize:22,fontWeight:800,color:'var(--text1)',marginBottom:24 }}>✅ Organização Criada!</h1>
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:28,maxWidth:520 }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',marginBottom:6 }}>Organização</div>
          <div style={{ fontSize:16,fontWeight:700,color:'var(--text1)' }}>{result.org.nome}</div>
          <div style={{ fontSize:12,color:'var(--text4)',marginTop:2 }}>Plano: {result.org.plano} • Status: {result.org.status}</div>
        </div>
        {result.inviteLink && (
          <div style={{ background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:10,padding:'14px 16px',marginBottom:20 }}>
            <div style={{ fontSize:12,color:'#86efac',fontWeight:700,marginBottom:8 }}>📧 Link de convite gerado para o administrador:</div>
            <div style={{ fontSize:12,color:'#4ade80',wordBreak:'break-all' }}>{result.inviteLink}</div>
            <button onClick={()=>navigator.clipboard.writeText(result.inviteLink)} style={{ marginTop:8,background:'rgba(34,197,94,0.15)',color:'#4ade80',border:'none',borderRadius:6,padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer' }}>Copiar Link</button>
          </div>
        )}
        <div style={{ display:'flex',gap:10 }}>
          <Link href={`/dashboard/organizations/${result.org.id}`} style={{ background:'#3b82f6',color:'#fff',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:700,textDecoration:'none' }}>Gerenciar</Link>
          <Link href="/dashboard/organizations" style={{ background:'var(--surface2)',color:'var(--text2)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:600,textDecoration:'none' }}>← Voltar</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:28 }}>
        <Link href="/dashboard/organizations" style={{ color:'var(--text4)',fontSize:13,textDecoration:'none' }}>← Organizações</Link>
        <span style={{ color:'var(--text4)' }}>/</span>
        <h1 style={{ fontSize:20,fontWeight:800,color:'var(--text1)',margin:0 }}>Nova Organização</h1>
      </div>
      <form onSubmit={handleCreate} style={{ maxWidth:480,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'28px 32px' }}>
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div>
            <label style={{ fontSize:11,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:6 }}>Nome da Organização</label>
            <input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} required placeholder="Ex: Empresa ABC Ltda"
              style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 12px',fontSize:13,outline:'none' }}/>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ fontSize:11,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:6 }}>Plano</label>
              <select value={form.plano} onChange={e=>setForm({...form,plano:e.target.value})} style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 12px',fontSize:13,outline:'none' }}>
                <option>Basico</option><option>Pro</option><option>Enterprise</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:6 }}>Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 12px',fontSize:13,outline:'none' }}>
                <option>Ativo</option><option>Trial</option><option>Suspenso</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize:11,color:'var(--text4)',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:6 }}>E-mail do Administrador (opcional)</label>
            <input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="admin@empresa.com"
              style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 12px',fontSize:13,outline:'none' }}/>
            <div style={{ fontSize:11,color:'var(--text4)',marginTop:4 }}>Se informado, um link de convite será gerado automaticamente.</div>
          </div>
          <button type="submit" disabled={saving||!form.nome.trim()} style={{ background:saving?'var(--surface2)':'#3b82f6',color:saving?'var(--text2)':'#fff',border:'none',borderRadius:8,padding:'12px',fontSize:14,fontWeight:700,cursor:saving?'not-allowed':'pointer',marginTop:4 }}>
            {saving?'Criando...':'Criar Organização'}
          </button>
        </div>
      </form>
    </div>
  )
}
