"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Ticket, Eye, EyeOff, KeyRound, ArrowLeft,
  Loader2, Globe, Sun, Moon, Check,
  Zap, ShieldCheck, BarChart3, ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Locale = "az" | "ru" | "tr" | "en"
type AuthMode = "login" | "register" | "verify" | "forgot" | "verify-reset" | "new-password"

interface Translation {
  welcome: string; subtitle: string; login: string; register: string
  email: string; password: string; fullName: string; phone: string
  forgotPass: string; loginBtn: string; registerBtn: string
  verifyTitle: string; verifySub: string; verifyBtn: string
  back: string; error: string; agreeTo: string; terms: string
  orContinue: string; haveAccount: string; noAccount: string; remember: string
  resetPassTitle: string; resetPassSub: string; sendCodeBtn: string
  newPassword: string; confirmPassword: string; updatePassBtn: string
  nextBtn: string; passMismatch: string; resendCode: string; resendIn: string
  passMinLength: string; passUpper: string; passLower: string; passNumber: string
  heroTitle: string; heroHighlight: string; heroSub: string
  feat1Title: string; feat1Sub: string; feat2Title: string; feat2Sub: string
  feat3Title: string; feat3Sub: string
  placeholders: { fullName: string; email: string; phone: string; password: string }
  // Error messages
  errNoInternet?: string; errUnauthorized?: string; errForbidden?: string
  errNotFound?: string; errTooManyRequests?: string; errServer?: string; errUnknown?: string
}

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────
const translations: Record<Locale, Translation> = {
  az: {
    welcome: "Xoş gəlmisiniz", subtitle: "Davam etmək üçün məlumatlarınızı daxil edin",
    login: "Daxil ol", register: "Qeydiyyat",
    email: "E-poçt", password: "Şifrə", fullName: "Ad Soyad", phone: "Telefon",
    forgotPass: "Unutmusunuz?", loginBtn: "Daxil ol", registerBtn: "Qeydiyyatdan keç",
    verifyTitle: "Təsdiqləmə kodu", verifySub: "ünvanına göndərilən 6 rəqəmli kodu daxil edin",
    verifyBtn: "Təsdiqlə və Giriş et", back: "Geri qayıt", error: "Xəta baş verdi",
    agreeTo: "Şərtlər və Qaydalarla razıyam", terms: "Şərtlər və Qaydalar",
    orContinue: "və ya davam edin", haveAccount: "Artıq hesabınız var?", noAccount: "Hesabınız yoxdur?", remember: "Yadda saxla",
    resetPassTitle: "Şifrəni yenilə", resetPassSub: "E-poçt ünvanınızı daxil edin, sizə təsdiq kodu göndərəcəyik.",
    sendCodeBtn: "Kodu göndər", newPassword: "Yeni şifrə", confirmPassword: "Şifrəni təsdiqləyin",
    updatePassBtn: "Şifrəni yenilə və Daxil ol", nextBtn: "Davam et", passMismatch: "Şifrələr eyni deyil!",
    resendCode: "Kodu yenidən göndər", resendIn: "saniyə sonra yenidən göndər",
    passMinLength: "Ən azı 8 simvol", passUpper: "1 böyük hərf", passLower: "1 kiçik hərf", passNumber: "1 rəqəm",
    heroTitle: "Tədbirlərinizi peşəkar idarə edin.", heroHighlight: "peşəkar", heroSub: "Bilet satışından qəbz analitikasına qədər — hamısı bir paneldə.",
    feat1Title: "Ani bilet satışı", feat1Sub: "Saniyələr içində — heç bir gecikmə yoxdur",
    feat2Title: "Real-time analitika", feat2Sub: "Satış, giriş və gəlir — canlı olaraq",
    feat3Title: "Tam təhlükəsizlik", feat3Sub: "SSL şifrələnmiş, GDPR uyğun",
    placeholders: { fullName: "Ad Soyadınızı daxil edin", email: "sizin@email.com", phone: "XX XXX XX XX", password: "Şifrənizi daxil edin" },
    errNoInternet: "İnternet bağlantısı yoxdur. Yenidən cəhd edin.", errUnauthorized: "Məlumatlar yanlışdır.", errForbidden: "Giriş icazəniz yoxdur.", errNotFound: "Məlumat tapılmadı.", errTooManyRequests: "Çox sürətli sorğu. Bir az gözləyin.", errServer: "Server xətası. eticksystem administrasiyası ilə əlaqə saxlayın.", errUnknown: "Gözlənilməz xəta baş verdi.",
  },
  ru: {
    welcome: "Добро пожаловать", subtitle: "Введите свои данные, чтобы продолжить",
    login: "Войти", register: "Регистрация",
    email: "Эл. почта", password: "Пароль", fullName: "Имя и Фамилия", phone: "Телефон",
    forgotPass: "Забыли?", loginBtn: "Войти", registerBtn: "Зарегистрироваться",
    verifyTitle: "Код подтверждения", verifySub: "Введите 6-значный код, отправленный на",
    verifyBtn: "Подтвердить и войти", back: "Назад", error: "Произошла ошибка",
    agreeTo: "Я согласен с", terms: "Условиями и Правилами",
    orContinue: "или продолжите через", haveAccount: "Уже есть аккаунт?", noAccount: "Нет аккаунта?", remember: "Запомнить меня",
    resetPassTitle: "Восстановление пароля", resetPassSub: "Введите ваш email, мы отправим код подтверждения.",
    sendCodeBtn: "Отправить код", newPassword: "Новый пароль", confirmPassword: "Подтвердите пароль",
    updatePassBtn: "Обновить пароль и Войти", nextBtn: "Продолжить", passMismatch: "Пароли не совпадают!",
    resendCode: "Отправить код еще раз", resendIn: "сек. до повторной отправки",
    passMinLength: "Минимум 8 символов", passUpper: "1 заглавная буква", passLower: "1 строчная буква", passNumber: "1 цифра",
    heroTitle: "Управляйте мероприятиями профессионально.", heroHighlight: "профессионально", heroSub: "От продажи билетов до аналитики — всё в одной панели.",
    feat1Title: "Мгновенная продажа", feat1Sub: "Билеты продаются за секунды — без задержек",
    feat2Title: "Аналитика в реальном времени", feat2Sub: "Продажи, входы и доход — в прямом эфире",
    feat3Title: "Полная безопасность", feat3Sub: "SSL-шифрование, соответствие GDPR",
    placeholders: { fullName: "Введите Имя и Фамилию", email: "ваш@email.com", phone: "XX XXX XX XX", password: "Введите пароль" },
    errNoInternet: "Нет подключения к интернету. Попробуйте снова.", errUnauthorized: "Неверные данные.", errForbidden: "Нет доступа.", errNotFound: "Данные не найдены.", errTooManyRequests: "Слишком много запросов. Подождите.", errServer: "Ошибка сервера. Обратитесь к администрации eticksystem.", errUnknown: "Произошла неизвестная ошибка.",
  },
  tr: {
    welcome: "Hoş geldiniz", subtitle: "Devam etmek için bilgilerinizi girin",
    login: "Giriş yap", register: "Kayıt ol",
    email: "E-posta", password: "Şifre", fullName: "Ad Soyad", phone: "Telefon",
    forgotPass: "Unuttunuz mu?", loginBtn: "Giriş yap", registerBtn: "Kayıt ol",
    verifyTitle: "Doğrulama kodu", verifySub: "adresine gönderilen 6 haneli kodu girin",
    verifyBtn: "Doğrula ve Giriş yap", back: "Geri dön", error: "Bir hata oluştu",
    agreeTo: "Kabul ediyorum", terms: "Şartlar ve Koşullar",
    orContinue: "veya şununla devam et", haveAccount: "Zaten hesabınız var mı?", noAccount: "Hesabınız yok mu?", remember: "Beni hatırla",
    resetPassTitle: "Şifre sıfırlama", resetPassSub: "E-posta adresinizi girin, doğrulama kodu göndereceğiz.",
    sendCodeBtn: "Kodu gönder", newPassword: "Yeni şifre", confirmPassword: "Şifreyi onayla",
    updatePassBtn: "Şifreyi Yenile ve Giriş yap", nextBtn: "Devam et", passMismatch: "Şifreler eşleşmiyor!",
    resendCode: "Kodu tekrar gönder", resendIn: "saniye sonra tekrar gönder",
    passMinLength: "En az 8 karakter", passUpper: "1 büyük harf", passLower: "1 küçük harf", passNumber: "1 rakam",
    heroTitle: "Etkinliklerinizi profesyonelce yönetin.", heroHighlight: "profesyonelce", heroSub: "Bilet satışından gelir analizine — hepsi tek panelde.",
    feat1Title: "Anında bilet satışı", feat1Sub: "Saniyeler içinde — hiçbir gecikme yok",
    feat2Title: "Gerçek zamanlı analitik", feat2Sub: "Satış, giriş ve gelir — canlı olarak",
    feat3Title: "Tam güvenlik", feat3Sub: "SSL şifreli, GDPR uyumlu",
    placeholders: { fullName: "Ad Soyadınızı girin", email: "sizin@email.com", phone: "XX XXX XX XX", password: "Şifrenizi girin" },
    errNoInternet: "İnternet bağlantısı yok. Tekrar deneyin.", errUnauthorized: "Bilgiler yanlış.", errForbidden: "Erişim izniniz yok.", errNotFound: "Veri bulunamadı.", errTooManyRequests: "Çok fazla istek. Bekleyin.", errServer: "Sunucu hatası. eticksystem yönetimiyle iletişime geçin.", errUnknown: "Beklenmeyen hata oluştu.",
  },
  en: {
    welcome: "Welcome back", subtitle: "Please enter your details to continue",
    login: "Login", register: "Register",
    email: "Email", password: "Password", fullName: "Full Name", phone: "Phone",
    forgotPass: "Forgot?", loginBtn: "Sign In", registerBtn: "Sign Up",
    verifyTitle: "Verification Code", verifySub: "Enter the 6-digit code sent to",
    verifyBtn: "Verify and Login", back: "Go back", error: "An error occurred",
    agreeTo: "I agree to the", terms: "Terms and Conditions",
    orContinue: "or continue with", haveAccount: "Already have an account?", noAccount: "Don't have an account?", remember: "Remember me",
    resetPassTitle: "Reset Password", resetPassSub: "Enter your email, we will send you a verification code.",
    sendCodeBtn: "Send Code", newPassword: "New Password", confirmPassword: "Confirm Password",
    updatePassBtn: "Update Password & Login", nextBtn: "Continue", passMismatch: "Passwords do not match!",
    resendCode: "Resend code", resendIn: "seconds to resend",
    passMinLength: "At least 8 characters", passUpper: "1 uppercase letter", passLower: "1 lowercase letter", passNumber: "1 number",
    heroTitle: "Manage your events professionally.", heroHighlight: "professionally", heroSub: "From ticket sales to revenue analytics — all in one panel.",
    feat1Title: "Instant ticket sales", feat1Sub: "Processed in seconds — zero delays",
    feat2Title: "Real-time analytics", feat2Sub: "Sales, entries & revenue — live",
    feat3Title: "Full security", feat3Sub: "SSL encrypted, GDPR compliant",
    placeholders: { fullName: "Enter your Full Name", email: "your@email.com", phone: "XX XXX XX XX", password: "Enter your password" },
    errNoInternet: "No internet connection. Please try again.", errUnauthorized: "Invalid credentials.", errForbidden: "Access denied.", errNotFound: "Data not found.", errTooManyRequests: "Too many requests. Please wait.", errServer: "Server error. Please contact eticksystem administration.", errUnknown: "An unexpected error occurred.",
  },
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

const PHONE_COUNTRIES = [
  { code: "+994", iso: "az", label: "AZ" },
  { code: "+7",   iso: "ru", label: "RU" },
  { code: "+90",  iso: "tr", label: "TR" },
  { code: "+1",   iso: "us", label: "US" },
  { code: "+44",  iso: "gb", label: "GB" },
  { code: "+49",  iso: "de", label: "DE" },
  { code: "+33",  iso: "fr", label: "FR" },
  { code: "+971", iso: "ae", label: "AE" },
]

const FEATURE_CONFIG = [
  { icon: Zap,        color: "text-amber-400",   bg: "bg-amber-500/10",   titleKey: "feat1Title", subKey: "feat1Sub" },
  { icon: BarChart3,  color: "text-emerald-400",  bg: "bg-emerald-500/10", titleKey: "feat2Title", subKey: "feat2Sub" },
  { icon: ShieldCheck,color: "text-blue-400",     bg: "bg-blue-500/10",    titleKey: "feat3Title", subKey: "feat3Sub" },
] as const

const OTP_RESEND_DELAY = 60

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function FlagImg({ iso, size = 20 }: { iso?: string; size?: number }) {
  const safeIso = (iso ?? "az").toLowerCase()
  const h = Math.round(size * 0.75)
  return (
    <img
      src={`https://flagcdn.com/${size}x${h}/${safeIso}.png`}
      srcSet={`https://flagcdn.com/${size * 2}x${h * 2}/${safeIso}.png 2x`}
      width={size}
      height={h}
      alt={safeIso.toUpperCase()}
      className="rounded-sm object-cover shrink-0 inline-block"
      loading="lazy"
    />
  )
}

function Field({ label, dark, children }: { label: string; dark: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={cn("block text-sm font-semibold", dark ? "text-slate-200" : "text-slate-700")}>{label}</label>
      {children}
    </div>
  )
}

function EyeBtn({ show, toggle, dark }: { show: boolean; toggle: () => void; dark: boolean }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={show ? "Hide password" : "Show password"}
      className={cn("absolute right-4 top-3.5 transition-colors", dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700")}
    >
      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  )
}

interface PasswordRules {
  isPassLength: boolean
  isPassUpper: boolean
  isPassLower: boolean
  isPassNumber: boolean
}

function PasswordStrength({ dict, dark, ...rules }: { dict: Translation; dark: boolean } & PasswordRules) {
  const checks = [
    { text: dict.passMinLength, valid: rules.isPassLength },
    { text: dict.passUpper,     valid: rules.isPassUpper },
    { text: dict.passLower,     valid: rules.isPassLower },
    { text: dict.passNumber,    valid: rules.isPassNumber },
  ]
  return (
    <div className="mt-2 space-y-1.5" role="list" aria-label="Password requirements">
      {checks.map((r) => (
        <div key={r.text} className="flex items-center gap-2 text-xs" role="listitem">
          {r.valid
            ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            : <div className={cn("h-1.5 w-1.5 rounded-full ml-1 shrink-0", dark ? "bg-slate-700" : "bg-slate-300")} />
          }
          <span className={cn(r.valid ? (dark ? "text-slate-300" : "text-slate-600") : (dark ? "text-slate-600" : "text-slate-400"))}>
            {r.text}
          </span>
        </div>
      ))}
    </div>
  )
}

function SubmitBtn({ isLoading, label, disabled }: { isLoading: boolean; label: string; disabled: boolean }) {
  return (
    <Button
      type="submit"
      className="w-full h-12 font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 transition-colors"
      disabled={isLoading || disabled}
    >
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : label}
    </Button>
  )
}

function Divider({ dark, label }: { dark: boolean; label: string }) {
  return (
    <div className="relative my-4" role="separator">
      <div className="absolute inset-0 flex items-center">
        <span className={cn("w-full border-t", dark ? "border-slate-800" : "border-slate-200")} />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className={cn("px-2 text-slate-500", dark ? "bg-[#090A0F]" : "bg-[#eef2ff]")}>{label}</span>
      </div>
    </div>
  )
}

function SocialRow({ dark }: { dark: boolean }) {
  const btnCls = cn(
    "h-11 flex-1 flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all",
    dark ? "bg-[#12141D] border-white/5 hover:bg-[#1A1D27] text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
  )
  return (
    <div className="flex gap-3">
      <button type="button" className={btnCls} aria-label="Continue with Google">
        <GoogleIcon className="h-4 w-4 shrink-0" />Google
      </button>
      <button type="button" className={btnCls} aria-label="Continue with Apple">
        <AppleIcon className="h-4 w-4 shrink-0" />Apple
      </button>
    </div>
  )
}

function SwitchMode({ dark, text, linkLabel, onClick }: { dark: boolean; text: string; linkLabel: string; onClick: () => void }) {
  return (
    <p className="text-center text-sm text-slate-500 pt-2">
      {text}
      <button type="button" onClick={onClick} className="text-[#2563EB] font-bold ml-1 hover:underline">
        {linkLabel}
      </button>
    </p>
  )
}

function ResendTimer({ countdown, onResend, isLoading, dict }: {
  countdown: number
  onResend: () => void
  isLoading: boolean
  dict: Translation
}) {
  return (
    <div className="text-center">
      {countdown > 0 ? (
        <span className="text-sm text-slate-500">{countdown} {dict.resendIn}</span>
      ) : (
        <button
          type="button"
          onClick={onResend}
          disabled={isLoading}
          className="text-sm text-[#2563EB] font-bold hover:underline disabled:opacity-50"
        >
          {dict.resendCode}
        </button>
      )}
    </div>
  )
}

function OtpInput({ value, onChange, dark }: { value: string; onChange: (v: string) => void; dark: boolean }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      placeholder="000000"
      autoFocus
      autoComplete="one-time-code"
      className={cn(
        "h-16 w-full rounded-xl border px-4 text-center text-3xl font-bold tracking-[0.5em] outline-none transition-all",
        "focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]",
        dark ? "bg-[#12141D] border-white/5 text-white" : "auth-input-light"
      )}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export function AuthPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>("az")
  const [dark, setDark]     = useState(true)
  const dict = translations[locale]

  const [mode, setMode]                               = useState<AuthMode>("login")
  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading]                     = useState(false)
  const [countdown, setCountdown]                     = useState(0)

  const [email, setEmail]                     = useState("")
  const [password, setPassword]               = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName]               = useState("")
  const [phone, setPhone]                     = useState("")
  const [otpCode, setOtpCode]                 = useState("")
  const [termsAccepted, setTermsAccepted]     = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES[0])
  const [phoneOpen, setPhoneOpen]             = useState(false)

  // Password validation
  const passRules = {
    isPassLength: password.length >= 8,
    isPassUpper:  /[A-Z]/.test(password),
    isPassLower:  /[a-z]/.test(password),
    isPassNumber: /[0-9]/.test(password),
  }
  const isPasswordValid = Object.values(passRules).every(Boolean)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const inputCls = cn(
    "h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all",
    "focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0 focus:border-[#2563EB]",
    dark ? "bg-[#12141D] border-white/5 text-white placeholder:text-slate-600" : "auth-input-light"
  )

  // ── Error key by status ──
  const getErrMsg = useCallback((status: number): string => {
    if (!navigator.onLine) return dict.errNoInternet ?? "İnternet bağlantısı yoxdur."
    if (status === 401) return dict.errUnauthorized ?? dict.error
    if (status === 403) return dict.errForbidden ?? dict.error
    if (status === 404) return dict.errNotFound ?? dict.error
    if (status === 429) return dict.errTooManyRequests ?? dict.error
    if (status >= 500)  return dict.errServer ?? dict.error
    return dict.errUnknown ?? dict.error
  }, [dict])

  // ── API HELPERS ──
  const apiCall = useCallback(async (path: string, body: object) => {
    if (!navigator.onLine) throw new Error(dict.errNoInternet ?? "İnternet bağlantısı yoxdur.")
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      throw new Error(getErrMsg(res.status))
    }
    return res.json()
  }, [dict, getErrMsg])

  const withLoading = useCallback(async (fn: () => Promise<void>) => {
    setIsLoading(true)
    try { await fn() }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.error
      toast({ variant: "destructive", title: dict.error, description: msg })
    }
    finally { setIsLoading(false) }
  }, [dict.error])

  const saveTokenAndRedirect = (token: string) => {
    // Migrate old token key if present
    const oldToken = localStorage.getItem("tickit_token")
    if (oldToken) { localStorage.setItem("eticksystem_token", oldToken); localStorage.removeItem("tickit_token") }
    localStorage.setItem("eticksystem_token", token)
    router.push("/dashboard")
  }

  // ── HANDLERS ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    withLoading(async () => {
      const data = await apiCall("/api/v1/auth/login", { email, password })
      saveTokenAndRedirect(data.token)
    })
  }

  const handleRegisterRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      toast({ variant: "destructive", title: dict.error, description: `${dict.agreeTo} (${dict.terms})` })
      return
    }
    withLoading(async () => {
      const fullPhone = `${selectedCountry.code}${phone.replace(/\s+/g, "")}`
      await apiCall("/api/v1/auth/request-otp", { fullName, email, phone: fullPhone, password, type: "REGISTER" })
      setCountdown(OTP_RESEND_DELAY)
      setMode("verify")
    })
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    withLoading(async () => {
      const data = await apiCall("/api/v1/auth/verify-otp", { email, code: otpCode })
      saveTokenAndRedirect(data.token)
    })
  }

  const handleForgotRequest = (e: React.FormEvent) => {
    e.preventDefault()
    withLoading(async () => {
      await apiCall("/api/v1/auth/request-otp", { email, type: "RESET" })
      setCountdown(OTP_RESEND_DELAY)
      setMode("verify-reset")
    })
  }

  const handleVerifyResetNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length < 6) return
    withLoading(async () => {
      await apiCall("/api/v1/auth/check-otp", { email, code: otpCode })
      setMode("new-password")
    })
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: dict.error, description: dict.passMismatch })
      return
    }
    withLoading(async () => {
      const data = await apiCall("/api/v1/auth/reset-password", { email, code: otpCode, newPassword: password })
      saveTokenAndRedirect(data.token)
    })
  }

  const handleResendOtp = () => {
    const isRegister = mode === "verify"
    const body = isRegister
      ? { fullName, email, phone: `${selectedCountry.code}${phone.replace(/\s+/g, "")}`, password, type: "REGISTER" }
      : { email, type: "RESET" }
    withLoading(async () => {
      await apiCall("/api/v1/auth/request-otp", body)
      setCountdown(OTP_RESEND_DELAY)
      toast({ description: "Kod göndərildi!" })
    })
  }

  return (
    <>
      <style>{`
        .auth-bg-dark { background-color: #090A0F; background-image: radial-gradient(ellipse 80% 60% at 10% 0%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(99,38,189,0.14) 0%, transparent 55%); }
        .auth-left-dark { background-color: #05060A; background-image: radial-gradient(ellipse 90% 70% at -10% 110%, rgba(37,99,235,0.28) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% -10%, rgba(99,38,189,0.15) 0%, transparent 50%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: auto, auto, 40px 40px, 40px 40px; }
        .auth-bg-light { background-color: #eef2ff; background-image: radial-gradient(ellipse 70% 55% at 5% -5%, rgba(37,99,235,0.10) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 95% 105%, rgba(139,92,246,0.08) 0%, transparent 55%); }
        .auth-left-light { background-color: #ffffff; background-image: radial-gradient(ellipse 80% 60% at -5% 105%, rgba(37,99,235,0.10) 0%, transparent 55%), radial-gradient(circle, rgba(37,99,235,0.09) 1px, transparent 1px); background-size: auto, 24px 24px; }
        .auth-orb { position: absolute; border-radius: 9999px; filter: blur(72px); pointer-events: none; animation: orb-drift 12s ease-in-out infinite alternate; }
        @keyframes orb-drift { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,-20px) scale(1.08); } }
        .auth-input-light { background-color: #ffffff !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
        .auth-input-light::placeholder { color: #94a3b8 !important; }
        .auth-input-light:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important; }
        .phone-dropdown { position: absolute; top: calc(100% + 6px); left: 0; z-index: 9999; min-width: 230px; border-radius: 14px; overflow: hidden; animation: drop-in 0.15s ease; }
        @keyframes drop-in { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div
        className={cn("flex min-h-screen items-stretch transition-all duration-300", dark ? "auth-bg-dark text-white" : "auth-bg-light text-slate-900")}
        onClick={() => phoneOpen && setPhoneOpen(false)}
      >
        {/* ── LEFT PANEL ── */}
        <div className={cn("hidden lg:flex lg:w-[45%] p-12 flex-col justify-between relative overflow-hidden border-r", dark ? "auth-left-dark border-white/5" : "auth-left-light border-slate-200/80")}>
          <div className="auth-orb" style={{ width: 340, height: 340, bottom: -70, left: -90, background: dark ? "rgba(37,99,235,0.22)" : "rgba(37,99,235,0.10)" }} />
          <div className="auth-orb" style={{ width: 210, height: 210, top: 40, right: -50, background: dark ? "rgba(99,38,189,0.18)" : "rgba(139,92,246,0.10)", animationDelay: "4s", animationDuration: "9s" }} />

          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Ticket className="text-white h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className={cn("text-xl font-bold tracking-tight", dark ? "text-white" : "text-slate-900")}>
                etick<span className="text-slate-400">system</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-widest mt-0.5 uppercase">Admin Panel</span>
            </div>
          </div>

          <div className="relative z-10 space-y-8">
            <div>
              <h2 className={cn("text-5xl font-bold leading-tight", dark ? "text-white" : "text-slate-900")}>
                {dict.heroTitle.split(dict.heroHighlight)[0]}
                <span className="text-[#2563EB]">{dict.heroHighlight}</span>
                {dict.heroTitle.split(dict.heroHighlight)[1]}
              </h2>
              <p className="mt-3 text-slate-500 text-sm leading-relaxed max-w-xs">{dict.heroSub}</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {FEATURE_CONFIG.map(({ icon: Icon, color, bg, titleKey, subKey }) => (
                <div key={titleKey} className={cn("flex items-center gap-3.5 rounded-2xl px-4 py-3.5 border transition-all", dark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10" : "bg-white/80 border-slate-200 hover:bg-white hover:shadow-md shadow-sm")}>
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", bg, color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className={cn("text-sm font-semibold leading-tight", dark ? "text-white" : "text-slate-800")}>{dict[titleKey]}</p>
                    <p className="text-xs text-slate-500">{dict[subKey]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-slate-500 text-sm font-medium">© 2026 eticksystem.com</p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 relative">

          {/* Top controls */}
          <div className="absolute top-8 right-8 flex items-center gap-3 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("h-10 px-3 flex items-center gap-1.5 rounded-full border text-sm font-semibold transition-all", dark ? "bg-[#12141D] border-white/10 text-slate-300 hover:text-white" : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm")} aria-label="Switch language">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase">{locale}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("w-28 p-1.5 rounded-xl border", dark ? "bg-[#12141D] border-white/10 text-white" : "bg-white border-slate-200 shadow-md")}>
                {(["az", "ru", "tr", "en"] as Locale[]).map((l) => (
                  <DropdownMenuItem key={l} onClick={() => setLocale(l)} className={cn("uppercase font-bold text-xs cursor-pointer flex items-center justify-between rounded-lg py-2 px-3", dark ? "focus:bg-white/10" : "focus:bg-slate-100", locale === l && (dark ? "bg-white/5 text-white" : "bg-slate-50 text-slate-900"))}>
                    {l} {locale === l && <Check className="h-3.5 w-3.5 text-[#2563EB]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
              className={cn("h-10 w-10 flex items-center justify-center rounded-full border transition-all", dark ? "bg-[#12141D] border-white/10 text-slate-400 hover:text-white" : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm")}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="w-full max-w-[420px] space-y-8 mt-12">

            {/* ── TABS ── */}
            {(mode === "login" || mode === "register") && (
              <>
                <div className={cn("flex p-1 rounded-xl border", dark ? "bg-[#12141D] border-white/5" : "bg-slate-100 border-slate-200")} role="tablist">
                  {(["login", "register"] as const).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => setMode(m)}
                      className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all", mode === m ? (dark ? "bg-[#1A1D27] text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") : "text-slate-500 hover:text-slate-400")}
                    >
                      {m === "login" ? dict.login : dict.register}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight">{mode === "login" ? dict.welcome : dict.register}</h1>
                  <p className="text-slate-500 text-sm">{mode === "login" ? dict.subtitle : "Yeni hesab yaradın"}</p>
                </div>
              </>
            )}

            {/* ── LOGIN ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" noValidate>
                <Field label={dict.email} dark={dark}>
                  <input type="email" placeholder={dict.placeholders.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </Field>
                <Field label={dict.password} dark={dark}>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder={dict.placeholders.password} className={cn(inputCls, "pr-12")} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                    <EyeBtn show={showPassword} toggle={() => setShowPassword((s) => !s)} dark={dark} />
                  </div>
                </Field>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" className={dark ? "border-slate-700 data-[state=checked]:bg-[#2563EB]" : "border-slate-300 data-[state=checked]:bg-[#2563EB]"} />
                    <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">{dict.remember}</label>
                  </div>
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-[#2563EB] font-bold hover:underline">{dict.forgotPass}</button>
                </div>
                <SubmitBtn isLoading={isLoading} label={dict.loginBtn} disabled={false} />
                <Divider dark={dark} label={dict.orContinue} />
                <SocialRow dark={dark} />
                <SwitchMode dark={dark} text={dict.noAccount} linkLabel={dict.register} onClick={() => setMode("register")} />
              </form>
            )}

            {/* ── REGISTER ── */}
            {mode === "register" && (
              <form onSubmit={handleRegisterRequest} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" noValidate>
                <Field label={dict.fullName} dark={dark}>
                  <input placeholder={dict.placeholders.fullName} className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                </Field>
                <Field label={dict.email} dark={dark}>
                  <input type="email" placeholder={dict.placeholders.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </Field>
                <Field label={dict.phone} dark={dark}>
                  <div className="flex gap-2">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setPhoneOpen((o) => !o)}
                        aria-expanded={phoneOpen}
                        aria-haspopup="listbox"
                        className={cn("h-12 w-[116px] flex items-center justify-between gap-2 rounded-xl border px-3 text-sm font-semibold transition-all", dark ? "bg-[#12141D] border-white/5 text-white hover:bg-[#1A1D27]" : "auth-input-light hover:bg-slate-50")}
                      >
                        <span className="flex items-center gap-2">
                          <FlagImg iso={selectedCountry.iso} size={20} />
                          <span className={cn("text-xs font-bold", dark ? "text-slate-200" : "text-slate-700")}>{selectedCountry.label}</span>
                        </span>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", phoneOpen && "rotate-180")} />
                      </button>
                      {phoneOpen && (
                        <div role="listbox" className={cn("phone-dropdown border shadow-2xl", dark ? "bg-[#12141D] border-white/10" : "bg-white border-slate-200")}>
                          {PHONE_COUNTRIES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              role="option"
                              aria-selected={selectedCountry.code === c.code}
                              onClick={() => { setSelectedCountry(c); setPhoneOpen(false) }}
                              className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all", dark ? "hover:bg-white/5 text-white" : "hover:bg-slate-50 text-slate-800", selectedCountry.code === c.code && (dark ? "bg-white/5" : "bg-blue-50/80"))}
                            >
                              <FlagImg iso={c.iso} size={20} />
                              <span className="font-semibold text-xs">{c.label}</span>
                              <span className={cn("ml-auto text-xs tabular-nums", dark ? "text-slate-500" : "text-slate-400")}>{c.code}</span>
                              {selectedCountry.code === c.code && <Check className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="tel" placeholder={dict.placeholders.phone} className={cn(inputCls, "flex-1")} value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
                  </div>
                </Field>
                <Field label={dict.password} dark={dark}>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder={dict.placeholders.password} className={cn(inputCls, "pr-12")} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                    <EyeBtn show={showPassword} toggle={() => setShowPassword((s) => !s)} dark={dark} />
                  </div>
                  <PasswordStrength dict={dict} dark={dark} {...passRules} />
                </Field>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox id="terms" className={dark ? "border-slate-700 data-[state=checked]:bg-[#2563EB]" : "border-slate-300 data-[state=checked]:bg-[#2563EB]"} checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c as boolean)} />
                  <label htmlFor="terms" className={cn("text-sm select-none", dark ? "text-slate-400" : "text-slate-500")}>
                    {dict.agreeTo} <span className="text-[#2563EB] font-medium cursor-pointer hover:underline">{dict.terms}</span>
                  </label>
                </div>
                <SubmitBtn isLoading={isLoading} label={dict.registerBtn} disabled={!isPasswordValid} />
                <Divider dark={dark} label={dict.orContinue} />
                <SocialRow dark={dark} />
                <SwitchMode dark={dark} text={dict.haveAccount} linkLabel={dict.login} onClick={() => setMode("login")} />
              </form>
            )}

            {/* ── VERIFY (REGISTER) ── */}
            {mode === "verify" && (
              <div className="space-y-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#2563EB]/10 text-[#2563EB]">
                  <KeyRound className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{dict.verifyTitle}</h1>
                  <p className="text-slate-500 text-sm">{dict.verifySub}<br /><b className={dark ? "text-slate-200" : "text-slate-800"}>{email}</b></p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <OtpInput value={otpCode} onChange={setOtpCode} dark={dark} />
                  <Button className="w-full h-12 font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20" disabled={isLoading || otpCode.length < 6}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : dict.verifyBtn}
                  </Button>
                  <ResendTimer countdown={countdown} onResend={handleResendOtp} isLoading={isLoading} dict={dict} />
                  <button type="button" onClick={() => setMode("register")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors">
                    <ArrowLeft className="h-4 w-4" /> {dict.back}
                  </button>
                </form>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === "forgot" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold tracking-tight">{dict.resetPassTitle}</h1>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">{dict.resetPassSub}</p>
                </div>
                <form onSubmit={handleForgotRequest} className="space-y-6" noValidate>
                  <Field label={dict.email} dark={dark}>
                    <input type="email" placeholder={dict.placeholders.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" />
                  </Field>
                  <SubmitBtn isLoading={isLoading} label={dict.sendCodeBtn} disabled={false} />
                  <button type="button" onClick={() => setMode("login")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors">
                    <ArrowLeft className="h-4 w-4" /> {dict.back}
                  </button>
                </form>
              </div>
            )}

            {/* ── VERIFY OTP (RESET) ── */}
            {mode === "verify-reset" && (
              <div className="space-y-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#2563EB]/10 text-[#2563EB]">
                  <KeyRound className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{dict.verifyTitle}</h1>
                  <p className="text-slate-500 text-sm">{dict.verifySub}<br /><b className={dark ? "text-slate-200" : "text-slate-800"}>{email}</b></p>
                </div>
                <form onSubmit={handleVerifyResetNext} className="space-y-6">
                  <OtpInput value={otpCode} onChange={setOtpCode} dark={dark} />
                  <Button className="w-full h-12 font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20" disabled={isLoading || otpCode.length < 6}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : dict.nextBtn}
                  </Button>
                  <ResendTimer countdown={countdown} onResend={handleResendOtp} isLoading={isLoading} dict={dict} />
                  <button type="button" onClick={() => setMode("forgot")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors">
                    <ArrowLeft className="h-4 w-4" /> {dict.back}
                  </button>
                </form>
              </div>
            )}

            {/* ── NEW PASSWORD ── */}
            {mode === "new-password" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold tracking-tight">{dict.resetPassTitle}</h1>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">Təhlükəsizlik üçün yeni şifrə təyin edin.</p>
                </div>
                <form onSubmit={handleResetSubmit} className="space-y-6" noValidate>
                  <Field label={dict.newPassword} dark={dark}>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder={dict.placeholders.password} className={cn(inputCls, "pr-12")} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus autoComplete="new-password" />
                      <EyeBtn show={showPassword} toggle={() => setShowPassword((s) => !s)} dark={dark} />
                    </div>
                    <PasswordStrength dict={dict} dark={dark} {...passRules} />
                  </Field>
                  <Field label={dict.confirmPassword} dark={dark}>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={dict.placeholders.password}
                        className={cn(inputCls, "pr-12", confirmPassword && password !== confirmPassword && "border-red-500 focus:ring-red-500")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <EyeBtn show={showConfirmPassword} toggle={() => setShowConfirmPassword((s) => !s)} dark={dark} />
                    </div>
                  </Field>
                  <SubmitBtn isLoading={isLoading} label={dict.updatePassBtn} disabled={!isPasswordValid || password !== confirmPassword} />
                  <button type="button" onClick={() => setMode("verify-reset")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors">
                    <ArrowLeft className="h-4 w-4" /> {dict.back}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}