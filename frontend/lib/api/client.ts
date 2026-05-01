"use client"

import axios, { AxiosError } from "axios"
import { clearStoredToken, getStoredToken } from "@/lib/auth/token"
import type { ApiErrorShape } from "./types"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorShape>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearStoredToken()
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login")
      }
    }
    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorShape>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).filter(Boolean).join(", ")
    }
    if (error.response?.status) return `Request failed with status ${error.response.status}.`
  }
  return "Something went wrong. Please try again."
}

