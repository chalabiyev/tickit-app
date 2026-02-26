"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number;
  steps: readonly string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  const { locale } = useLocale()
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors", 
              index < currentStep ? "bg-primary text-primary-foreground" : index === currentStep ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className={cn("hidden text-sm font-medium xl:inline", index === currentStep ? "text-foreground" : "text-muted-foreground")}>
              {t(locale, step) || step}
            </span>
          </div>
          {index < steps.length - 1 && <div className={cn("h-px w-4 sm:w-8", index < currentStep ? "bg-primary" : "bg-border")} />}
        </div>
      ))}
    </div>
  )
}