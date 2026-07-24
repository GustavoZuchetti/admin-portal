'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const TABELA_LABEL = {
  empresas:            'Empresas',
  lancamentos:         'Lançamentos (DRE)',
  fluxo_caixa:         'Fluxo de Caixa',
  plano_contas:        'Plano de Contas',
  categoria_mappings:  'De-Para (Importação)',
  profiles:            'Usuários',
  organizations:       'Organizações',
  invites:             'Convites',
}
const ACAO_LABEL = {
  INSERT: { texto: 'Criação',  cor: 'var(--success)' },
  UPDATE: { texto: 'Edição',   cor: 'var(--brand)' },
  DELETE: { texto: 'Exclusão', cor: 'var(--danger)' },
}
const CAMPOS_OCULTOS = new Set(['id', 'created_at', 'updated_at'])

const inp = { background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text1)', padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit' }
const sel = { ...inp, appearance:'none', WebkitAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', paddingRight:32 }

function formatarValor(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function LinhaDetalhe({ log }) {
  const campos = log.action === 'UPDATE'
    ? (log.changed_fields || []).filter(c => !CAMPOS_OCULTOS.has(c))
    : Object.keys(log.new_data || log.old_data || {}).filter(c => !CAMPOS_OCULTOS.has(c))

  return (
    <tr>
      <td colSpan={7} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {campos.length === 0 && <div style={{ color: 'var(--text4)', fontSize: 12 }}>Sem detalhes adicionais.</div>}
          {campos.map(campo => {
            const antes  = log.old_data?.[campo]
            const depois = log.new_data?.[campo]
            return (
              <div key={campo} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{campo}</div>
                {log.action === 'UPDATE' ? (
                  <div style={{ fontSize: 12.5 }}>
                    <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{formatarValor(antes)}</span>
                    {' → '}
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatarValor(depois)}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--text1)' }}>{formatarValor(log.action === 'DELETE' ? antes : depois)}</div>
                )}
              </div>
            )
          })}
        </div>
      </td>
    </tr>
  )
}

export default function Logs() {
  const [logs,        setLogs]        = useState([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [loading,     setLoading]     = useState(true)
  const [erro,        setErro]        = useState(null)
  const [tabelaAusente, setTabelaAusente] = useState(false)
  const [expandido,   setExpandido]   = useState(null)
  const [orgs,        setOrgs]        = useState([])

  const [fOrg,    setFOrg]    = useState('')
  const [fTabela, setFTabela] = useState('')
  const [fAcao,   setFAcao]   = useState('')
  const [fEmail,  setFEmail]  = useState('')
  const [fDe,     setFDe]     = useState('')
  const [fAte,    setFAte]    = useState('')

  const pageSize = 50

  useEffect(() => {
    supabase.from('organizations').select('id,nome').order('nome').then(({ data }) => setOrgs(data || []))
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (fOrg)    params.set('organization_id', fOrg)
      if (fTabela) params.set('table_name', fTabela)
      if (fAcao)   params.set('action', fAcao)
      if (fEmail)  params.set('user_email', fEmail)
      if (fDe)     params.set('date_from', fDe)
      if (fAte)    params.set('date_to', fAte)

      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: 'Bearer ' + (session?.access_token || '') }
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(json.error || 'Erro ao carregar logs')
        setTabelaAusente(!!json.tabelaAusente)
        setLogs([]); setTotal(0)
        return
      }
      setLogs(json.logs || []); setTotal(json.total || 0)
    } catch (e) {
      setErro('Erro de rede: ' + e.message)
    } finally { setLoading(false) }
  }, [page, fOrg, fTabela, fAcao, fEmail, fDe, fAte])

  useEffect(() => { carregar() }, [carregar])

  const aplicarFiltros = () => { setPage(1); carregar() }
  const limparFiltros = () => { setFOrg(''); setFTabela(''); setFAcao(''); setFEmail(''); setFDe(''); setFAte(''); setPage(1) }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', margin: 0 }}>Logs de Auditoria</h1>
        <p style={{ color: 'var(--text4)', fontSize: 13, marginTop: 4 }}>
          Rastreabilidade completa: quem criou, editou ou excluiu informações, quando e o que mudou
        </p>
      </div>

      {/* Filtros */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
          <select style={sel} value={fOrg} onChange={e => setFOrg(e.target.value)}>
            <option value="">Todas as organizações</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
          <select style={sel} value={fTabela} onChange={e => setFTabela(e.target.value)}>
            <option value="">Todas as tabelas</option>
            {Object.entries(TABELA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select style={sel} value={fAcao} onChange={e => setFAcao(e.target.value)}>
            <option value="">Todas as ações</option>
            <option value="INSERT">Criação</option>
            <option value="UPDATE">Edição</option>
            <option value="DELETE">Exclusão</option>
          </select>
          <input style={inp} placeholder="E-mail do usuário..." value={fEmail} onChange={e => setFEmail(e.target.value)} />
          <input style={inp} type="date" value={fDe} onChange={e => setFDe(e.target.value)} title="De" />
          <input style={inp} type="date" value={fAte} onChange={e => setFAte(e.target.value)} title="Até" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={aplicarFiltros} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Filtrar</button>
          <button onClick={limparFiltros} style={{ background: 'transparent', color: 'var(--text4)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Limpar</button>
        </div>
      </div>

      {erro && (
        <div style={{ background: tabelaAusente ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${tabelaAusente ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 18, color: tabelaAusente ? 'var(--warning)' : 'var(--danger)', fontSize: 13, lineHeight: 1.6 }}>
          {erro}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['', 'Data/Hora', 'Usuário', 'Organização', 'Tabela', 'Ação', 'Registro'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: 'var(--text4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text4)' }}>Carregando...</td></tr>
            ) : logs.length === 0 && !erro ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text4)' }}>Nenhum registro encontrado para os filtros selecionados.</td></tr>
            ) : logs.map(log => {
              const acao = ACAO_LABEL[log.action] || { texto: log.action, cor: 'var(--text2)' }
              const aberto = expandido === log.id
              return (
                <>
                  <tr key={log.id} onClick={() => setExpandido(aberto ? null : log.id)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: aberto ? 'rgba(59,130,246,0.04)' : 'transparent' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text4)', fontSize: 11 }}>{aberto ? '▼' : '▶'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text1)' }}>{log.changed_by_email || <span style={{ color: 'var(--text4)' }}>Sistema</span>}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{log.organization_nome || '—'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{TABELA_LABEL[log.table_name] || log.table_name}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: `${acao.cor}18`, color: acao.cor, border: `1px solid ${acao.cor}40`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{acao.texto}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text4)', fontSize: 11.5, fontFamily: 'monospace' }}>{(log.record_id || '').substring(0, 8)}</td>
                  </tr>
                  {aberto && <LinhaDetalhe key={log.id + '-d'} log={log} />}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12.5, color: 'var(--text4)' }}>
          <span>{total} registro{total !== 1 ? 's' : ''} · página {page} de {totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: 'transparent', color: page <= 1 ? 'var(--text4)' : 'var(--text1)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: page <= 1 ? 'default' : 'pointer' }}>← Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: 'transparent', color: page >= totalPages ? 'var(--text4)' : 'var(--text1)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: page >= totalPages ? 'default' : 'pointer' }}>Próxima →</button>
          </div>
        </div>
      )}
    </div>
  )
}
