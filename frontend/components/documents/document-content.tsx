"use client"

import { cn } from "@/lib/utils"

export function containsHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content)
}

const documentClassName =
  "font-serif text-sm leading-7 text-foreground [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-3 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1 [&_strong]:font-semibold [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_th]:font-semibold"

export function DocumentContent({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  if (containsHtml(content)) {
    return (
      <div
        className={cn(documentClassName, className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div className={cn(documentClassName, "whitespace-pre-wrap", className)}>
      {content}
    </div>
  )
}

