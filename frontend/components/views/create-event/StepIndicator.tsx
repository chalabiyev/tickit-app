"use client"

import { useEffect, useRef } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"

interface StepIndicatorProps {
  currentStep: number
  steps: readonly string[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  const { locale } = useLocale()
  
  // Рефы для умного скролла
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeStepRef = useRef<HTMLDivElement>(null)

  // Эффект: Автоматически центрируем активный шаг на экране мобилки
  useEffect(() => {
    if (activeStepRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeEl = activeStepRef.current;
      
      // Высчитываем идеальную позицию, чтобы элемент был ровно по центру
      const scrollLeft = activeEl.offsetLeft - (container.offsetWidth / 2) + (activeEl.offsetWidth / 2);
      
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentStep])

  return (
    <div className="w-full relative py-2 overflow-hidden">
      
      {/* Контейнер со скрытым скроллбаром. 
        Поддерживает плавный свайп (touch) на мобилках.
      */}
      <div
        ref={scrollContainerRef}
        className="flex items-start overflow-x-auto w-full pb-8 pt-2 hide-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="flex items-center min-w-max px-2 lg:px-0 lg:mx-auto">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isActive = index === currentStep
            const isPending = index > currentStep

            return (
              <div 
                key={step} 
                className="flex items-center" 
                ref={isActive ? activeStepRef : null}
              >
                
                {/* Кружок и Текст шага */}
                <div className="relative flex flex-col items-center justify-center">
                  
                  {/* Сам кружок */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 z-10",
                      isCompleted ? "bg-primary text-primary-foreground shadow-md" :
                      isActive ? "bg-background border-2 border-primary text-primary shadow-lg scale-110 ring-4 ring-primary/10" :
                      "bg-secondary border-2 border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : (index + 1)}
                  </div>

                  {/* Подпись снизу (Абсолютное позиционирование, чтобы не ломать сетку) */}
                  <span
                    className={cn(
                      "absolute top-11 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors duration-300",
                      isActive ? "text-foreground" : "text-muted-foreground/50",
                      isCompleted && "text-foreground/80"
                    )}
                  >
                    {/* Пытаемся найти перевод, если нет - показываем сырой ключ */}
                    {t(locale, `step_${step}`) || step}
                  </span>
                </div>

                {/* Соединительная линия (между кружочками) */}
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      "h-[2px] w-10 sm:w-16 mx-2 transition-all duration-500 rounded-full",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}