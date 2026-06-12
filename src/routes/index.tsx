import { createFileRoute, Link } from "@tanstack/react-router";
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
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
            SmartShield monitors live weather, predicts crop risk, and tells you exactly when to activate insurance — before the damage happens.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Get started free</Link>
          </div>
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
