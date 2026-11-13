// Normalize both cold-start and already-open native links for Expo Router.
export function resetLinkPath(path: string): string {
  try {
    const url = new URL(path, 'https://app.invalid');
    const route = url.protocol === 'apakhabarmobileapp:' && url.hostname === 'reset-password'
      ? '/reset-password' : url.pathname.replace(/^\/--\//, '/').replace(/^\/\(auth\)\//, '/');
    if (route !== '/reset-password') return path;
    if (['token', 'email'].some(key => url.searchParams.getAll(key).length > 1)) return '/reset-password?link_error=invalid';
    // No backend URL from an untrusted incoming link is applied to the API client.
    return `/reset-password${url.search}`;
  } catch {
    return path.includes('reset-password') ? '/reset-password?link_error=invalid' : path;
  }
}

export function resetParameters(params: Record<string, string | string[] | undefined>) {
  const value = (key: string) => typeof params[key] === 'string' ? params[key] as string : undefined;
  const token = value('token');
  const email = value('email');
  const phone = value('phone');
  const challenge = value('challenge');
  const valid = !params.link_error && !!token && token.length <= 255
    && (challenge ? !!phone : !!email && /^[^\s@]+@[^\s@]+$/.test(email));
  return { token, email, phone, challenge, valid };
}

export function passwordResetError(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { code?: string; message?: string; errors?: Record<string, string[] | string> } } })?.response;
  if (!response) return 'Tidak dapat menghubungi pelayan. Semak sambungan internet dan cuba lagi.';
  if (response.status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar dan cuba lagi.';
  if (response.data?.code === 'invalid_or_expired_reset_token') return 'Pautan tidak sah atau telah tamat tempoh. Sila minta pautan baharu.';
  const first = Object.values(response.data?.errors || {})[0];
  if (typeof first === 'string') return first;
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  if ((response.status ?? 0) >= 500) return 'Pelayan tidak dapat memproses permintaan. Sila cuba lagi.';
  return response.data?.message || 'Permintaan gagal. Sila cuba lagi.';
}
