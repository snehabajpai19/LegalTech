import { Upload, Cpu, FileCheck, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Documents",
    description:
      "Simply drag and drop your legal documents, contracts, or case files into Legal Edge. We support PDF, DOCX, and plain text formats.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analysis",
    description:
      "Our advanced AI models analyze your documents, extracting key information, identifying risks, and understanding the legal context.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Get Actionable Results",
    description:
      "Receive comprehensive summaries, suggested edits, risk assessments, and actionable insights within seconds.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-balance">How Legal Edge Works</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            <span className="text-pretty">
              Get started in minutes with our simple three-step process
            </span>
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-16 hidden h-0.5 w-full translate-x-1/2 bg-border lg:block">
                  <ArrowRight className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}

              <div className="relative rounded-2xl border border-border bg-card p-8">
                {/* Step number */}
                <div className="absolute -top-4 left-8 rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">
                  Step {step.step}
                </div>

                {/* Icon */}
                <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-7 w-7" />
                </div>

                {/* Content */}
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
