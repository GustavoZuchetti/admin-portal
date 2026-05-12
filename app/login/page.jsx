'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email,setEmail]=useState('')
  const [senha,setSenha]=useState('')
  const [erro,setErro]=useState('')
  const [loading,setLoading]=useState(false)
  const router=useRouter()

  const handleLogin=async(e)=>{
    e.preventDefault(); setLoading(true); setErro('')
    try {
      const {data,error}=await supabase.auth.signInWithPassword({email,password:senha})
      if(error)throw error
      const {data:p}=await supabase.from('profiles').select('role').eq('id',data.user.id).single()
      if(p?.role!=='super_admin'){await supabase.auth.signOut();throw new Error('Acesso restrito ao Super Admin.')}
      router.replace('/dashboard')
    }catch(e){setErro(e.message)}finally{setLoading(false)}
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{width:400,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:40}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',borderRadius:14,margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:900,color:'#fff'}}>⚡</div>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--text1)',margin:0}}>Admin Portal</h1>
          <p style={{color:'var(--text2)',fontSize:13,marginTop:4}}>Acesso exclusivo Super Admin</p>
        </div>
        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{fontSize:12,color:'var(--text2)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>E-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 12px',fontSize:14,outline:'none'}}/>
          </div>
          <div>
            <label style={{fontSize:12,color:'var(--text2)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Senha</label>
            <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} required style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text1)',padding:'10px 12px',fontSize:14,outline:'none'}}/>
          </div>
          {erro&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'10px 12px',color:'#fca5a5',fontSize:13}}>⚠️ {erro}</div>}
          <button type="submit" disabled={loading} style={{background:loading?'var(--surface2)':'#3b82f6',color:loading?'var(--text2)':'#fff',border:'none',borderRadius:8,padding:'12px',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',marginTop:4}}>
            {loading?'Verificando...':'Entrar no Admin Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}
