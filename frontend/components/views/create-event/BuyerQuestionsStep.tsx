"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, MessageSquareText } from "lucide-react"

export interface BuyerQuestion {
  id: string
  label: string
  required: boolean
}

interface BuyerQuestionsStepProps {
  questions: BuyerQuestion[]
  setQuestions: (q: BuyerQuestion[]) => void
}

export function BuyerQuestionsStep({ questions, setQuestions }: BuyerQuestionsStepProps) {
  const { locale } = useLocale()

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { id: `q-${Date.now()}`, label: "", required: true }
    ])
  }

  const updateQuestion = (id: string, field: keyof BuyerQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-bold text-foreground">
            {t(locale, "buyerQuestions") || "Attendee Information"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(locale, "buyerQuestionsDesc") || "Ask attendees for additional information (e.g., Job Title, Company) during checkout."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl bg-secondary/10 border-border">
            <MessageSquareText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h4 className="text-base font-bold text-foreground mb-1">
              {t(locale, "noCustomQuestions") || "No custom questions"}
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              {t(locale, "defaultQuestionsInfo") || "We will only ask for Name, Email, and Phone number by default."}
            </p>
            <Button variant="outline" onClick={addQuestion} className="gap-2">
              <Plus className="h-4 w-4" /> {t(locale, "addCustomQuestion") || "Add Custom Question"}
            </Button>
          </div>
        ) : (
          <>
            {questions.map((q, index) => (
              <div key={q.id} className="flex flex-col sm:flex-row gap-4 p-5 rounded-xl border bg-card shadow-sm items-start sm:items-center relative group">
                
                <div className="flex-1 w-full flex flex-col gap-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t(locale, "questionLabel") || "Question Label"} <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    placeholder={t(locale, "questionLabelPlaceholder") || "e.g., Job Title, Company Name"} 
                    value={q.label} 
                    onChange={(e) => updateQuestion(q.id, "label", e.target.value)} 
                    className="h-11 font-medium"
                  />
                </div>

                <div className="flex items-center gap-6 mt-2 sm:mt-0 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={q.required} 
                      onCheckedChange={(val) => updateQuestion(q.id, "required", val)} 
                    />
                    <Label className="text-sm font-semibold cursor-pointer">
                      {t(locale, "requiredField") || "Required"}
                    </Label>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeQuestion(q.id)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5 gap-2 font-semibold mt-2" onClick={addQuestion}>
              <Plus className="h-5 w-5" /> {t(locale, "addAnotherQuestion") || "Add Another Question"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}