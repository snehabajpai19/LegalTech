import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground lg:px-16 lg:py-24">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-1/2 right-0 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl" />
          </div>

          <h2 className="mx-auto max-w-2xl font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-balance">
              Ready to Transform Your Legal Practice?
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/80">
            <span className="text-pretty">
              Join thousands of legal professionals who are already saving hours
              every week with Legal Edge.
            </span>
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="group gap-2"
              asChild
            >
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="#contact">Schedule Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
