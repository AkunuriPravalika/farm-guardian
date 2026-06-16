import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "@/lib/smartshield.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const farmerName = q.data?.farmer?.full_name || "Farmer";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Historical reports</h1>
          {q.data?.farmer && (
            <p className="text-muted-foreground text-sm mt-1">
              {farmerName} • {q.data.farmer.location_name} • {q.data.farmer.crop}
            </p>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Past risk predictions</CardTitle></CardHeader>
          <CardContent>
            {(q.data?.predictions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No predictions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-3">Farmer</th>
                      <th className="pr-3">Date</th>
                      <th className="pr-3">Level</th>
                      <th className="pr-3">Type</th>
                      <th className="pr-3">Score</th>
                      <th className="pr-3">Insurance</th>
                      <th className="pr-3">Reason</th>
                      <th>Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data!.predictions.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 align-top">
                        <td className="py-2 pr-3">{farmerName}</td>
                        <td className="pr-3 whitespace-nowrap">{new Date(p.created_at).toLocaleString()}</td>
                        <td className="pr-3"><Badge className={levelColor[p.risk_level] ?? ""}>{p.risk_level}</Badge></td>
                        <td className="pr-3 capitalize">{p.risk_type.replace("_", " ")}</td>
                        <td className="pr-3 font-medium">{Number(p.risk_score).toFixed(0)}</td>
                        <td className="pr-3">{p.insurance_recommended ? "✅ Yes" : "—"}</td>
                        <td className="pr-3 max-w-xs text-muted-foreground">{p.insurance_reason}</td>
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
                    <tr>
                      <th className="py-2 pr-3">Fetched by</th>
                      <th className="pr-3">Fetched at</th>
                      <th className="pr-3">Temp °C</th>
                      <th className="pr-3">Rain mm</th>
                      <th className="pr-3">Humidity %</th>
                      <th>Wind kph</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data!.weather.map((w) => (
                      <tr key={w.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{farmerName}</td>
                        <td className="pr-3 whitespace-nowrap">{new Date(w.fetched_at).toLocaleString()}</td>
                        <td className="pr-3">{Number(w.temperature_c ?? 0).toFixed(1)}</td>
                        <td className="pr-3">{Number(w.rainfall_mm ?? 0).toFixed(1)}</td>
                        <td className="pr-3">{Number(w.humidity_pct ?? 0).toFixed(0)}</td>
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
