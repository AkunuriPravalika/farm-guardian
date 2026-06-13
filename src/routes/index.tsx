import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Cloud, Brain, Gauge, ShieldCheck, BellRing } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartShield — AI Weather Insurance for Small Farmers" },
      { name: "description", content: "Predict drought, heavy rainfall and heatwave risk for your farm. Get AI-powered insurance recommendations and instant alerts." },
      { property: "og:title", content: "SmartShield — AI Weather Insurance for Small Farmers" },
      { property: "og:description", content: "Weather monitoring → AI risk prediction → Insurance recommendation → Farmer alerts → Historical reports." },
    ],
  }),
  component: Home,
});

const flow = [
  { icon: Cloud, label: "Weather Monitoring" },
  { icon: Brain, label: "AI Risk Prediction" },
  { icon: ShieldCheck, label: "Insurance Recommendation" },
  { icon: BellRing, label: "Farmer Alerts" },
  { icon: Gauge, label: "Historical Reports" },
];

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-sky)" }} />
        <div className="container mx-auto px-4 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            SmartShield: <span className="text-primary">AI Weather Insurance</span> for Small Farmers
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground">
            SmartShield monitors live weather, predicts crop risk, and tells you exactly when to activate insurance — before the damage happens.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Get started free</Link>
            <Link to="/architecture" className="rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-muted">View architecture</Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">The SmartShield Workflow</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {flow.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{s.label}</span>
              </div>
              {i < flow.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
