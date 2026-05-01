"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth/token"
import type { AuthenticatedUser } from "@/lib/api/types"

interface AuthContextValue {
  user: AuthenticatedUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (googleIdToken: string, redirectTo?: string) => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    router.push("/login")
  }, [router])

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken()
    if (!storedToken) {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setToken(storedToken)
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      setError(getApiErrorMessage(err))
      clearStoredToken()
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(
    async (googleIdToken: string, redirectTo = "/dashboard") => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await authApi.loginWithGoogle(googleIdToken)
        setStoredToken(response.access_token)
        setToken(response.access_token)
        setUser(response.user)
        router.push(redirectTo)
      } catch (err) {
        setError(getApiErrorMessage(err))
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [router]
  )

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      error,
      isAuthenticated: Boolean(user && token),
      login,
      refreshUser,
      logout,
    }),
    [error, isLoading, login, logout, refreshUser, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
