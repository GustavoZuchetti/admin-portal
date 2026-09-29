import { supabase } from '@/lib/supabase'

/**
 * Retorna uma sessão utilizável para chamadas às APIs administrativas.
 * Mantém o fluxo normal quando o token ainda é válido e tenta renová-lo
 * apenas quando está próximo de expirar.
 */
export async function getFreshSession() {
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const expiresSoon = session.expires_at && session.expires_at * 1000 <= Date.now() + 60_000
  if (expiresSoon) {
    const refreshed = await supabase.auth.refreshSession()
    if (refreshed.data?.session) session = refreshed.data.session
  }

  return session
}

/**
 * Executa uma chamada autenticada ao portal admin.
 * Em 401, renova a sessão uma vez e repete a requisição para evitar que
 * uma expiração transitória faça o painel parecer vazio.
 */
export async function adminFetch(path, options = {}) {
  let session = await getFreshSession()
  if (!session) return { response: null, session: null, unauthenticated: true }

  const request = currentSession => fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${currentSession.access_token}`,
    },
  })

  let response = await request(session)
  if (response.status === 401) {
    const refreshed = await supabase.auth.refreshSession()
    if (refreshed.data?.session) {
      session = refreshed.data.session
      response = await request(session)
    }
  }

  return { response, session, unauthenticated: false }
}

export async function readJson(response) {
  try { return await response.json() } catch (_) { return {} }
}
