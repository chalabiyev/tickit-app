"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Copy, Tag } from "lucide-react"

interface Promocode {
  id: number
  code: string
  discount: string
  used: number
  total: number
  expires: string | null
  active: boolean
}

const promocodes: Promocode[] = [
  { id: 1, code: "JAZZ2026", discount: "20%", used: 24, total: 50, expires: "2026-03-15", active: true },
  { id: 2, code: "EARLYBIRD", discount: "15%", used: 89, total: 100, expires: "2026-04-01", active: true },
  { id: 3, code: "TECHVIP", discount: "30%", used: 12, total: 30, expires: "2026-04-22", active: true },
  { id: 4, code: "STANDUP10", discount: "10%", used: 45, total: 60, expires: null, active: true },
  { id: 5, code: "FRIENDS25", discount: "25%", used: 8, total: 20, expires: "2026-05-01", active: true },
  { id: 6, code: "WELCOME", discount: "10%", used: 200, total: 200, expires: null, active: false },
]

export function PromocodesView() {
  const { locale } = useLocale()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t(locale, "promocodes")}
        </h2>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t(locale, "createCode")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {promocodes.map((promo) => {
          const percentage = Math.round((promo.used / promo.total) * 100)
          return (
            <Card
              key={promo.id}
              className="border-border/50 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {promo.code}
                        </span>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy code</span>
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t(locale, "discount")}: {promo.discount}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={promo.active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {promo.active ? t(locale, "active") : t(locale, "past")}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t(locale, "usage")}
                    </span>
                    <span className="font-medium text-foreground">
                      {promo.used}{t(locale, "of")}{promo.total}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>

                <div className="text-xs text-muted-foreground">
                  {promo.expires
                    ? `${t(locale, "expiresOn")}: ${promo.expires}`
                    : t(locale, "noExpiry")}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
