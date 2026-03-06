"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Ticket, Eye, EyeOff, KeyRound, ArrowLeft,
  Loader2, Globe, Sun, Moon, Check,
  Zap, ShieldCheck, BarChart3, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────
const translations = {
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
    placeholders: { fullName: "Ad Soyadınızı daxil edin", email: "sizin@email.com", phone: "XX XXX XX XX", password: "Şifrənizi daxil edin" }
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
    placeholders: { fullName: "Введите Имя и Фамилию", email: "ваш@email.com", phone: "XX XXX XX XX", password: "Введите пароль" }
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
    placeholders: { fullName: "Ad Soyadınızı girin", email: "sizin@email.com", phone: "XX XXX XX XX", password: "Şifrenizi girin" }
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
    placeholders: { fullName: "Enter your Full Name", email: "your@email.com", phone: "XX XXX XX XX", password: "Enter your password" }
  }
}
type Locale = "az" | "ru" | "tr" | "en"

// ─────────────────────────────────────────────
// ICONS & DATA
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
const PHONE_COUNTRIES = [
  { code: "+994", iso: "az", label: "AZ" }, { code: "+7",   iso: "ru", label: "RU" },
  { code: "+90",  iso: "tr", label: "TR" }, { code: "+1",   iso: "us", label: "US" },
  { code: "+44",  iso: "gb", label: "GB" }, { code: "+49",  iso: "de", label: "DE" },
  { code: "+33",  iso: "fr", label: "FR" }, { code: "+971", iso: "ae", label: "AE" },
]
function FlagImg({ iso, size = 20 }: { iso?: string; size?: number }) {
  const safeIso = (iso ?? "az").toLowerCase()
  return <img src={`https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${safeIso}.png`} srcSet={`https://flagcdn.com/${size * 2}x${Math.round(size * 0.75 * 2)}/${safeIso}.png 2x`} width={size} height={Math.round(size * 0.75)} alt={safeIso.toUpperCase()} className="rounded-sm object-cover shrink-0" style={{ display: "inline-block" }} />
}
const FEATURE_CONFIG = [
  { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", titleKey: "feat1Title" as const, subKey: "feat1Sub" as const },
  { icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10", titleKey: "feat2Title" as const, subKey: "feat2Sub" as const },
  { icon: ShieldCheck, color: "text-blue-400", bg: "bg-blue-500/10", titleKey: "feat3Title" as const, subKey: "feat3Sub" as const },
]

export function AuthPage() {
  const router = useRouter()
  const [locale, setLocale]   = useState<Locale>("az")
  const [theme, setTheme]     = useState<"dark" | "light">("dark")
  
  const dict = translations[locale] || translations.az
  const dark = theme === "dark"

  const [mode, setMode] = useState<"login" | "register" | "verify" | "forgot" | "verify-reset" | "new-password">("login")
  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading]                     = useState(false)
  const [countdown, setCountdown]                     = useState(0)
  
  const [email, setEmail]                     = useState("")
  const [password, setPassword]               = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName]               = useState("")
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES[0])
  const [phoneOpen, setPhoneOpen]             = useState(false)
  const [phone, setPhone]                     = useState("")
  const [otpCode, setOtpCode]                 = useState("")
  const [termsAccepted, setTermsAccepted]     = useState(false)

  // ── PASSWORD VALIDATION LOGIC ──
  const isPassLength = password.length >= 8;
  const isPassUpper = /[A-Z]/.test(password);
  const isPassLower = /[a-z]/.test(password);
  const isPassNumber = /[0-9]/.test(password);
  const isPasswordValid = isPassLength && isPassUpper && isPassLower && isPassNumber;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // ── API HANDLERS ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true)
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error("E-poçt və ya şifrə yanlışdır")
      const data = await res.json()
      localStorage.setItem("tickit_token", data.token)
      router.push("/dashboard")
    } catch (err: any) { toast({ variant: "destructive", title: dict.error, description: err.message }) } 
    finally { setIsLoading(false) }
  }

  const handleRegisterRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) { toast({ variant: "destructive", title: dict.error, description: dict.agreeTo + " (" + dict.terms + ")" }); return }
    setIsLoading(true)
    try {
      const fullPhone = `${selectedCountry.code}${phone.replace(/\s+/g, "")}`
      const res = await fetch("http://localhost:8080/api/v1/auth/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone: fullPhone, password, type: "REGISTER" })
      })
      if (!res.ok) throw new Error(await res.text())
      setCountdown(10)
      setMode("verify")
    } catch (err: any) { toast({ variant: "destructive", title: dict.error, description: err.message }) } 
    finally { setIsLoading(false) }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true)
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otpCode })
      })
      if (!res.ok) throw new Error("Kod yanlışdır")
      const data = await res.json()
      localStorage.setItem("tickit_token", data.token)
      router.push("/dashboard")
    } catch (err: any) { toast({ variant: "destructive", title: dict.error, description: err.message }) } 
    finally { setIsLoading(false) }
  }

  // ── FORGOT PASSWORD FLOW ──
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true)
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, type: "RESET" })
      })
      if (!res.ok) throw new Error(await res.text())
      setCountdown(10)
      setMode("verify-reset")
    } catch (err: any) { toast({ variant: "destructive", title: dict.error, description: err.message }) } 
    finally { setIsLoading(false) }
  }

  const handleVerifyResetNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/check-otp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otpCode })
      })
      if (!res.ok) throw new Error("Kod yanlışdır və ya vaxtı bitib") 
      setMode("new-password"); 
    } catch (err: any) {
      toast({ variant: "destructive", title: dict.error, description: err.message })
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast({ variant: "destructive", title: dict.error, description: dict.passMismatch }); return; }
    setIsLoading(true)
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, newPassword: password })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      localStorage.setItem("tickit_token", data.token)
      toast({ title: "Uğurlu", description: "Şifrə yeniləndi!" })
      router.push("/dashboard")
    } catch (err: any) { toast({ variant: "destructive", title: dict.error, description: err.message }) } 
    finally { setIsLoading(false) }
  }

  // ── RESEND OTP ──
  const handleResendOtp = async () => {
    setIsLoading(true)
    try {
      const type = mode === "verify" ? "REGISTER" : "RESET";
      const payload = type === "REGISTER" 
        ? { fullName, email, phone: `${selectedCountry.code}${phone.replace(/\s+/g, "")}`, password, type } 
        : { email, type };

      const res = await fetch("http://localhost:8080/api/v1/auth/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      setCountdown(10)
      toast({ description: "Kod göndərildi!" })
    } catch (err: any) { toast({ variant: "destructive", title: dict.error, description: err.message }) } 
    finally { setIsLoading(false) }
  }

  // ── INPUT CLASS ──
  const inputCls = cn(
    "h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all",
    "focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0 focus:border-[#2563EB]",
    dark ? "bg-[#12141D] border-white/5 text-white placeholder:text-slate-600" : "auth-input-light"
  )

  return (
    <>
      <style>{`
        .auth-bg-dark { background-color: #090A0F; background-image: radial-gradient(ellipse 80% 60% at 10% 0%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(99,38,189,0.14) 0%, transparent 55%); }
        .auth-left-dark { background-color: #05060A; background-image: radial-gradient(ellipse 90% 70% at -10% 110%, rgba(37,99,235,0.28) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% -10%, rgba(99,38,189,0.15) 0%, transparent 50%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: auto, auto, 40px 40px, 40px 40px; }
        .auth-bg-light { background-color: #eef2ff; background-image: radial-gradient(ellipse 70% 55% at 5% -5%, rgba(37,99,235,0.10) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 95% 105%, rgba(139,92,246,0.08) 0%, transparent 55%); }
        .auth-left-light { background-color: #ffffff; background-image: radial-gradient(ellipse 80% 60% at -5% 105%, rgba(37,99,235,0.10) 0%, transparent 55%), radial-gradient(circle, rgba(37,99,235,0.09) 1px, transparent 1px); background-size: auto, 24px 24px; }
        .auth-orb { position: absolute; border-radius: 9999px; filter: blur(72px); pointer-events: none; animation: orb-drift 12s ease-in-out infinite alternate; }
        @keyframes orb-drift { from { transform: translate(0, 0) scale(1); } to   { transform: translate(20px, -20px) scale(1.08); } }
        .auth-input-light { background-color: #ffffff !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
        .auth-input-light::placeholder { color: #94a3b8 !important; }
        .auth-input-light:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important; background-color: #ffffff !important; }
        .phone-dropdown { position: absolute; top: calc(100% + 6px); left: 0; z-index: 9999; min-width: 230px; border-radius: 14px; overflow: hidden; animation: drop-in 0.15s ease; }
        @keyframes drop-in { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to   { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div className={cn("flex min-h-screen items-stretch transition-all duration-300 font-sans", dark ? "auth-bg-dark text-white" : "auth-bg-light text-slate-900")} onClick={() => phoneOpen && setPhoneOpen(false)}>
        {/* LEFT PANEL */}
        <div className={cn("hidden lg:flex lg:w-[45%] p-12 flex-col justify-between relative overflow-hidden border-r", dark ? "auth-left-dark border-white/5" : "auth-left-light border-slate-200/80")}>
          <div className="auth-orb" style={{ width: 340, height: 340, bottom: -70, left: -90, background: dark ? "rgba(37,99,235,0.22)" : "rgba(37,99,235,0.10)" }} />
          <div className="auth-orb" style={{ width: 210, height: 210, top: 40, right: -50, background: dark ? "rgba(99,38,189,0.18)" : "rgba(139,92,246,0.10)", animationDelay: "4s", animationDuration: "9s" }} />

          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Ticket className="text-white h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className={cn("text-xl font-bold tracking-tight", dark ? "text-white" : "text-slate-900")}>etick<span className="text-slate-400">system</span></span>
              <span className="text-[10px] font-bold text-slate-500 tracking-widest mt-0.5 uppercase">Admin Panel</span>
            </div>
          </div>

          <div className="relative z-10 space-y-8">
            <div>
              <h2 className={cn("text-5xl font-bold leading-tight", dark ? "text-white" : "text-slate-900")}>
                {dict.heroTitle.split(dict.heroHighlight)[0]}<span className="text-[#2563EB]">{dict.heroHighlight}</span>{dict.heroTitle.split(dict.heroHighlight)[1]}
              </h2>
              <p className="mt-3 text-slate-500 text-sm leading-relaxed max-w-xs">{dict.heroSub}</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {FEATURE_CONFIG.map(({ icon: Icon, color, bg, titleKey, subKey }) => (
                <div key={titleKey} className={cn("flex items-center gap-3.5 rounded-2xl px-4 py-3.5 border transition-all cursor-default", dark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10" : "bg-white/80 border-slate-200 hover:bg-white hover:shadow-md shadow-sm")}>
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", bg, color)}><Icon className="h-4 w-4" /></div>
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

        {/* RIGHT PANEL */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 relative">

          {/* Top tools */}
          <div className="absolute top-8 right-8 flex items-center gap-3 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("h-10 px-3 flex items-center gap-1.5 rounded-full border text-sm font-semibold transition-all", dark ? "bg-[#12141D] border-white/10 text-slate-300 hover:text-white" : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm")}>
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

            <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} className={cn("h-10 w-10 flex items-center justify-center rounded-full border transition-all", dark ? "bg-[#12141D] border-white/10 text-slate-400 hover:text-white" : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm")}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="w-full max-w-[420px] space-y-8 mt-12">
            
            {/* TABS FOR LOGIN/REGISTER */}
            {(mode === "login" || mode === "register") && (
              <>
                <div className={cn("flex p-1 rounded-xl border", dark ? "bg-[#12141D] border-white/5" : "bg-slate-100 border-slate-200")}>
                  {(["login", "register"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all", mode === m ? (dark ? "bg-[#1A1D27] text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") : "text-slate-500 hover:text-slate-400")}>
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

            {/* ── LOGIN FORM ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Field label={dict.email} dark={dark}>
                  <input type="email" placeholder={dict.placeholders.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Field>
                <Field label={dict.password} dark={dark}>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder={dict.placeholders.password} className={cn(inputCls, "pr-12")} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <EyeBtn show={showPassword} toggle={() => setShowPassword(!showPassword)} dark={dark} />
                  </div>
                </Field>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" className={dark ? "border-slate-700 data-[state=checked]:bg-[#2563EB]" : "border-slate-300 data-[state=checked]:bg-[#2563EB]"} />
                    <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer">{dict.remember}</label>
                  </div>
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-[#2563EB] font-bold hover:underline">{dict.forgotPass}</button>
                </div>
                <SubmitBtn isLoading={isLoading} label={dict.loginBtn} disabled={false} />
                <Divider dark={dark} label={dict.orContinue} />
                <SocialRow dark={dark} />
                <SwitchMode dark={dark} text={dict.noAccount} linkLabel={dict.register} onClick={() => setMode("register")} />
              </form>
            )}

            {/* ── REGISTER FORM ── */}
            {mode === "register" && (
              <form onSubmit={handleRegisterRequest} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Field label={dict.fullName} dark={dark}><input placeholder={dict.placeholders.fullName} className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
                <Field label={dict.email} dark={dark}><input type="email" placeholder={dict.placeholders.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
                <Field label={dict.phone} dark={dark}>
                  <div className="flex gap-2">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => setPhoneOpen(!phoneOpen)} className={cn("h-12 w-[116px] flex items-center justify-between gap-2 rounded-xl border px-3 text-sm font-semibold transition-all", dark ? "bg-[#12141D] border-white/5 text-white hover:bg-[#1A1D27]" : "auth-input-light hover:bg-slate-50 shadow-sm")}>
                        <span className="flex items-center gap-2"><FlagImg iso={selectedCountry.iso} size={20} /><span className={cn("text-xs font-bold", dark ? "text-slate-200" : "text-slate-700")}>{selectedCountry.label}</span></span>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", phoneOpen && "rotate-180")} />
                      </button>
                      {phoneOpen && (
                        <div className={cn("phone-dropdown border shadow-2xl", dark ? "bg-[#12141D] border-white/10" : "bg-white border-slate-200")}>
                          {PHONE_COUNTRIES.map((c) => (
                            <button key={c.code} type="button" onClick={() => { setSelectedCountry(c); setPhoneOpen(false) }} className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all", dark ? "hover:bg-white/5 text-white" : "hover:bg-slate-50 text-slate-800", selectedCountry.code === c.code && (dark ? "bg-white/5" : "bg-blue-50/80"))}>
                              <FlagImg iso={c.iso} size={20} />
                              <span className="font-semibold text-xs">{c.label}</span><span className={cn("ml-auto text-xs tabular-nums", dark ? "text-slate-500" : "text-slate-400")}>{c.code}</span>
                              {selectedCountry.code === c.code && <Check className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="tel" placeholder={dict.placeholders.phone} className={cn(inputCls, "flex-1")} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                </Field>
                <Field label={dict.password} dark={dark}>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder={dict.placeholders.password} className={cn(inputCls, "pr-12")} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <EyeBtn show={showPassword} toggle={() => setShowPassword(!showPassword)} dark={dark} />
                  </div>
                  <PasswordStrength dict={dict} dark={dark} isPassLength={isPassLength} isPassUpper={isPassUpper} isPassLower={isPassLower} isPassNumber={isPassNumber} />
                </Field>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox id="terms" className={dark ? "border-slate-700 data-[state=checked]:bg-[#2563EB]" : "border-slate-300 data-[state=checked]:bg-[#2563EB]"} checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c as boolean)} />
                  <label htmlFor="terms" className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>{dict.agreeTo} <span className="text-[#2563EB] font-medium cursor-pointer hover:underline">{dict.terms}</span></label>
                </div>
                <SubmitBtn isLoading={isLoading} label={dict.registerBtn} disabled={!isPasswordValid} />
                <Divider dark={dark} label={dict.orContinue} />
                <SocialRow dark={dark} />
                <SwitchMode dark={dark} text={dict.haveAccount} linkLabel={dict.login} onClick={() => setMode("login")} />
              </form>
            )}

            {/* ── VERIFY (OTP FOR REGISTER) ── */}
            {mode === "verify" && (
              <div className="space-y-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#2563EB]/10 text-[#2563EB]"><KeyRound className="h-10 w-10" /></div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{dict.verifyTitle}</h1>
                  <p className="text-slate-500 text-sm">{dict.verifySub}<br /><b className={dark ? "text-slate-200" : "text-slate-800"}>{email}</b></p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <input type="text" maxLength={6} placeholder="000000" className={cn("h-16 w-full rounded-xl border px-4 text-center text-3xl font-bold tracking-[0.5em] outline-none transition-all", "focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]", dark ? "bg-[#12141D] border-white/5 text-white" : "auth-input-light")} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} autoFocus />
                  <Button className="w-full h-12 font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20" disabled={isLoading || otpCode.length < 6}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : dict.verifyBtn}
                  </Button>
                  
                  {/* Resend Code Timer */}
                  <div className="text-center mt-2">
                    {countdown > 0 ? (
                      <span className="text-sm text-slate-500">{countdown} {dict.resendIn}</span>
                    ) : (
                      <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-sm text-[#2563EB] font-bold hover:underline">
                        {dict.resendCode}
                      </button>
                    )}
                  </div>

                  <button type="button" onClick={() => setMode("register")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors"><ArrowLeft className="h-4 w-4" /> {dict.back}</button>
                </form>
              </div>
            )}

            {/* ── FORGOT PASSWORD (EMAIL INPUT) ── */}
            {mode === "forgot" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold tracking-tight">{dict.resetPassTitle}</h1>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">{dict.resetPassSub}</p>
                </div>
                <form onSubmit={handleForgotRequest} className="space-y-6">
                  <Field label={dict.email} dark={dark}>
                    <input type="email" placeholder={dict.placeholders.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                  </Field>
                  <SubmitBtn isLoading={isLoading} label={dict.sendCodeBtn} disabled={false} />
                  <button type="button" onClick={() => setMode("login")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors"><ArrowLeft className="h-4 w-4" /> {dict.back}</button>
                </form>
              </div>
            )}

            {/* ── VERIFY OTP (FOR PASSWORD RESET) ── */}
            {mode === "verify-reset" && (
              <div className="space-y-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#2563EB]/10 text-[#2563EB]"><KeyRound className="h-10 w-10" /></div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{dict.verifyTitle}</h1>
                  <p className="text-slate-500 text-sm">{dict.verifySub}<br /><b className={dark ? "text-slate-200" : "text-slate-800"}>{email}</b></p>
                </div>
                <form onSubmit={handleVerifyResetNext} className="space-y-6">
                  <input type="text" maxLength={6} placeholder="000000" className={cn("h-16 w-full rounded-xl border px-4 text-center text-3xl font-bold tracking-[0.5em] outline-none transition-all", "focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]", dark ? "bg-[#12141D] border-white/5 text-white" : "auth-input-light")} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} autoFocus />
                  <Button className="w-full h-12 font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20" disabled={isLoading || otpCode.length < 6}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : dict.nextBtn}
                  </Button>
                  
                  {/* Resend Code Timer */}
                  <div className="text-center mt-2">
                    {countdown > 0 ? (
                      <span className="text-sm text-slate-500">{countdown} {dict.resendIn}</span>
                    ) : (
                      <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-sm text-[#2563EB] font-bold hover:underline">
                        {dict.resendCode}
                      </button>
                    )}
                  </div>

                  <button type="button" onClick={() => setMode("forgot")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors"><ArrowLeft className="h-4 w-4" /> {dict.back}</button>
                </form>
              </div>
            )}

            {/* ── NEW PASSWORD (AFTER OTP) ── */}
            {mode === "new-password" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold tracking-tight">{dict.resetPassTitle}</h1>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">Təhlükəsizlik üçün yeni şifrə təyin edin.</p>
                </div>
                <form onSubmit={handleResetSubmit} className="space-y-6">
                  <Field label={dict.newPassword} dark={dark}>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder={dict.placeholders.password} className={cn(inputCls, "pr-12")} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                      <EyeBtn show={showPassword} toggle={() => setShowPassword(!showPassword)} dark={dark} />
                    </div>
                    <PasswordStrength dict={dict} dark={dark} isPassLength={isPassLength} isPassUpper={isPassUpper} isPassLower={isPassLower} isPassNumber={isPassNumber} />
                  </Field>
                  <Field label={dict.confirmPassword} dark={dark}>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} placeholder={dict.placeholders.password} className={cn(inputCls, "pr-12", confirmPassword && password !== confirmPassword && "border-red-500 focus:ring-red-500")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                      <EyeBtn show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} dark={dark} />
                    </div>
                  </Field>
                  <SubmitBtn isLoading={isLoading} label={dict.updatePassBtn} disabled={!isPasswordValid || password !== confirmPassword} />
                  <button type="button" onClick={() => setMode("verify-reset")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] mx-auto transition-colors"><ArrowLeft className="h-4 w-4" /> {dict.back}</button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// REUSABLE SUB-COMPONENTS
// ─────────────────────────────────────────────
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
    <button type="button" onClick={toggle} className={cn("absolute right-4 top-3.5 transition-colors", dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700")}>
      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  )
}

function PasswordStrength({ dict, dark, isPassLength, isPassUpper, isPassLower, isPassNumber }: any) {
  const rules = [
    { id: 1, text: dict.passMinLength, valid: isPassLength },
    { id: 2, text: dict.passUpper, valid: isPassUpper },
    { id: 3, text: dict.passLower, valid: isPassLower },
    { id: 4, text: dict.passNumber, valid: isPassNumber },
  ]
  return (
    <div className="mt-2 space-y-1.5">
      {rules.map((r) => (
        <div key={r.id} className="flex items-center gap-2 text-xs">
          {r.valid ? (
            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          ) : (
            <div className={cn("h-1.5 w-1.5 rounded-full ml-1 shrink-0", dark ? "bg-slate-700" : "bg-slate-300")} />
          )}
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
    <Button type="submit" className="w-full h-12 font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20" disabled={isLoading || disabled}>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : label}
    </Button>
  )
}

function Divider({ dark, label }: { dark: boolean; label: string }) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center"><span className={cn("w-full border-t", dark ? "border-slate-800" : "border-slate-200")} /></div>
      <div className="relative flex justify-center text-xs uppercase"><span className={cn("px-2 text-slate-500", dark ? "bg-[#090A0F]" : "bg-[#eef2ff]")}>{label}</span></div>
    </div>
  )
}

function SocialRow({ dark }: { dark: boolean }) {
  const btnCls = cn("h-11 flex-1 flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all", dark ? "bg-[#12141D] border-white/5 hover:bg-[#1A1D27] text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm")
  return (
    <div className="flex gap-3">
      <button type="button" className={btnCls}><GoogleIcon className="h-4 w-4 shrink-0" />Google</button>
      <button type="button" className={btnCls}><AppleIcon className="h-4 w-4 shrink-0" />Apple</button>
    </div>
  )
}

function SwitchMode({ dark, text, linkLabel, onClick }: { dark: boolean; text: string; linkLabel: string; onClick: () => void }) {
  return (
    <p className="text-center text-sm text-slate-500 pt-2">{text}<button type="button" onClick={onClick} className="text-[#2563EB] font-bold ml-1 hover:underline">{linkLabel}</button></p>
  )
}