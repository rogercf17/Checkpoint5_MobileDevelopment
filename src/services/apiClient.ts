import { auth } from './firebase';
import { API_URL } from '../config';

// Wrapper único da API: anexa o ID Token e traduz os erros
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sessão expirada. Entre novamente.');

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Erro ao falar com o servidor.');
  return json as T;
}