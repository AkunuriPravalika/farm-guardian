import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "@/lib/smartshield.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Historical reports — SmartShield" }] }),
  component: Reports,
});

const levelColor: Record<string, string> = {
  low: "bg-success text-success-foreground",
  moderate: "bg-warning text-warning-foreground",
  high: "bg-destructive text-destructive-foreground",
  critical: "bg-destructive text-destructive-foreground",
};

function Reports() {
  const fn = useServerFn(getReports);
  const q = useQuery({ queryKey: ["reports"], queryFn: () => fn() });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Historical reports</h1>

        {q.data && (q.data.weather.length > 0 || q.data.predictions.length > 0) && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Temperature trend</CardTitle></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer>
                  <LineChart data={[...q.data.weather].reverse().map((w) => ({ date: new Date(w.fetched_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), temp: Number(w.temperature_c ?? 0) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" /><YAxis /><Tooltip />
                    <Line type="monotone" dataKey="temp" stroke="oklch(0.65 0.22 27)" strokeWidth={2} name="°C" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Rainfall trend</CardTitle></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer>
                  <BarChart data={[...q.data.weather].reverse().map((w) => ({ date: new Date(w.fetched_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), rain: Number(w.rainfall_mm ?? 0) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" /><YAxis /><Tooltip />
                    <Bar dataKey="rain" fill="oklch(0.48 0.14 220)" name="mm" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Risk score trend</CardTitle></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer>
                  <LineChart data={[...q.data.predictions].reverse().map((p) => ({ date: new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), score: Number(p.risk_score) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip />
                    <Line type="monotone" dataKey="score" stroke="oklch(0.6 0.22 30)" strokeWidth={2} name="Risk" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Past risk predictions</CardTitle></CardHeader>
          <CardContent>
            {(q.data?.predictions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No predictions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2">Date</th><th>Level</th><th>Type</th><th>Score</th><th>Insurance</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {q.data!.predictions.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2">{new Date(p.created_at).toLocaleString()}</td>
                        <td><Badge className={levelColor[p.risk_level] ?? ""}>{p.risk_level}</Badge></td>
                        <td className="capitalize">{p.risk_type.replace("_", " ")}</td>
                        <td>{Number(p.risk_score).toFixed(0)}</td>
                        <td>{p.insurance_recommended ? "✅ Yes" : "—"}</td>
                        <td className="max-w-md text-muted-foreground">{p.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Past weather readings</CardTitle></CardHeader>
          <CardContent>
            {(q.data?.weather ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No readings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2">Fetched</th><th>Temp °C</th><th>Rain mm</th><th>Humidity %</th><th>Wind kph</th></tr>
                  </thead>
                  <tbody>
                    {q.data!.weather.map((w) => (
                      <tr key={w.id} className="border-b last:border-0">
                        <td className="py-2">{new Date(w.fetched_at).toLocaleString()}</td>
                        <td>{Number(w.temperature_c ?? 0).toFixed(1)}</td>
                        <td>{Number(w.rainfall_mm ?? 0).toFixed(1)}</td>
                        <td>{Number(w.humidity_pct ?? 0).toFixed(0)}</td>
                        <td>{Number(w.wind_kph ?? 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
