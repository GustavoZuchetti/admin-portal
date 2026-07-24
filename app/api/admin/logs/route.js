import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Rota de administração: nunca pode servir resposta cacheada.
export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
    {
      // CRÍTICO: o Next.js 14 cacheia fetch GET por padrão em route handlers —
      // os SELECTs do PostgREST voltavam CONGELADOS (usuário recém-criado não
      // aparecia na lista nem no detalhe da organização).
      global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' }) },
    }
  )
}

export async function GET(req) {
  const admin = getAdmin()
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !caller) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Acesso negado — apenas Super Admin' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const organizationId = searchParams.get('organization_id')
  const tableName       = searchParams.get('table_name')
  const action          = searchParams.get('action')
  const userEmail       = searchParams.get('user_email')
  const recordId        = searchParams.get('record_id')
  const dateFrom        = searchParams.get('date_from')
  const dateTo          = searchParams.get('date_to')
  const page            = parseInt(searchParams.get('page') || '1', 10)
  const pageSize        = Math.min(parseInt(searchParams.get('page_size') || '50', 10), 200)

  // Se não existir a tabela audit_logs ainda (script SQL não executado),
  // devolver uma resposta clara em vez de erro genérico 500.
  let query = admin.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (organizationId) query = query.eq('organization_id', organizationId)
  if (tableName)      query = query.eq('table_name', tableName)
  if (action)         query = query.eq('action', action)
  if (recordId)       query = query.eq('record_id', recordId)
  if (userEmail)       query = query.ilike('changed_by_email', `%${userEmail}%`)
  if (dateFrom)        query = query.gte('created_at', dateFrom)
  if (dateTo)          query = query.lte('created_at', dateTo)

  const fromIdx = (page - 1) * pageSize
  query = query.range(fromIdx, fromIdx + pageSize - 1)

  const { data, error, count } = await query
  if (error) {
    const tabelaAusente = /relation .* does not exist/i.test(error.message)
    return NextResponse.json({
      error: tabelaAusente
        ? 'A tabela de logs ainda não foi criada. Execute o script setup_audit_logs.sql no Supabase SQL Editor.'
        : error.message,
      tabelaAusente,
    }, { status: tabelaAusente ? 424 : 500 })
  }

  // Buscar nomes das organizações envolvidas (para exibir em vez de só o UUID)
  const orgIds = [...new Set((data || []).map(l => l.organization_id).filter(Boolean))]
  let orgMap = {}
  if (orgIds.length) {
    const { data: orgs } = await admin.from('organizations').select('id,nome').in('id', orgIds)
    orgMap = Object.fromEntries((orgs || []).map(o => [o.id, o.nome]))
  }

  const logs = (data || []).map(l => ({ ...l, organization_nome: orgMap[l.organization_id] || null }))

  return NextResponse.json({ logs, total: count || 0, page, pageSize })
}
