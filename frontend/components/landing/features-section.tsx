import {
  MessageSquare,
  FileText,
  FilePlus,
  Search,
  Shield,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: MessageSquare,
    title: "AI Legal Chatbot",
    description:
      "Get instant answers to legal questions with our AI assistant trained on millions of legal documents and case law.",
  },
  {
    icon: FileText,
    title: "Document Summarizer",
    description:
      "Upload contracts, briefs, or legal documents and receive comprehensive summaries in seconds.",
  },
  {
    icon: FilePlus,
    title: "Contract Generator",
    description:
      "Generate professional legal documents from customizable templates with AI-assisted clause suggestions.",
  },
  {
    icon: Search,
    title: "Legal Research",
    description:
      "Search through case law, statutes, and legal precedents with intelligent semantic search.",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description:
      "Enterprise-grade security with SOC 2 compliance, end-to-end encryption, and data privacy guarantees.",
  },
  {
    icon: Zap,
    title: "Real-time Collaboration",
    description:
      "Work together with your team on documents with real-time editing and commenting features.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-balance">
              Everything You Need to Practice Law Smarter
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            <span className="text-pretty">
              Our comprehensive suite of AI tools is designed specifically for
              legal professionals who value accuracy and efficiency.
            </span>
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/50 bg-card/50 transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
            >
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
