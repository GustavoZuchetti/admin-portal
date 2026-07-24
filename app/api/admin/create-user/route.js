import { NextResponse } from 'next/server'

// Rota de administração: nunca pode servir resposta cacheada.
export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req) {
  const admin = getAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Adicione-a nas variáveis de ambiente da Vercel.' },
      { status: 500 }
    )
  }

  // SEGURANÇA: verificar que quem está chamando é um Super Admin autenticado.
  // Sem essa verificação, qualquer pessoa com a URL da rota poderia criar
  // contas em qualquer organização.
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !caller) return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })

  const { data: callerProfile } = await admin.from('profiles').select('role,email').eq('id', caller.id).single()
  if (callerProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Acesso negado — apenas Super Admin.' }, { status: 403 })
  }

  const { email, password, organization_id, role } = await req.json()

  if (!email?.trim() || !password || !organization_id || !role) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'A senha deve ter ao menos 8 caracteres.' }, { status: 400 })
  }

  try {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    const { error: profileError } = await admin.from('profiles').upsert({
      id:              userId,
      organization_id,
      role,
      email:           email.trim().toLowerCase(),
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Usuário criado no Auth mas houve erro ao criar o perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    // Registrar no log de auditoria — quem (o admin autenticado) criou qual
    // conta, em qual organização. NUNCA registrar a senha.
    await admin.from('audit_logs').insert({
      organization_id,
      table_name: 'profiles',
      record_id: userId,
      action: 'INSERT',
      changed_by: caller.id,
      changed_by_email: callerProfile?.email || caller.email,
      new_data: { email: email.trim().toLowerCase(), organization_id, role, criado_via: 'admin-portal:create-user' },
    }).then(() => {}, () => {}) // não bloquear a resposta se audit_logs ainda não existir

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    return NextResponse.json({ error: 'Erro inesperado: ' + err.message }, { status: 500 })
  }
}
