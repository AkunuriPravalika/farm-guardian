import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminStats, promoteSelfToAdmin } from "@/lib/smartshield.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldAlert, BellRing, BarChart3, Gauge } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — SmartShield" }] }),
  component: Admin,
});

function Admin() {
  const statsFn = useServerFn(getAdminStats);
  const promote = useServerFn(promoteSelfToAdmin);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn(), retry: false });

  const promoteMut = useMutation({
    mutationFn: () => promote(),
    onSuccess: () => {
      toast.success("You are now admin");
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isError) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle>Admin access required</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You don't have admin permissions. If no admin exists yet, you can claim the role below (one-time, demo bootstrap).
              </p>
              <Button onClick={() => promoteMut.mutate()} disabled={promoteMut.isPending}>
                {promoteMut.isPending ? "Granting…" : "Make me the admin"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const s = q.data;
  const levelData = s ? Object.entries(s.by_level).map(([level, count]) => ({ level, count })) : [];
  const typeData = s ? Object.entries(s.by_type).map(([type, count]) => ({ type: type.replace("_", " "), count })) : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Stat icon={<Users className="h-5 w-5" />} label="Farmers" value={s?.total_farmers ?? 0} />
          <Stat icon={<BarChart3 className="h-5 w-5" />} label="Risk analyses" value={s?.total_predictions ?? 0} />
          <Stat icon={<Gauge className="h-5 w-5" />} label="Avg risk score" value={s?.average_risk_score ?? 0} />
          <Stat icon={<ShieldAlert className="h-5 w-5" />} label="Insurance recommended" value={s?.insurance_recommended_count ?? 0} />
          <Stat icon={<BellRing className="h-5 w-5" />} label="Alerts sent" value={s?.total_alerts ?? 0} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Predictions by risk level</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer>
                <BarChart data={levelData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="level" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(0.48 0.14 150)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Predictions by risk type</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="type" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(0.75 0.18 70)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Farmers</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr><th className="py-2">Name</th><th>Location</th><th>Crop</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {(s?.farmers ?? []).map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="py-2">{f.full_name || "—"}</td>
                      <td>{f.location_name || "—"}</td>
                      <td>{f.crop || "—"}</td>
                      <td>{new Date(f.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent predictions</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(s?.recent ?? []).map((p) => (
                <li key={p.id} className="py-3 flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <div className="font-medium capitalize">{p.risk_type.replace("_", " ")} — score {Number(p.risk_score).toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                  <Badge>{p.risk_level}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon} {label}</div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
