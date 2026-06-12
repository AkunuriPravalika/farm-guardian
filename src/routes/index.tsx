import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, CloudRain, Sun, ShieldCheck, BellRing, BarChart3 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartShield — AI Weather Risk & Insurance for Farmers" },
      { name: "description", content: "Predict drought, heavy rainfall and heatwave risk for your farm. Get AI-powered insurance recommendations and instant alerts." },
      { property: "og:title", content: "SmartShield — Crop Weather Risk AI" },
      { property: "og:description", content: "AI-powered weather risk and insurance support for small farmers." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-sky)" }} />
        <div className="container mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sprout className="h-3.5 w-3.5 text-primary" /> AI for small farmers
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
            Shield your harvest from <span className="text-primary">unexpected weather</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground">
            SmartShield monitors live weather, predicts crop risk with AI, and tells you exactly when to activate insurance — before the damage happens.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Get started free</Link>
            <a href="#features" className="rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-muted">How it works</a>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-center text-2xl sm:text-3xl font-bold">Built for farmers, powered by AI</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: CloudRain, title: "Live weather monitoring", desc: "7-day forecast pulled for your exact farm coordinates." },
            { Icon: Sun, title: "AI risk prediction", desc: "Drought, heavy rainfall and heatwave risk scored 0–100." },
            { Icon: ShieldCheck, title: "Insurance recommendations", desc: "Clear yes/no guidance with the reason in plain language." },
            { Icon: BellRing, title: "Instant alerts", desc: "Email-style alerts logged whenever risk crosses the threshold." },
            { Icon: BarChart3, title: "Historical reports", desc: "Track every prediction and weather snapshot over time." },
            { Icon: Sprout, title: "Crop-aware", desc: "Tuned to your crop, farm size and local climate." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl p-10 text-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <h2 className="text-3xl font-bold">Start protecting your farm in 60 seconds</h2>
          <p className="mt-3 opacity-90">Create an account, add your farm location and crop, and get your first risk report.</p>
          <Link to="/auth" className="mt-6 inline-block rounded-md bg-background px-5 py-2.5 text-sm font-semibold text-primary hover:opacity-90">Create free account</Link>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SmartShield. Built with Lovable.
      </footer>
    </div>
  );
}
