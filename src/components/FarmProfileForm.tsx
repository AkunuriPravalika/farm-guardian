import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { upsertProfile } from "@/lib/smartshield.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initial?: {
    full_name?: string;
    location_name?: string;
    latitude?: number | null;
    longitude?: number | null;
    crop?: string;
    farm_size_acres?: number | null;
  } | null;
  onSaved?: () => void;
}

export function FarmProfileForm({ initial, onSaved }: Props) {
  const upsert = useServerFn(upsertProfile);
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    location_name: initial?.location_name ?? "",
    latitude: initial?.latitude?.toString() ?? "",
    longitude: initial?.longitude?.toString() ?? "",
    crop: initial?.crop ?? "",
    farm_size_acres: initial?.farm_size_acres?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(5),
          longitude: pos.coords.longitude.toFixed(5),
        }));
        setLocating(false);
        toast.success("Location captured");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message);
      },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsert({
        data: {
          full_name: form.full_name.trim(),
          location_name: form.location_name.trim(),
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          crop: form.crop.trim(),
          farm_size_acres: parseFloat(form.farm_size_acres || "0"),
        },
      });
      toast.success("Profile saved");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Full name</Label>
        <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Label>Location (village / district)</Label>
        <Input required value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
      </div>
      <div>
        <Label>Latitude</Label>
        <Input required type="number" step="0.00001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
      </div>
      <div>
        <Label>Longitude</Label>
        <Input required type="number" step="0.00001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
          {locating ? "Getting location…" : "📍 Use my current location"}
        </Button>
      </div>
      <div>
        <Label>Crop</Label>
        <Input required placeholder="e.g. Wheat, Rice, Cotton" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} />
      </div>
      <div>
        <Label>Farm size (acres)</Label>
        <Input required type="number" step="0.1" min="0" value={form.farm_size_acres} onChange={(e) => setForm({ ...form, farm_size_acres: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : "Save farm profile"}</Button>
      </div>
    </form>
  );
}
