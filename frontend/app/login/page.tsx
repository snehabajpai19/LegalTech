"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Scale } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const { login, error, isLoading, isAuthenticated } = useAuth()
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const nextPath = searchParams.get("next") || "/dashboard"
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath)
    }
  }, [isAuthenticated, isLoading, nextPath, router])

  useEffect(() => {
    if (!googleClientId || googleClientId === "your-client-id") {
      setLocalError("Google client ID is not configured.")
      return
    }

    let attempts = 0
    const maxAttempts = 50

    const renderGoogleButton = () => {
      if (!googleButtonRef.current) return

      if (!window.google?.accounts?.id) {
        attempts += 1
        if (attempts >= maxAttempts) {
          setLocalError("Google Sign-In could not be loaded. Please refresh and try again.")
          return
        }
        window.setTimeout(renderGoogleButton, 100)
        return
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setLocalError("Google did not return an ID token.")
            return
          }

          try {
            setIsSigningIn(true)
            setLocalError(null)
            await login(response.credential, nextPath)
          } catch {
            setIsSigningIn(false)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      googleButtonRef.current.innerHTML = ""
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 360,
      })
    }

    renderGoogleButton()
  }, [googleClientId, login, nextPath])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-serif text-2xl">Sign in to Legal Edge</CardTitle>
          <CardDescription>
            Continue with your Google account to access your legal workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div ref={googleButtonRef} className={isSigningIn || isLoading ? "pointer-events-none opacity-60" : ""} />
          </div>

          {(isSigningIn || isLoading) && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </div>
          )}

          {(localError || error) && (
            <p className="text-center text-sm text-destructive">{localError || error}</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

