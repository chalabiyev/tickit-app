"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthPage } from "@/components/auth-page"
import { getToken } from "@/lib/auth"

export default function AuthRoutePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (getToken()) {
      router.replace("/dashboard")
    }
  }, [mounted, router])

  if (!mounted) {
    return null
  }

  return <AuthPage />
}

