'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Users() {
  const [users, setUsers]   = useState([])
  const [busca, setBusca]   = useState('')
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*, organizations(nome)').order('created_at',{ascending:false})
      .then(({ data }) => { setUsers(data||[]); setLoading(false) })
  }, [])

  const filtrados = users.filter(u =>
    (u.email||'').toLowerCase().includes(busca.toLowerCase()) ||
    (u.organizations?.nome||'').toLowerCase().includes(busca.toLowerCase())
  )

  const roleColor = r => r==='super_admin'?'#ef4444':r==='org_admin'?'#3b82f6':'#64748b'

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:800,color:'var(--text1)',margin:0 }}>Usuários</h1>
        <p style={{ color:'var(--text2)',fontSize:13,marginTop:4 }}>Todos os usuários cadastrados no sistema</p>
      </div>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por e-mail ou organização..."
        style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 14px',fontSize:13,outline:'none',marginBottom:16 }}/>
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
          <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
            {['E-mail','Organização','Perfil','Desde'].map(h=>(
              <th key={h} style={{ padding:'10px 16px',textAlign:'left',color:'var(--text4)',fontSize:11,fontWeight:700,textTransform:'uppercase' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading?<tr><td colSpan={4} style={{ padding:30,textAlign:'center',color:'var(--text4)' }}>Carregando...</td></tr>
            :filtrados.map(u=>(
              <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'11px 16px',color:'var(--text1)',fontWeight:500 }}>{u.email||'—'}</td>
                <td style={{ padding:'11px 16px',color:'var(--text2)' }}>{u.organizations?.nome||'—'}</td>
                <td style={{ padding:'11px 16px' }}>
                  <span style={{ background:`${roleColor(u.role)}18`,color:roleColor(u.role),border:`1px solid ${roleColor(u.role)}40`,padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:700 }}>{u.role}</span>
                </td>
                <td style={{ padding:'11px 16px',color:'var(--text4)',fontSize:12 }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
