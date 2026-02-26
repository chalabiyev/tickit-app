export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://72.60.135.9:8080"

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  phone: string
  password: string
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      (body as { message?: string }).message ??
      (res.status === 401 ? "Invalid email or password" : "Login failed")
    throw new Error(message)
  }

  return res.json() as Promise<AuthResponse>
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      (body as { message?: string }).message ??
      (res.status === 400 ? "Registration failed" : "Unexpected error")
    throw new Error(message)
  }

  return res.json() as Promise<AuthResponse>
}
