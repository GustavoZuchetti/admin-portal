'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setErro('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (p?.role !== 'super_admin') {
        await supabase.auth.signOut()
        throw new Error('Acesso restrito ao Super Admin.')
      }
      router.replace('/dashboard')
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080e1a', display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes drift1 { 0%,100% { transform:translate(0,0) rotate(0) } 50% { transform:translate(20px,-24px) rotate(8deg) } }
        @keyframes drift2 { 0%,100% { transform:translate(0,0) rotate(0) } 50% { transform:translate(-18px,18px) rotate(-6deg) } }
        @keyframes shimmer { 0% { background-position:-200% center } 100% { background-position:200% center } }
        .brand-section { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .form-section  { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
        .adm-input {
          width:100%; background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1); border-radius:10px;
          color:#f1f5f9; padding:12px 14px; font-size:14px; outline:none;
          transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing:border-box; font-family:inherit;
        }
        .adm-input:focus { border-color:#3b82f6; background:rgba(59,130,246,0.05); box-shadow:0 0 0 3px rgba(59,130,246,0.12); }
        .adm-btn {
          background:linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
          color:#fff; border:none; border-radius:10px; padding:13px;
          font-size:14px; font-weight:700; cursor:pointer; width:100%;
          transition:transform 0.15s, box-shadow 0.2s; font-family:inherit;
          box-shadow:0 4px 16px rgba(59,130,246,0.3);
        }
        .adm-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 22px rgba(59,130,246,0.4); }
        .adm-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .shimmer-text {
          background:linear-gradient(90deg, #60a5fa 0%, #a78bfa 40%, #60a5fa 80%);
          background-size:200% auto; -webkit-background-clip:text;
          background-clip:text; -webkit-text-fill-color:transparent;
          animation:shimmer 4s linear infinite;
        }
        .divider-line {
          width:1px; align-self:stretch; margin:48px 0;
          background:linear-gradient(to bottom, transparent 0%, rgba(59,130,246,0.15) 30%, rgba(59,130,246,0.15) 70%, transparent 100%);
        }
        @media (max-width: 860px) {
          .login-layout { flex-direction:column !important; }
          .brand-section { display:none !important; }
          .divider-line { display:none !important; }
          .form-section { width:100% !important; padding:32px 24px !important; }
        }
      `}</style>

      {/* Fundo decorativo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(29,78,216,0.12) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(139,92,246,0.07) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: 320, height: 320, border: '1px solid rgba(59,130,246,0.08)', borderRadius: '40% 60% 55% 45% / 45% 35% 65% 55%', animation: 'drift1 20s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '30%', width: 200, height: 200, border: '1px solid rgba(139,92,246,0.07)', borderRadius: '55% 45% 40% 60% / 60% 50% 50% 40%', animation: 'drift2 16s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.025) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <div className="login-layout" style={{ display: 'flex', width: '100%', position: 'relative', alignItems: 'center' }}>

        {/* PAINEL ESQUERDO — Branding */}
        <div className="brand-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 72px' }}>
          <div style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
              <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16, boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>FS</div>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px' }}>Facesign</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', padding: '3px 9px', borderRadius: 6, letterSpacing: '1px', textTransform: 'uppercase' }}>Admin</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(59,130,246,0.8)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Portal Administrativo</div>
              <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 52, fontWeight: 400, color: 'rgba(241,245,249,0.95)', lineHeight: 1.08, letterSpacing: '-1.5px', margin: 0 }}>
                Gestão<br />
                <em style={{ fontStyle: 'italic' }}>centralizada</em>{' '}
                <span className="shimmer-text">da plataforma</span>
              </h1>
            </div>

            <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.7)', lineHeight: 1.75, marginBottom: 44, fontWeight: 300, maxWidth: 400 }}>
              Administre organizações, usuários e permissões de toda a plataforma Facesign em um único painel de controle.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', backdropFilter: 'blur(8px)' }}>
              {[
                'Gestão de organizações e planos',
                'Controle de usuários e papéis',
                'Provisionamento de novos clientes',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', fontSize: 13.5, color: 'rgba(203,213,225,0.75)', fontWeight: 300 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="divider-line" />

        {/* PAINEL DIREITO — Formulário */}
        <div className="form-section" style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
          <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 30, fontWeight: 400, color: 'rgba(241,245,249,0.95)', margin: 0, marginBottom: 8 }}>
              Acesso administrativo
            </h2>
            <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 14, marginTop: 0, marginBottom: 32, fontWeight: 300 }}>
              Área restrita — credenciais de Super Admin
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 8 }}>E-mail</label>
                <input className="adm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 8 }}>Senha</label>
                <input className="adm-input" type="password" value={senha} onChange={e => setSenha(e.target.value)} required autoComplete="current-password" />
              </div>

              {erro && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 12px', color: '#fca5a5', fontSize: 13 }}>
                  {erro}
                </div>
              )}

              <button className="adm-btn" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? 'Verificando...' : 'Entrar no Admin Portal'}
              </button>
            </form>

            <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)' }}>© 2026 Facesign</span>
              <span style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                Acesso monitorado
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
