import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboard, runRiskAnalysis, getMyProfile, seedDemoData } from "@/lib/smartshield.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { FarmProfileForm } from "@/components/FarmProfileForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, CloudRain, Wind, Droplets, ShieldCheck, ShieldAlert, Sparkles, BellRing } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SmartShield" }] }),
  component: Dashboard,
});

const levelColor: Record<string, string> = {
  low: "bg-success text-success-foreground",
  moderate: "bg-warning text-warning-foreground",
  high: "bg-destructive text-destructive-foreground",
  critical: "bg-destructive text-destructive-foreground",
};

function Dashboard() {
  const dashFn = useServerFn(getDashboard);
  const profileFn = useServerFn(getMyProfile);
  const analyze = useServerFn(runRiskAnalysis);
  const seed = useServerFn(seedDemoData);
  const qc = useQueryClient();

  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => profileFn() });

  const runMut = useMutation({
    mutationFn: () => analyze(),
    onSuccess: () => {
      toast.success("Risk analysis updated");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedMut = useMutation({
    mutationFn: () => seed(),
    onSuccess: (r) => {
      toast.success(`Seeded ${r.predictions} demo predictions & ${r.alerts} alerts`);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const p = dash.data?.profile;
  const hasProfile = p && p.latitude != null && p.longitude != null && p.crop;
  const w = dash.data?.weather;
  const pred = dash.data?.prediction;
  const forecast = (w?.forecast_json as Array<{ date: string; tmax: number; tmin: number; rain: number }> | null) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Farm Dashboard</h1>
            <p className="text-muted-foreground">
              {p?.location_name ? `${p.location_name} • ${p.crop}` : "Set up your farm to get started"}
            </p>
          </div>
          {hasProfile && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
                {seedMut.isPending ? "Seeding…" : "Load demo data"}
              </Button>
              <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}>
                <Sparkles className="mr-2 h-4 w-4" />
                {runMut.isPending ? "Analyzing…" : "Run AI risk analysis"}
              </Button>
            </div>
          )}
        </div>

        {!hasProfile && !profile.isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Set up your farm</CardTitle>
            </CardHeader>
            <CardContent>
              <FarmProfileForm
                initial={profile.data?.profile}
                onSaved={() => {
                  qc.invalidateQueries({ queryKey: ["dashboard"] });
                  qc.invalidateQueries({ queryKey: ["my-profile"] });
                }}
              />
            </CardContent>
          </Card>
        )}

        {hasProfile && !pred && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No risk analysis yet. Click <strong>Run AI risk analysis</strong> to fetch live weather and get your first report.
            </CardContent>
          </Card>
        )}

        {hasProfile && pred && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard icon={<Thermometer className="h-5 w-5" />} label="Temperature" value={`${Number(w?.temperature_c ?? 0).toFixed(1)}°C`} />
              <StatCard icon={<CloudRain className="h-5 w-5" />} label="Rainfall (now)" value={`${Number(w?.rainfall_mm ?? 0).toFixed(1)} mm`} />
              <StatCard icon={<Droplets className="h-5 w-5" />} label="Humidity" value={`${Number(w?.humidity_pct ?? 0).toFixed(0)}%`} />
              <StatCard icon={<Wind className="h-5 w-5" />} label="Wind" value={`${Number(w?.wind_kph ?? 0).toFixed(1)} kph`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Risk assessment</CardTitle>
                  <Badge className={levelColor[pred.risk_level] ?? ""}>{pred.risk_level.toUpperCase()}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{Number(pred.risk_score).toFixed(0)}</span>
                    <span className="text-muted-foreground">/ 100 risk score</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Type: <strong className="text-foreground">{pred.risk_type.replace("_", " ")}</strong></p>
                  <p className="text-sm">{pred.explanation}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Insurance recommendation</CardTitle>
                  {pred.insurance_recommended ? (
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-success" />
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xl font-semibold">
                    {pred.insurance_recommended ? "Activate insurance now" : "No action needed"}
                  </p>
                  <p className="text-sm text-muted-foreground">{pred.insurance_reason}</p>
                </CardContent>
              </Card>
            </div>

            {forecast.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Temperature — 7-day forecast</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer>
                      <LineChart data={forecast}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="tmax" stroke="oklch(0.65 0.22 27)" name="Max °C" strokeWidth={2} />
                        <Line type="monotone" dataKey="tmin" stroke="oklch(0.55 0.18 250)" name="Min °C" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Rainfall — 7-day forecast</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={forecast}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="rain" name="mm" fill="oklch(0.48 0.14 220)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                <CardTitle>Recent alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {(dash.data?.alerts ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alerts yet. Alerts appear here when risk crosses the insurance threshold.</p>
                ) : (
                  <ul className="divide-y">
                    {dash.data!.alerts.map((a: { id: string; subject: string; body: string; sent_at: string }) => (
                      <li key={a.id} className="py-3">
                        <div className="font-medium">{a.subject}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(a.sent_at).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="text-center">
              <Link to="/reports" className="text-sm text-primary hover:underline">View full history →</Link>
            </div>
          </>
        )}

        {hasProfile && (
          <details className="rounded-lg border bg-card p-4">
            <summary className="cursor-pointer font-medium">Update farm profile</summary>
            <div className="pt-4">
              <FarmProfileForm
                initial={profile.data?.profile}
                onSaved={() => {
                  qc.invalidateQueries({ queryKey: ["dashboard"] });
                  qc.invalidateQueries({ queryKey: ["my-profile"] });
                }}
              />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon} {label}</div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
