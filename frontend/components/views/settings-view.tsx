"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" //
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Camera, Save, Lock, Building2, User, Loader2, CheckCircle2 } from "lucide-react"

export function SettingsView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    email: "",
    avatarUrl: ""
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
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-card/50 backdrop-blur-md p-6 rounded-[2rem] border border-border/50">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 border-2 border-primary/50 overflow-hidden">
              {form.avatarUrl ? <img src={form.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-primary" />}
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-xl text-white shadow-lg hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-black">{form.firstName} {form.lastName}</h1>
            <p className="text-sm text-muted-foreground font-medium">{form.email}</p>
          </div>
        </div>
        <Button 
          className="rounded-2xl px-8 font-bold h-12 gap-2 shadow-lg shadow-primary/20" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="animate-spin w-4 h-4" /> : success ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {success ? "Yadda saxlanıldı" : "Yadda saxla"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SHEXSI MELUMATLAR */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-md rounded-[2rem]">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Şəxsi Məlumatlar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Ad</Label>
              <Input className="rounded-xl bg-secondary/30 border-none h-12 font-bold" value={form.firstName || ""} onChange={e => setForm({...form, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Soyad</Label>
              <Input className="rounded-xl bg-secondary/30 border-none h-12 font-bold" value={form.lastName || ""} onChange={e => setForm({...form, lastName: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* TESHKILAT MELUMATLARI */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-md rounded-[2rem]">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Təşkilat</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Brend Adı (Biletlərdə görünən)</Label>
              <Input className="rounded-xl bg-secondary/30 border-none h-12 font-bold" value={form.companyName || ""} onChange={e => setForm({...form, companyName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase opacity-50 ml-1">Əlaqə nömrəsi</Label>
              <Input className="rounded-xl bg-secondary/30 border-none h-12 font-bold" value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* TEHLUKESIZLIK */}
        <Card className="md:col-span-2 border-border/50 bg-card/40 backdrop-blur-md rounded-[2rem]">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Təhlükəsizlik</CardTitle></CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-medium">Hesabınızın təhlükəsizliyini təmin etmək üçün mütəmadi olaraq şifrənizi yeniləyin.</p>
            <Button variant="secondary" className="rounded-xl font-bold h-11 gap-2">
              Şifrəni dəyişdir
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}