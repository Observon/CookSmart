"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat } from "lucide-react"
import { ForgotPasswordScreen } from "@/components/forgot-password-screen"
import { apiFetch } from "@/lib/http"
import { useAuth } from "@/context/auth-context"

export function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [view, setView] = useState<"auth" | "forgot">("auth")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { login, register, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (mode === "login") {
        await login({ email, password })
      } else {
        await register({ name, email, password, phone: phone || undefined })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível realizar a operação")
    }
  }

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"))
    setError(null)
  }

  const handleForgotPassword = () => {
    setView("forgot")
    setError(null)
  }

  const handleResetRequested = async (targetEmail: string) => {
    try {
      await apiFetch<void>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail }),
      })
    } catch (err) {
      throw err
    }
  }

  if (view === "forgot") {
    return <ForgotPasswordScreen onBack={() => setView("auth")} onResetRequested={handleResetRequested} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-balance text-foreground">CookSmart</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Calcule o custo das suas receitas e venda com lucro
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nome
              </Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base bg-card"
                required
              />
            </div>
          )}

          <div className="space-y-4">
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base bg-card"
                required
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  Telefone (opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 text-base bg-card"
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Esqueceu a senha?
          </button>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Não tem conta?" : "Já possui conta?"}{" "}
            <button type="button" onClick={toggleMode} className="text-primary font-semibold hover:underline">
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
