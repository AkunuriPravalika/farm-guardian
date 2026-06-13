import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getCropProfile } from "./risk-insights";

const ProfileInput = z.object({
  full_name: z.string().min(1).max(120),
  location_name: z.string().min(1).max(160),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  crop: z.string().min(1).max(80),
  farm_size_acres: z.number().min(0).max(100000),
});

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    return { profile: data, roles: (roles ?? []).map((r) => r.role) };
  });

interface WeatherSummary {
  current: {
    temperature_c: number;
    humidity_pct: number;
    wind_kph: number;
    rainfall_mm: number;
  };
  forecast: Array<{
    date: string;
    tmax: number;
    tmin: number;
    rain: number;
  }>;
}

async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherSummary> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
  const j = await res.json();
  return {
    current: {
      temperature_c: j.current?.temperature_2m ?? 0,
      humidity_pct: j.current?.relative_humidity_2m ?? 0,
      wind_kph: j.current?.wind_speed_10m ?? 0,
      rainfall_mm: j.current?.precipitation ?? 0,
    },
    forecast: (j.daily?.time ?? []).map((date: string, i: number) => ({
      date,
      tmax: j.daily.temperature_2m_max[i],
      tmin: j.daily.temperature_2m_min[i],
      rain: j.daily.precipitation_sum[i],
    })),
  };
}

interface AiRisk {
  risk_level: "low" | "moderate" | "high" | "critical";
  risk_type: "drought" | "heavy_rainfall" | "heatwave" | "normal" | "mixed";
  risk_score: number;
  explanation: string;
  insurance_recommended: boolean;
  insurance_reason: string;
}

function ruleBasedRisk(w: WeatherSummary, crop: string): AiRisk {
  const c = getCropProfile(crop);
  const totalRain = w.forecast.reduce((s, d) => s + (d.rain ?? 0), 0);
  const maxTemp = Math.max(...w.forecast.map((d) => d.tmax));
  const hot = w.forecast.filter((d) => d.tmax > c.heat_threshold).length;
  let risk_type: AiRisk["risk_type"] = "normal";
  let risk_score = 15;
  const reasons: string[] = [];
  if (totalRain < c.drought_mm) {
    risk_type = "drought";
    risk_score = Math.max(risk_score, 70);
    reasons.push(`Only ${totalRain.toFixed(1)}mm rain expected; ${c.name} needs at least ${c.weekly_rain[0]}mm/week.`);
  } else if (totalRain < c.weekly_rain[0]) {
    risk_score = Math.max(risk_score, 45);
    reasons.push(`Rainfall ${totalRain.toFixed(0)}mm is below ${c.name}'s ideal minimum (${c.weekly_rain[0]}mm).`);
  }
  if (totalRain > c.flood_mm) {
    risk_type = risk_type === "drought" ? "mixed" : "heavy_rainfall";
    risk_score = Math.max(risk_score, 78);
    reasons.push(`Heavy rainfall ${totalRain.toFixed(0)}mm exceeds ${c.name}'s safe ceiling (${c.weekly_rain[1]}mm).`);
  }
  if (hot >= 3 || maxTemp > c.heat_threshold + 4) {
    risk_type = risk_type === "normal" ? "heatwave" : "mixed";
    risk_score = Math.max(risk_score, 72);
    reasons.push(`Heatwave: ${hot} day(s) above ${c.heat_threshold}°C, peak ${maxTemp.toFixed(0)}°C.`);
  }
  const risk_level: AiRisk["risk_level"] =
    risk_score >= 80 ? "critical" : risk_score >= 60 ? "high" : risk_score >= 35 ? "moderate" : "low";
  const insurance_recommended = risk_score >= 60;
  return {
    risk_level,
    risk_type,
    risk_score,
    explanation:
      reasons.join(" ") ||
      `Conditions look stable for ${c.name}. Weekly rain ${totalRain.toFixed(1)}mm, peak temp ${maxTemp.toFixed(0)}°C.`,
    insurance_recommended,
    insurance_reason: insurance_recommended
      ? `Activate insurance: forecasted ${risk_type.replace("_", " ")} risk for ${c.name}.`
      : `Insurance activation not recommended right now for ${c.name}.`,
  };
}

async function aiRiskAnalysis(w: WeatherSummary, crop: string, location: string): Promise<AiRisk> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return ruleBasedRisk(w, crop);
  try {
    const { generateText, Output } = await import("ai");
    const { z: zod } = await import("zod");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const schema = zod.object({
      risk_level: zod.enum(["low", "moderate", "high", "critical"]),
      risk_type: zod.enum(["drought", "heavy_rainfall", "heatwave", "normal", "mixed"]),
      risk_score: zod.number().min(0).max(100),
      explanation: zod.string().max(400),
      insurance_recommended: zod.boolean(),
      insurance_reason: zod.string().max(300),
    });
    const prompt = `You are SmartShield, an agricultural risk advisor for small farmers.
Location: ${location}
Crop: ${crop}
Current weather: ${JSON.stringify(w.current)}
7-day forecast: ${JSON.stringify(w.forecast)}

Assess the weather risk to this crop. Consider drought (low rainfall), heavy rainfall (flooding/crop damage), and heatwave (>38°C sustained).
- risk_score 0-100 (higher = more dangerous)
- insurance_recommended = true ONLY if risk_score >= 60
- Explanation must be 2 short sentences, plain language a farmer understands.`;
    const aiPromise = generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema }),
      prompt,
    });
    const result = await Promise.race([
      aiPromise,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("AI timeout")), 15000)),
    ]);
    return (result as { output: AiRisk }).output;
  } catch (e) {
    console.error("AI risk fallback:", e);
    return ruleBasedRisk(w, crop);
  }
}


export const runRiskAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile || profile.latitude == null || profile.longitude == null) {
      throw new Error("Please complete your farm profile first.");
    }
    if (Math.abs(Number(profile.latitude)) < 0.01 && Math.abs(Number(profile.longitude)) < 0.01) {
      throw new Error("Invalid farm coordinates. Please update your profile with a real location (use 📍 Use my current location).");
    }

    const weather = await fetchOpenMeteo(
      Number(profile.latitude),
      Number(profile.longitude),
    );
    const { data: wr, error: wErr } = await supabase
      .from("weather_readings")
      .insert({
        user_id: userId,
        temperature_c: weather.current.temperature_c,
        rainfall_mm: weather.current.rainfall_mm,
        humidity_pct: weather.current.humidity_pct,
        wind_kph: weather.current.wind_kph,
        forecast_json: weather.forecast,
      })
      .select()
      .single();
    if (wErr) throw new Error(wErr.message);

    const ai = await aiRiskAnalysis(weather, profile.crop || "crop", profile.location_name || "your farm");

    const { data: pred, error: predErr } = await supabase
      .from("risk_predictions")
      .insert({
        user_id: userId,
        weather_reading_id: wr.id,
        risk_level: ai.risk_level,
        risk_type: ai.risk_type,
        risk_score: ai.risk_score,
        explanation: ai.explanation,
        insurance_recommended: ai.insurance_recommended,
        insurance_reason: ai.insurance_reason,
      })
      .select()
      .single();
    if (predErr) throw new Error(predErr.message);

    if (ai.insurance_recommended) {
      await supabase.from("alerts").insert({
        user_id: userId,
        channel: "email",
        subject: `SmartShield Alert: ${ai.risk_level.toUpperCase()} ${ai.risk_type.replace("_", " ")} risk`,
        body: `${ai.explanation}\n\nInsurance: ${ai.insurance_reason}`,
      });
    }

    return { weather: wr, prediction: pred };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileR, weatherR, predR, alertsR] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("weather_readings").select("*").eq("user_id", userId).order("fetched_at", { ascending: false }).limit(1),
      supabase.from("risk_predictions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
      supabase.from("alerts").select("*").eq("user_id", userId).order("sent_at", { ascending: false }).limit(5),
    ]);
    return {
      profile: profileR.data,
      weather: weatherR.data?.[0] ?? null,
      prediction: predR.data?.[0] ?? null,
      alerts: alertsR.data ?? [],
    };
  });

export const getReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [w, p] = await Promise.all([
      supabase.from("weather_readings").select("*").eq("user_id", userId).order("fetched_at", { ascending: false }).limit(30),
      supabase.from("risk_predictions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    ]);
    return { weather: w.data ?? [], predictions: p.data ?? [] };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [farmersR, predsR, alertsR, recentR] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,location_name,crop,created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("risk_predictions").select("risk_level,risk_type,insurance_recommended,created_at"),
      supabaseAdmin.from("alerts").select("id"),
      supabaseAdmin.from("risk_predictions").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    const preds = predsR.data ?? [];
    const byLevel: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
    const byType: Record<string, number> = {};
    let insuranceCount = 0;
    let scoreSum = 0;
    let scoreN = 0;
    for (const p of preds) {
      byLevel[p.risk_level] = (byLevel[p.risk_level] ?? 0) + 1;
      byType[p.risk_type] = (byType[p.risk_type] ?? 0) + 1;
      if (p.insurance_recommended) insuranceCount++;
      const s = Number((p as { risk_score?: number | string }).risk_score ?? NaN);
      if (Number.isFinite(s)) { scoreSum += s; scoreN++; }
    }
    return {
      farmers: farmersR.data ?? [],
      total_farmers: (farmersR.data ?? []).length,
      total_predictions: preds.length,
      total_alerts: (alertsR.data ?? []).length,
      insurance_recommended_count: insuranceCount,
      average_risk_score: scoreN ? Math.round(scoreSum / scoreN) : 0,
      by_level: byLevel,
      by_type: byType,
      recent: recentR.data ?? [],
    };
  });

export const promoteSelfToAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Demo helper: lets the first signed-in user grant themselves admin if no admin exists.
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (existing && existing.length > 0) {
      throw new Error("An admin already exists.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const weatherRows = [];
    const predRows = [];
    const alertRows = [];
    for (let i = 29; i >= 0; i--) {
      const fetched_at = new Date(now - i * day).toISOString();
      // Simulate seasonal pattern
      const base = 28 + Math.sin(i / 4) * 6;
      const temperature_c = +(base + (Math.random() - 0.5) * 4).toFixed(1);
      const rainfall_mm = +Math.max(0, (Math.random() < 0.3 ? Math.random() * 40 : Math.random() * 3)).toFixed(1);
      const humidity_pct = +(50 + Math.random() * 40).toFixed(0);
      const wind_kph = +(5 + Math.random() * 20).toFixed(1);
      const forecast = Array.from({ length: 7 }, (_, k) => ({
        date: new Date(now - (i - k) * day).toISOString().slice(0, 10),
        tmax: +(temperature_c + Math.random() * 4).toFixed(1),
        tmin: +(temperature_c - 4 - Math.random() * 3).toFixed(1),
        rain: +(Math.random() < 0.3 ? Math.random() * 30 : Math.random() * 2).toFixed(1),
      }));
      weatherRows.push({ user_id: userId, fetched_at, temperature_c, rainfall_mm, humidity_pct, wind_kph, forecast_json: forecast });
    }
    const { data: wInserted, error: wErr } = await supabase.from("weather_readings").insert(weatherRows).select();
    if (wErr) throw new Error(wErr.message);

    for (const w of wInserted ?? []) {
      const totalRain = (w.forecast_json as Array<{ rain: number }>).reduce((s, d) => s + d.rain, 0);
      const maxT = Math.max(...(w.forecast_json as Array<{ tmax: number }>).map((d) => d.tmax));
      let risk_score = 15;
      let risk_type: string = "normal";
      const reasons: string[] = [];
      if (totalRain < 5) { risk_type = "drought"; risk_score = 65 + Math.random() * 20; reasons.push(`Only ${totalRain.toFixed(1)}mm rain in 7 days.`); }
      else if (totalRain > 80) { risk_type = "heavy_rainfall"; risk_score = 70 + Math.random() * 25; reasons.push(`Heavy rain: ${totalRain.toFixed(0)}mm.`); }
      if (maxT > 40) { risk_type = risk_type === "normal" ? "heatwave" : "mixed"; risk_score = Math.max(risk_score, 70 + Math.random() * 20); reasons.push(`Peak temp ${maxT.toFixed(0)}°C.`); }
      else if (risk_type === "normal") { risk_score = 10 + Math.random() * 25; }
      const risk_level = risk_score >= 80 ? "critical" : risk_score >= 60 ? "high" : risk_score >= 35 ? "moderate" : "low";
      const insurance_recommended = risk_score >= 60;
      predRows.push({
        user_id: userId,
        weather_reading_id: w.id,
        risk_level,
        risk_type,
        risk_score: +risk_score.toFixed(0),
        explanation: reasons.join(" ") || `Stable conditions. Weekly rain ${totalRain.toFixed(1)}mm, peak ${maxT.toFixed(0)}°C.`,
        insurance_recommended,
        insurance_reason: insurance_recommended
          ? `Activate insurance: ${risk_type.replace("_", " ")} risk detected.`
          : "No insurance action needed.",
        created_at: w.fetched_at,
      });
      if (insurance_recommended) {
        alertRows.push({
          user_id: userId,
          channel: "email",
          subject: `SmartShield Alert: ${risk_level.toUpperCase()} ${risk_type.replace("_", " ")} risk`,
          body: `${reasons.join(" ")}\n\nInsurance: activate now.`,
          sent_at: w.fetched_at,
        });
      }
    }
    const { error: pErr } = await supabase.from("risk_predictions").insert(predRows);
    if (pErr) throw new Error(pErr.message);
    if (alertRows.length > 0) {
      const { error: aErr } = await supabase.from("alerts").insert(alertRows);
      if (aErr) throw new Error(aErr.message);
    }
    return { weather: weatherRows.length, predictions: predRows.length, alerts: alertRows.length };
  });
