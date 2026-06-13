import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Brain, Gauge, ShieldCheck, BellRing, Database, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — SmartShield" },
      { name: "description", content: "End-to-end SmartShield workflow: weather data, AI risk engine, insurance recommendations and farmer alerts." },
    ],
  }),
  component: Architecture,
});

const steps = [
  { icon: Cloud, title: "Weather Data", desc: "Open-Meteo API + stored 7-day forecast per farm coordinate." },
  { icon: Brain, title: "AI Risk Engine", desc: "Gemini via Lovable AI Gateway with deterministic crop-aware fallback." },
  { icon: Gauge, title: "Risk Score Generation", desc: "0–100 score, level (low/moderate/high/critical), risk type, contributions." },
  { icon: ShieldCheck, title: "Insurance Recommendation", desc: "Threshold-based activation with coverage estimate in INR." },
  { icon: BellRing, title: "Alerts & Reports", desc: "Alert log + historical analytics, charts and admin dashboard." },
];

function Architecture() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">System Architecture</h1>
        <p className="text-muted-foreground mb-8">
          SmartShield: AI Weather Insurance for Small Farmers. The pipeline below runs every time a
          farmer requests analysis or when scheduled checks run.
        </p>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={s.title}>
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary"><s.icon className="h-5 w-5" /></div>
                  <CardTitle className="text-lg">{i + 1}. {s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{s.desc}</CardContent>
              </Card>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>
              )}
            </div>
          ))}
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Data Model</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>profiles</strong> — farmer details, coordinates, crop, farm size.</p>
            <p><strong>weather_readings</strong> — current + 7-day forecast per fetch.</p>
            <p><strong>risk_predictions</strong> — AI output: score, level, type, explanation, insurance flag.</p>
            <p><strong>alerts</strong> — email-style alerts triggered when risk crosses the insurance threshold.</p>
            <p><strong>user_roles</strong> — farmer / admin role mapping enforced via RLS.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
