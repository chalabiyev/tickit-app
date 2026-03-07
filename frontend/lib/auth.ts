const TOKEN_KEY     = "eticksystem_token"
const TOKEN_KEY_OLD = "tickit_token"

/** Read token — migrates old key on the fly */
export function getToken(): string | null {
  if (typeof window === "undefined") return null

  // Migrate legacy key if present
  const old = localStorage.getItem(TOKEN_KEY_OLD)
  if (old) {
    localStorage.setItem(TOKEN_KEY, old)
    localStorage.removeItem(TOKEN_KEY_OLD)
  }

  return localStorage.getItem(TOKEN_KEY)
}

/** Save token */
export function setToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

/** Clear token on logout */
export function clearToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY_OLD) // clean up old key too
}