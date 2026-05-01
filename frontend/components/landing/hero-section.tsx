import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">
              AI-Powered Legal Technology
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            <span className="text-balance">
              Transform Your Legal Workflow with{" "}
              <span className="text-primary">Intelligent AI</span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground lg:text-xl">
            <span className="text-pretty">
              Legal Edge combines cutting-edge AI with legal expertise to help
              attorneys draft documents, analyze contracts, and research case law
              in minutes, not hours.
            </span>
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="group gap-2" asChild>
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See How It Works</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-16 border-t border-border pt-8">
            <p className="mb-6 text-sm text-muted-foreground">
              Trusted by legal professionals worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <div className="font-serif text-lg font-semibold">Baker & Associates</div>
              <div className="font-serif text-lg font-semibold">Sterling Law</div>
              <div className="font-serif text-lg font-semibold">Morrison Partners</div>
              <div className="font-serif text-lg font-semibold">Crown Legal</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
