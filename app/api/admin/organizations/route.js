import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Lista organizações com contagem real de empresas/usuários via SERVICE ROLE.
// A listagem do cliente (chave anônima) sofre RLS: após o fix de isolamento
// multi-org, o super_admin só via empresas/perfis da PRÓPRIA org — por isso a
// Demo Corp aparecia com "0 empresas". O portal ADM precisa da visão global.
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  )
}

export async function GET(req) {
  const admin = getAdmin()
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !caller) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'super_admin')
    return NextResponse.json({ error: 'Apenas super admin' }, { status: 403 })

  // Busca separada + agregação em JS: evita ambiguidade de FK no embed do
  // PostgREST (empresas referencia organização por organization_id E por
  // user_id→profiles; o embed aninhado resolvia pelo caminho errado e a
  // Demo Corp, cuja empresa tem user_id nulo, vinha com 0 empresas)
  const [{ data: orgs, error: e1 }, { data: emps }, { data: profs }] = await Promise.all([
    admin.from('organizations').select('*').order('nome'),
    admin.from('empresas').select('id,nome,organization_id'),
    admin.from('profiles').select('id,email,role,organization_id'),
  ])
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  const porOrg = (arr, oid) => (arr || []).filter(x => x.organization_id === oid)
  const enriquecidas = (orgs || []).map(o => ({
    ...o,
    empresas: porOrg(emps, o.id).map(e => ({ id: e.id, nome: e.nome })),
    profiles: porOrg(profs, o.id).map(p => ({ id: p.id, email: p.email, role: p.role })),
  }))
  return NextResponse.json({ orgs: enriquecidas })
}

export async function POST(req) {
  const admin = getAdmin()
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { data: { user: caller }, error } = await admin.auth.getUser(token)
  if (error || !caller) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  const { data: prof } = await admin.from('profiles').select('role').eq('id', caller.id).single()
  if (prof?.role !== 'super_admin') return NextResponse.json({ error: 'Apenas super admin' }, { status: 403 })

  const { id, ...campos } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const permitidos = ['nome', 'plano', 'status', 'api_dre_liberado', 'api_fluxo_liberado']
  const patch = {}
  for (const k of permitidos) if (k in campos) patch[k] = campos[k]
  const { error: upErr } = await admin.from('organizations').update(patch).eq('id', id)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
