"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "@/lib/locale-context"
import { t, type Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { login, register } from "@/lib/api"
import { setToken } from "@/lib/auth"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Ticket, Eye, EyeOff, ChevronDown } from "lucide-react"

// ─── Phone Codes ──────────────────────────────────────────────
const phoneCodes = [
  { code: "+994", country: "AZ", flag: "🇦🇿" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
  { code: "+90", country: "TR", flag: "🇹🇷" },
]

// ─── Validation ───────────────────────────────────────────────
interface FieldErrors {
  email?: string
  password?: string
  fullName?: string
  phone?: string
  terms?: string
}

function buildPhone(code: string, rawPhone: string): string {
  const trimmed = rawPhone.trim()
  let local = trimmed.replace(/[\s()-]/g, "")

  if (local.startsWith("+")) {
    local = local.slice(1)
  }

  const numericCode = code.replace("+", "")
  if (local.startsWith(numericCode)) {
    local = local.slice(numericCode.length)
  }

  local = local.replace(/^\+/, "")

  return `${code}${local}`
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateLogin(
  email: string,
  password: string,
  locale: Locale
): FieldErrors {
  const errors: FieldErrors = {}
  if (!email.trim()) errors.email = t(locale, "fieldRequired")
  else if (!validateEmail(email)) errors.email = t(locale, "invalidEmail")
  if (!password.trim()) errors.password = t(locale, "fieldRequired")
  else if (password.length < 8)
    errors.password = t(locale, "passwordTooShort")
  return errors
}

function validateRegister(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  termsAccepted: boolean,
  locale: Locale
): FieldErrors {
  const errors: FieldErrors = {}
  if (!fullName.trim()) errors.fullName = t(locale, "fieldRequired")
  if (!email.trim()) errors.email = t(locale, "fieldRequired")
  else if (!validateEmail(email)) errors.email = t(locale, "invalidEmail")
  if (!phone.trim()) errors.phone = t(locale, "fieldRequired")
  if (!password.trim()) errors.password = t(locale, "fieldRequired")
  else if (password.length < 8)
    errors.password = t(locale, "passwordTooShort")
  if (!termsAccepted) errors.terms = t(locale, "fieldRequired")
  return errors
}

// ─── Google SVG Icon ──────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── Apple SVG Icon ───────────────────────────────────────────
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

// ─── Locale Switcher Pill ─────────────────────────────────────
function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()
  const locales: Locale[] = ["az", "ru", "tr"]

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/50 p-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition-all",
            locale === l
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

// ─── Error Message ────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs font-medium text-destructive-foreground" role="alert">
      {message}
    </p>
  )
}

// ─── Main Auth Page ───────────────────────────────────────────
export function AuthPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // Register fields
  const [regFullName, setRegFullName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regPhoneCode, setRegPhoneCode] = useState("+994")
  const [regPassword, setRegPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSwitchMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"))
    setErrors({})
    setTouched(false)
    setShowPassword(false)
  }, [])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const errs = validateLogin(loginEmail, loginPassword, locale)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsLoading(true)
    try {
      const response = await login({ email: loginEmail, password: loginPassword })
      setToken(response.token)
      router.push("/dashboard")
    } catch (err) {
      toast({
        variant: "destructive",
        title: locale === "az" ? "Giriş uğursuz" : locale === "ru" ? "Ошибка входа" : "Login failed",
        description: err instanceof Error ? err.message : "Please check your credentials and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const errs = validateRegister(
      regFullName,
      regEmail,
      regPhone,
      regPassword,
      termsAccepted,
      locale
    )
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsLoading(true)
    try {
      const phone = buildPhone(regPhoneCode, regPhone)
      const response = await register({
        fullName: regFullName,
        email: regEmail,
        phone,
        password: regPassword,
      })
      setToken(response.token)
      router.push("/dashboard")
    } catch (err) {
      toast({
        variant: "destructive",
        title:
          locale === "az"
            ? "Qeydiyyat uğursuz oldu"
            : locale === "ru"
              ? "Ошибка регистрации"
              : "Registration failed",
        description:
          err instanceof Error
            ? err.message
            : locale === "az"
              ? "Zəhmət olmasa məlumatları yoxlayın və yenidən cəhd edin."
              : locale === "ru"
                ? "Проверьте данные и попробуйте снова."
                : "Please check your details and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isLogin = mode === "login"

  return (
    <div className="relative flex min-h-screen items-stretch bg-background">
      {/* ─── Left Branding Panel ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] flex-col justify-between bg-sidebar p-10 xl:p-14 relative overflow-hidden">
        {/* Decorative dots pattern */}
        <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" className="text-sidebar-foreground" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Top: Logo & Language Switcher */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary shadow-lg">
              <Ticket className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
              Tickit
            </span>
          </div>
          <LocaleSwitcher />
        </div>

        {/* Center: Feature highlights */}
        <div className="relative z-10 flex flex-col gap-8">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-sidebar-foreground text-balance xl:text-4xl">
            {isLogin
              ? t(locale, "welcomeBack")
              : t(locale, "getStarted")}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-sidebar-foreground/60">
            {isLogin
              ? locale === "az"
                ? "Tədbirlərinizi idarə edin, bilet satışlarını izləyin və maliyyənizi nəzarət altında saxlayın."
                : locale === "ru"
                  ? "Управляйте событиями, отслеживайте продажи билетов и контролируйте финансы."
                  : "Etkinliklerinizi yonetin, bilet satislarini takip edin ve finanslarinizi kontrol altinda tutun."
              : locale === "az"
                ? "Tickit ilə tədbirlərinizi peşəkar şəkildə yaradın və idarə edin."
                : locale === "ru"
                  ? "Создавайте и управляйте мероприятиями профессионально с Tickit."
                  : "Tickit ile etkinliklerinizi profesyonelce olusturun ve yonetin."}
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "10K+", sub: locale === "az" ? "Tədbirlər" : locale === "ru" ? "Событий" : "Etkinlik" },
              { label: "500K+", sub: locale === "az" ? "Biletlər" : locale === "ru" ? "Билетов" : "Bilet" },
              { label: "99.9%", sub: "Uptime" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-5 py-3"
              >
                <span className="text-lg font-bold text-sidebar-primary">
                  {s.label}
                </span>
                <span className="text-xs text-sidebar-foreground/50">
                  {s.sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative z-10">
          <p className="text-xs text-sidebar-foreground/30">
            {"© 2026 Tickit. All rights reserved."}
          </p>
        </div>
      </div>

      {/* ─── Right Form Panel ───────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-12 xl:px-20">
        {/* Mobile header with logo */}
        <div className="mb-8 flex w-full max-w-[420px] items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Ticket className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Tickit
            </span>
          </div>
          <LocaleSwitcher />
        </div>

        <div className="w-full max-w-[420px]">
          {/* Mode tabs */}
          <div className="mb-8 flex items-center gap-1 rounded-xl border border-border bg-secondary/40 p-1">
            <button
              onClick={() => {
                if (!isLogin) handleSwitchMode()
              }}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
                isLogin
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(locale, "login")}
            </button>
            <button
              onClick={() => {
                if (isLogin) handleSwitchMode()
              }}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
                !isLogin
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(locale, "register")}
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? t(locale, "login") : t(locale, "register")}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isLogin
                ? t(locale, "loginSubtitle")
                : t(locale, "registerSubtitle")}
            </p>
          </div>

          {/* ─── Login Form ───────────────────────────────── */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} noValidate className="flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-email">{t(locale, "email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t(locale, "emailPlaceholder")}
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value)
                    if (touched) {
                      const errs = validateLogin(e.target.value, loginPassword, locale)
                      setErrors(errs)
                    }
                  }}
                  aria-invalid={!!errors.email}
                  className={cn(
                    "h-11",
                    touched && errors.email && "border-destructive-foreground ring-destructive-foreground/20 ring-[3px]"
                  )}
                  autoComplete="email"
                />
                {touched && <FieldError message={errors.email} />}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-password">{t(locale, "password")}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t(locale, "passwordPlaceholder")}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value)
                      if (touched) {
                        const errs = validateLogin(loginEmail, e.target.value, locale)
                        setErrors(errs)
                      }
                    }}
                    aria-invalid={!!errors.password}
                    className={cn(
                      "h-11 pr-10",
                      touched && errors.password && "border-destructive-foreground ring-destructive-foreground/20 ring-[3px]"
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {touched && <FieldError message={errors.password} />}
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-muted-foreground">
                    {t(locale, "rememberMe")}
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t(locale, "forgotPassword")}
                </button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="h-11 w-full font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (locale === "az" ? "Yoxlanılır..." : locale === "ru" ? "Проверка..." : "Checking...") : t(locale, "loginButton")}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {t(locale, "orContinueWith")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Social Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 gap-2 font-medium"
                >
                  <GoogleIcon className="h-4.5 w-4.5" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 gap-2 font-medium"
                >
                  <AppleIcon className="h-4.5 w-4.5" />
                  Apple
                </Button>
              </div>

              {/* Switch prompt */}
              <p className="text-center text-sm text-muted-foreground">
                {t(locale, "noAccount")}{" "}
                <button
                  type="button"
                  onClick={handleSwitchMode}
                  className="font-semibold text-primary hover:underline"
                >
                  {t(locale, "register")}
                </button>
              </p>
            </form>
          ) : (
            /* ─── Register Form ─────────────────────────────── */
            <form onSubmit={handleRegisterSubmit} noValidate className="flex flex-col gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-name">{t(locale, "fullName")}</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder={t(locale, "fullNamePlaceholder")}
                  value={regFullName}
                  onChange={(e) => {
                    setRegFullName(e.target.value)
                    if (touched) {
                      const errs = validateRegister(e.target.value, regEmail, regPhone, regPassword, termsAccepted, locale)
                      setErrors(errs)
                    }
                  }}
                  aria-invalid={!!errors.fullName}
                  className={cn(
                    "h-11",
                    touched && errors.fullName && "border-destructive-foreground ring-destructive-foreground/20 ring-[3px]"
                  )}
                  autoComplete="name"
                />
                {touched && <FieldError message={errors.fullName} />}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-email">{t(locale, "email")}</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder={t(locale, "emailPlaceholder")}
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value)
                    if (touched) {
                      const errs = validateRegister(regFullName, e.target.value, regPhone, regPassword, termsAccepted, locale)
                      setErrors(errs)
                    }
                  }}
                  aria-invalid={!!errors.email}
                  className={cn(
                    "h-11",
                    touched && errors.email && "border-destructive-foreground ring-destructive-foreground/20 ring-[3px]"
                  )}
                  autoComplete="email"
                />
                {touched && <FieldError message={errors.email} />}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-phone">{t(locale, "phone")}</Label>
                <div className="flex gap-2">
                  <Select value={regPhoneCode} onValueChange={setRegPhoneCode}>
                    <SelectTrigger className="h-11 w-[110px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {phoneCodes.map((pc) => (
                        <SelectItem key={pc.code} value={pc.code}>
                          <span className="flex items-center gap-2">
                            <span>{pc.flag}</span>
                            <span>{pc.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder={t(locale, "phonePlaceholder")}
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value)
                      if (touched) {
                        const errs = validateRegister(regFullName, regEmail, e.target.value, regPassword, termsAccepted, locale)
                        setErrors(errs)
                      }
                    }}
                    aria-invalid={!!errors.phone}
                    className={cn(
                      "h-11 flex-1",
                      touched && errors.phone && "border-destructive-foreground ring-destructive-foreground/20 ring-[3px]"
                    )}
                    autoComplete="tel"
                  />
                </div>
                {touched && <FieldError message={errors.phone} />}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-password">{t(locale, "password")}</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t(locale, "passwordPlaceholder")}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value)
                      if (touched) {
                        const errs = validateRegister(regFullName, regEmail, regPhone, e.target.value, termsAccepted, locale)
                        setErrors(errs)
                      }
                    }}
                    aria-invalid={!!errors.password}
                    className={cn(
                      "h-11 pr-10",
                      touched && errors.password && "border-destructive-foreground ring-destructive-foreground/20 ring-[3px]"
                    )}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {touched && <FieldError message={errors.password} />}
              </div>

              {/* Terms checkbox */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      setTermsAccepted(checked === true)
                      if (touched) {
                        const errs = validateRegister(regFullName, regEmail, regPhone, regPassword, checked === true, locale)
                        setErrors(errs)
                      }
                    }}
                    className={cn(
                      "mt-0.5",
                      touched && errors.terms && "border-destructive-foreground"
                    )}
                  />
                  <Label htmlFor="terms" className="cursor-pointer text-sm font-normal leading-5 text-muted-foreground">
                    {t(locale, "agreeToTerms")}{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                    >
                      {t(locale, "termsAndConditions")}
                    </button>
                  </Label>
                </div>
                {touched && errors.terms && <FieldError message={errors.terms} />}
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" className="h-11 w-full font-semibold">
                {t(locale, "registerButton")}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {t(locale, "orContinueWith")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Social Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 gap-2 font-medium"
                >
                  <GoogleIcon className="h-4.5 w-4.5" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 gap-2 font-medium"
                >
                  <AppleIcon className="h-4.5 w-4.5" />
                  Apple
                </Button>
              </div>

              {/* Switch prompt */}
              <p className="text-center text-sm text-muted-foreground">
                {t(locale, "haveAccount")}{" "}
                <button
                  type="button"
                  onClick={handleSwitchMode}
                  className="font-semibold text-primary hover:underline"
                >
                  {t(locale, "login")}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
