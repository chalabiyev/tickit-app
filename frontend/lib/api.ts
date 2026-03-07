export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

// ── Types ──────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email:    string
  password: string
}

export interface AuthResponse {
  token: string
}

export interface RegisterRequest {
  fullName: string
  email:    string
  phone:    string
  password: string
}

// ── Auth endpoints ─────────────────────────────────────────────────────────
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(credentials),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { message?: string }).message ??
      (res.status === 401 ? "Invalid email or password" : "Login failed")
    )
  }

  return res.json() as Promise<AuthResponse>
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { message?: string }).message ??
      (res.status === 400 ? "Registration failed" : "Unexpected error")
    )
  }

  return res.json() as Promise<AuthResponse>
}