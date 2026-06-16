import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

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
          </div>
        </div>
      </section>
    </div>
  );
}
