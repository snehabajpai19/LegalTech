import { Brain, Database, Lock, Cloud } from "lucide-react"

const technologies = [
  {
    icon: Brain,
    name: "Advanced AI Models",
    description: "Powered by state-of-the-art language models fine-tuned for legal applications",
  },
  {
    icon: Database,
    name: "Legal Database",
    description: "Access to millions of case law records, statutes, and legal precedents",
  },
  {
    icon: Lock,
    name: "Enterprise Security",
    description: "SOC 2 Type II certified with end-to-end encryption and GDPR compliance",
  },
  {
    icon: Cloud,
    name: "Cloud Infrastructure",
    description: "Scalable, reliable infrastructure with 99.9% uptime guarantee",
  },
]

export function TechStackSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left side - Content */}
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-balance">
                Built with Enterprise-Grade Technology
              </span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              <span className="text-pretty">
                Legal Edge is built on a foundation of cutting-edge technology,
                ensuring reliability, security, and performance that meets the
                demanding needs of legal professionals.
              </span>
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {technologies.map((tech) => (
                <div key={tech.name} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <tech.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{tech.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tech.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-md">
              {/* Background shapes */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
              
              {/* Card mockup */}
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-3 w-3 rounded-full bg-destructive/50" />
                  <div className="h-3 w-3 rounded-full bg-accent/50" />
                  <div className="h-3 w-3 rounded-full bg-green-500/50" />
                </div>
                <div className="mt-6 space-y-4">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
                <div className="mt-8 flex gap-3">
                  <div className="h-10 flex-1 rounded-lg bg-primary/20" />
                  <div className="h-10 w-24 rounded-lg bg-accent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
