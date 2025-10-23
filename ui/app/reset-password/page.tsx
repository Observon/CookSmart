"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accessToken = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")
  const type = searchParams.get("type")

  useEffect(() => {
    if (!accessToken || !refreshToken || type !== "recovery") {
      setError(
        "Link inválido ou expirado. Solicite uma nova redefinição de senha."
      )
    }
  }, [accessToken, refreshToken, type])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accessToken || !refreshToken) {
      setError("Token de recuperação ausente. Solicite uma nova redefinição.")
      return
    }

    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas informadas não conferem.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError || !sessionData?.session) {
        throw new Error(sessionError?.message ?? "Não foi possível validar o token")
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        throw new Error(updateError.message)
      }

      toast.success("Senha redefinida com sucesso. Faça login novamente.")
      router.push("/")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao redefinir senha"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Redefinir Senha</h1>
          <p className="text-sm text-muted-foreground">
            Informe uma nova senha para continuar acessando sua conta.
          </p>
        </div>

        <Card className="p-6 bg-card shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </form>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Caso o link tenha expirado, volte para a tela de login e solicite uma nova redefinição.
        </div>
      </div>
    </div>
  )
}
