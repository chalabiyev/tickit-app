"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Save, Lock, Building2, User, Loader2, CheckCircle2, Globe, Instagram, CreditCard, Briefcase } from "lucide-react"

export function SettingsView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    email: "",
    avatarUrl: "",
    // Новые поля организации
    voen: "",
    legalAddress: "",
    responsiblePerson: "",
    extraContact: "",
    instagramUrl: "",
    websiteUrl: "",
    // Банковские данные
    iban: "",
    bankName: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("tickit_token")
        const res = await fetch("http://localhost:8080/api/v1/profile", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const data = await res.json()
        setForm(data)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchProfile()
  }, [])

  // ЛОГИКА ЗАГРУЗКИ АВАТАРКИ
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("tickit_token")
      // 1. Добавили /image в конец URL
      const res = await fetch("http://localhost:8080/api/v1/upload/image", { 
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })
      
      // 2. Парсим как JSON и берем поле .url
      const data = await res.json() 
      const imageUrl = data.url 
      
      // 3. Сохраняем полный путь (добавляем адрес сервера, если нужно)
      setForm(prev => ({ ...prev, avatarUrl: `http://localhost:8080${imageUrl}` }))
    } catch (e) {
      alert("Şəkil yüklənərkən xəta baş verdi")
    }
}

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem("tickit_token")
      await fetch("http://localhost:8080/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) { alert("Xəta baş verdi") } finally { setSaving(false) }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER С АВАТАРКОЙ */}
      <div className="flex justify-between items-center bg-card/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/50 shadow-xl shadow-black/20">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border-4 border-background overflow-hidden shadow-inner">
              {form.avatarUrl && form.avatarUrl.startsWith('http') ? (
                <img src={form.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-primary">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{form.firstName || "İstifadəçi"} {form.lastName || ""}</h1>
            <p className="text-sm text-muted-foreground font-bold opacity-70">{form.email}</p>
          </div>
        </div>
        <Button 
          className="rounded-[1.2rem] px-8 font-black h-14 gap-2 shadow-lg shadow-primary/30 text-base" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {success ? "Yadda saxlanıldı" : "Yadda saxla"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ЛИЧНЫЕ ДАННЫЕ */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-md rounded-[2.5rem]">
          <CardHeader><CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 opacity-60"><User className="w-4 h-4 text-primary" /> Şəxsi Məlumatlar</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Ad</Label>
              <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold focus:ring-2 ring-primary/20" value={form.firstName || ""} onChange={e => setForm({...form, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Soyad</Label>
              <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" value={form.lastName || ""} onChange={e => setForm({...form, lastName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Mobil Nömrə</Label>
              <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* ОРГАНИЗАЦИЯ (РАСШИРЕННО) */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-md rounded-[2.5rem]">
          <CardHeader><CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 opacity-60"><Building2 className="w-4 h-4 text-primary" /> Təşkilat Məlumatları</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Brend Adı</Label>
              <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" value={form.companyName || ""} onChange={e => setForm({...form, companyName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 opacity-50">VÖEN</Label>
                <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" value={form.voen || ""} onChange={e => setForm({...form, voen: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Məsul Şəxs</Label>
                <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" value={form.responsiblePerson || ""} onChange={e => setForm({...form, responsiblePerson: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Hüquqi Ünvan</Label>
              <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" value={form.legalAddress || ""} onChange={e => setForm({...form, legalAddress: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* СОЦСЕТИ И КОНТАКТЫ */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-md rounded-[2.5rem] md:col-span-1">
          <CardHeader><CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 opacity-60"><Globe className="w-4 h-4 text-primary" /> Onlayn Mövcudluq</CardTitle></CardHeader>
          <CardContent className="space-y-5">
             <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Vebsayt</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <Input className="pl-11 rounded-2xl bg-secondary/30 border-none h-12 font-bold" placeholder="https://..." value={form.websiteUrl || ""} onChange={e => setForm({...form, websiteUrl: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <Input className="pl-11 rounded-2xl bg-secondary/30 border-none h-12 font-bold" placeholder="@username" value={form.instagramUrl || ""} onChange={e => setForm({...form, instagramUrl: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* БАНКОВСКИЕ РЕКВИЗИТЫ */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-md rounded-[2.5rem] md:col-span-1">
          <CardHeader><CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 opacity-60"><CreditCard className="w-4 h-4 text-primary" /> Bank Rekvizitləri</CardTitle></CardHeader>
          <CardContent className="space-y-5">
             <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">Bankın Adı</Label>
              <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" value={form.bankName || ""} onChange={e => setForm({...form, bankName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-50">IBAN</Label>
              <Input className="rounded-2xl bg-secondary/30 border-none h-12 font-bold" placeholder="AZ00..." value={form.iban || ""} onChange={e => setForm({...form, iban: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* ТЕХНИЧЕСКИЙ БЛОК: БЕЗОПАСНОСТЬ */}
        <Card className="md:col-span-2 border-border/50 bg-card/40 backdrop-blur-md rounded-[2.5rem]">
          <CardHeader><CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 opacity-60"><Lock className="w-4 h-4 text-primary" /> Təhlükəsizlik</CardTitle></CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8">
            <div className="space-y-1">
              <p className="text-sm font-black">Şifrəni Yenilə</p>
              <p className="text-xs text-muted-foreground font-medium">Hesabınızın təhlükəsizliyi üçün mütəmadi olaraq şifrənizi dəyişin.</p>
            </div>
            <Button variant="secondary" className="rounded-2xl font-bold h-12 px-6 hover:bg-destructive hover:text-white transition-colors">
              Şifrəni dəyişdir
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}