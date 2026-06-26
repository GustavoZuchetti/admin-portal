import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req) {
  // Verificar se o servidor está configurado
  const admin = getAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Adicione-a nas variáveis de ambiente da Vercel.' },
      { status: 500 }
    )
  }

  const { email, password, organization_id, role } = await req.json()

  // Validações básicas
  if (!email?.trim() || !password || !organization_id || !role) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'A senha deve ter ao menos 8 caracteres.' }, { status: 400 })
  }

  try {
    // 1. Criar usuário no Supabase Auth (email já confirmado)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,   // sem necessidade de confirmar por e-mail
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Criar/atualizar profile com org e role
    const { error: profileError } = await admin.from('profiles').upsert({
      id:              userId,
      organization_id,
      role,
      email:           email.trim().toLowerCase(),
    })

    if (profileError) {
      // Rollback: remover o usuário do auth se o profile falhou
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Usuário criado no Auth mas houve erro ao criar o perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    return NextResponse.json({ error: 'Erro inesperado: ' + err.message }, { status: 500 })
  }
}
