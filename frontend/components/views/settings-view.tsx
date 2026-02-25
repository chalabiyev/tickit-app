"use client"

import { useLocale } from "@/lib/locale-context"
import { t, type Locale } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function SettingsView() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t(locale, "profile")}</TabsTrigger>
          <TabsTrigger value="notifications">
            {t(locale, "notifications")}
          </TabsTrigger>
          <TabsTrigger value="language">{t(locale, "language")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="border-border/50 shadow-sm max-w-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground">
                {t(locale, "profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-sm text-foreground">
                  {t(locale, "fullName")}
                </Label>
                <Input
                  id="name"
                  defaultValue="Anar Kazimov"
                  className="max-w-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm text-foreground">
                  {t(locale, "email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="anar@tickit.az"
                  className="max-w-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-sm text-foreground">
                  {t(locale, "phone")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue="+994 50 123 45 67"
                  className="max-w-md"
                />
              </div>
              <Separator />
              <Button className="self-start">
                {t(locale, "saveChanges")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="border-border/50 shadow-sm max-w-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground">
                {t(locale, "notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {[
                "emailNotifications",
                "pushNotifications",
                "orderUpdates",
                "marketingEmails",
              ].map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {t(locale, key)}
                    </span>
                  </div>
                  <Switch defaultChecked={key !== "marketingEmails"} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="mt-4">
          <Card className="border-border/50 shadow-sm max-w-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground">
                {t(locale, "languagePreference")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-foreground">
                  {t(locale, "language")}
                </Label>
                <Select
                  value={locale}
                  onValueChange={(value) => setLocale(value as Locale)}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="az">Azerbaycanca</SelectItem>
                    <SelectItem value="ru">Rusca</SelectItem>
                    <SelectItem value="tr">Turkce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <Button className="self-start">
                {t(locale, "saveChanges")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
