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

  async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`);
      const j = await r.json();
      const a = j.address || {};
      return (
        a.village || a.town || a.city || a.hamlet || a.suburb || a.county || a.state || j.display_name || ""
      );
    } catch {
      return "";
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const place = await reverseGeocode(lat, lon);
        setForm((f) => ({
          ...f,
          latitude: lat.toFixed(5),
          longitude: lon.toFixed(5),
          location_name: place || f.location_name,
        }));
        setLocating(false);
        toast.success(place ? `Location: ${place}` : "Location captured");
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
        <select
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.crop}
          onChange={(e) => setForm({ ...form, crop: e.target.value })}
        >
          <option value="">Select a crop…</option>
          <option value="rice">Rice</option>
          <option value="wheat">Wheat</option>
          <option value="cotton">Cotton</option>
          <option value="tomato">Tomato</option>
          <option value="maize">Maize</option>
        </select>
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
