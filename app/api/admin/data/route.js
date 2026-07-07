import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
  const { data: { user: caller }, error } = await admin.auth.getUser(token)
  if (error || !caller) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  const { data: prof } = await admin.from('profiles').select('role').eq('id', caller.id).single()
  if (prof?.role !== 'super_admin') return NextResponse.json({ error: 'Apenas super admin' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope')

  if (scope === 'dashboard') {
    const [profiles, empresas, orgs, orgsList] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('empresas').select('*', { count: 'exact', head: true }),
      admin.from('organizations').select('*', { count: 'exact', head: true }),
      admin.from('organizations').select('*, profiles(count), empresas(count), lancamentos(count)').order('created_at', { ascending: false }),
    ])
    return NextResponse.json({
      counts: { profiles: profiles.count || 0, empresas: empresas.count || 0, organizations: orgs.count || 0 },
      orgs: orgsList.data || [],
    })
  }

  if (scope === 'org') {
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    const [org, profiles, empresas] = await Promise.all([
      admin.from('organizations').select('*').eq('id', id).single(),
      admin.from('profiles').select('*').eq('organization_id', id),
      admin.from('empresas').select('*').eq('organization_id', id),
    ])
    return NextResponse.json({ org: org.data, profiles: profiles.data || [], empresas: empresas.data || [] })
  }

  if (scope === 'users') {
    const { data } = await admin.from('profiles')
      .select('*, organizations(nome, status, plano)').order('created_at', { ascending: false })
    return NextResponse.json({ users: data || [] })
  }

  return NextResponse.json({ error: 'scope inválido' }, { status: 400 })
}
