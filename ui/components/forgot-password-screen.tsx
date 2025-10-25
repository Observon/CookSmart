"use client"

import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ForgotPasswordScreenProps {
  onBack: () => void
  onResetRequested: (email: string) => Promise<void>
}

export function ForgotPasswordScreen({ onBack, onResetRequested }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      setError("Digite um email válido")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onResetRequested(normalizedEmail)
      setEmail(normalizedEmail)
      setIsSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível enviar o email de recuperação"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
        <div className="w-full max-w-sm space-y-8">
          {/* Success Icon */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-balance text-foreground">Email Enviado!</h1>
            <p className="text-base text-muted-foreground text-pretty">
              Enviamos um link de recuperação para <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          {/* Instructions */}
          <Card className="p-5 bg-muted/50">
            <p className="text-sm text-muted-foreground mb-3">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <p className="text-xs text-muted-foreground">
              Não recebeu o email? Verifique a pasta de spam ou tente novamente em alguns minutos.
            </p>
          </Card>

          {/* Back to Login */}
          <Button onClick={onBack} variant="outline" className="w-full h-12 text-base font-semibold bg-transparent">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-balance text-foreground">Esqueceu a Senha?</h1>
          <p className="text-base text-muted-foreground text-pretty">
            Sem problemas! Digite seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base bg-card"
              disabled={isSubmitting}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Link de Recuperação"}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  )
}
