"use client"

import { apiClient } from "@/lib/api/client"

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename = "generated_document.pdf"
) {
  await downloadHtmlAsPdf(element.innerHTML, filename)
}

export async function downloadHtmlAsPdf(
  content: string,
  filename = "generated_document.pdf"
) {
  if (typeof window === "undefined") {
    throw new Error("PDF download is only available in the browser.")
  }

  const safeFilename = toPdfFilename(filename)
  const { data } = await apiClient.post<Blob>(
    "/api/documents/download-pdf",
    {
      content,
      filename: safeFilename,
    },
    { responseType: "blob" }
  )

  downloadBlob(data, safeFilename)
}

export function toPdfFilename(value: string) {
  const base = value
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")

  return `${base || "generated_document"}.pdf`
}

export function downloadTextFile(
  content: string,
  filename = "document.txt"
) {
  const safeFilename = filename.endsWith(".txt") ? filename : `${filename}.txt`
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = safeFilename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function toTextFilename(value: string) {
  return toPdfFilename(value).replace(/\.pdf$/i, ".txt")
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
