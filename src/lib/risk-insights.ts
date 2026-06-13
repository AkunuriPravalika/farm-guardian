// Client-safe helpers that derive richer insights from a stored prediction + weather.
// Keeps DB schema unchanged — everything is computed deterministically from inputs.

export interface CropProfile {
  name: string;
  ideal_temp: [number, number];
  weekly_rain: [number, number]; // mm
  heat_threshold: number; // °C
  drought_mm: number; // weekly mm below which drought risk
  flood_mm: number; // weekly mm above which flood risk
  base_coverage_per_acre: number; // INR
  notes: string;
}

export const CROP_PROFILES: Record<string, CropProfile> = {
  rice: {
    name: "Rice",
    ideal_temp: [22, 32],
    weekly_rain: [40, 150],
    heat_threshold: 36,
    drought_mm: 15,
    flood_mm: 180,
    base_coverage_per_acre: 18000,
    notes: "Rice needs steady water. Sustained low rainfall or extreme heat hurts grain filling.",
  },
  wheat: {
    name: "Wheat",
    ideal_temp: [15, 25],
    weekly_rain: [10, 40],
    heat_threshold: 32,
    drought_mm: 5,
    flood_mm: 80,
    base_coverage_per_acre: 15000,
    notes: "Wheat is sensitive to heat at flowering. Excess rain near harvest causes lodging.",
  },
  cotton: {
    name: "Cotton",
    ideal_temp: [21, 35],
    weekly_rain: [20, 60],
    heat_threshold: 40,
    drought_mm: 8,
    flood_mm: 120,
    base_coverage_per_acre: 22000,
    notes: "Cotton tolerates heat but heavy rain triggers boll rot and pest pressure.",
  },
  tomato: {
    name: "Tomato",
    ideal_temp: [18, 29],
    weekly_rain: [15, 45],
    heat_threshold: 34,
    drought_mm: 8,
    flood_mm: 90,
    base_coverage_per_acre: 25000,
    notes: "Tomato drops flowers above 34°C. Wet foliage spreads blight quickly.",
  },
  maize: {
    name: "Maize",
    ideal_temp: [20, 30],
    weekly_rain: [20, 70],
    heat_threshold: 38,
    drought_mm: 10,
    flood_mm: 130,
    base_coverage_per_acre: 17000,
    notes: "Maize silking stage is critical — heatwave or drought then is catastrophic.",
  },
};

export function getCropProfile(crop?: string | null): CropProfile {
  const key = (crop ?? "").trim().toLowerCase();
  return CROP_PROFILES[key] ?? {
    name: crop || "Generic crop",
    ideal_temp: [18, 32],
    weekly_rain: [20, 80],
    heat_threshold: 38,
    drought_mm: 10,
    flood_mm: 120,
    base_coverage_per_acre: 15000,
    notes: "Generic threshold model used for unrecognised crops.",
  };
}

export interface RiskInsights {
  temperature_contribution: number; // 0-100
  rainfall_contribution: number; // 0-100
  humidity_contribution: number; // 0-100
  confidence_pct: number; // 0-100
  coverage_amount: number; // INR
  justification: string;
  crop: CropProfile;
}

interface MinimalWeather {
  temperature_c?: number | null;
  rainfall_mm?: number | null;
  humidity_pct?: number | null;
  forecast_json?: unknown;
}

interface MinimalPrediction {
  risk_score: number | string;
  risk_type: string;
  risk_level: string;
  insurance_recommended?: boolean | null;
}

export function deriveRiskInsights(
  pred: MinimalPrediction,
  weather: MinimalWeather | null | undefined,
  crop: string | null | undefined,
  farm_size_acres: number | null | undefined,
): RiskInsights {
  const c = getCropProfile(crop);
  const score = Number(pred.risk_score);
  const forecast = Array.isArray(weather?.forecast_json)
    ? (weather!.forecast_json as Array<{ tmax?: number; rain?: number }>)
    : [];
  const totalRain = forecast.reduce((s, d) => s + (d.rain ?? 0), 0);
  const maxTemp = forecast.length
    ? Math.max(...forecast.map((d) => d.tmax ?? Number(weather?.temperature_c ?? 0)))
    : Number(weather?.temperature_c ?? 0);
  const humidity = Number(weather?.humidity_pct ?? 0);

  // Contributions sum to 100. Each factor's pressure is distance from ideal.
  const tempPressure = Math.max(0, maxTemp - c.heat_threshold) * 6 +
    Math.max(0, c.ideal_temp[0] - maxTemp) * 4;
  const rainPressure = totalRain < c.weekly_rain[0]
    ? (c.weekly_rain[0] - totalRain) * 1.5
    : totalRain > c.weekly_rain[1]
      ? (totalRain - c.weekly_rain[1]) * 0.8
      : 0;
  const humPressure = humidity > 85 ? (humidity - 85) * 2 : humidity < 25 ? (25 - humidity) * 1.2 : 0;
  const totalP = Math.max(tempPressure + rainPressure + humPressure, 1);
  const temperature_contribution = Math.round((tempPressure / totalP) * 100);
  const rainfall_contribution = Math.round((rainPressure / totalP) * 100);
  const humidity_contribution = Math.max(0, 100 - temperature_contribution - rainfall_contribution);

  // Confidence: higher when one factor clearly dominates and we have forecast data.
  const dominance = Math.max(temperature_contribution, rainfall_contribution, humidity_contribution);
  const dataBonus = forecast.length >= 5 ? 15 : 5;
  const confidence_pct = Math.min(98, Math.round(55 + dominance * 0.3 + dataBonus));

  // Coverage: scaled by crop base, farm size, and risk severity.
  const acres = Math.max(0.25, Number(farm_size_acres ?? 1));
  const severity = score >= 80 ? 1.0 : score >= 60 ? 0.75 : score >= 35 ? 0.4 : 0.15;
  const coverage_amount = Math.round(c.base_coverage_per_acre * acres * severity);

  const reasonParts: string[] = [];
  if (rainfall_contribution >= 35) {
    reasonParts.push(
      totalRain < c.weekly_rain[0]
        ? `weekly rainfall ${totalRain.toFixed(1)}mm is below ${c.name}'s minimum ${c.weekly_rain[0]}mm`
        : `weekly rainfall ${totalRain.toFixed(0)}mm exceeds ${c.name}'s safe ${c.weekly_rain[1]}mm`,
    );
  }
  if (temperature_contribution >= 35) {
    reasonParts.push(`peak temperature ${maxTemp.toFixed(0)}°C stresses ${c.name} (threshold ${c.heat_threshold}°C)`);
  }
  if (humidity_contribution >= 35) {
    reasonParts.push(`humidity ${humidity.toFixed(0)}% is outside the comfort band for ${c.name}`);
  }
  const justification = reasonParts.length
    ? `${pred.risk_level.toUpperCase()} ${pred.risk_type.replace("_", " ")} risk: ${reasonParts.join("; ")}.`
    : `${pred.risk_level.toUpperCase()} conditions for ${c.name}. ${c.notes}`;

  return {
    temperature_contribution,
    rainfall_contribution,
    humidity_contribution,
    confidence_pct,
    coverage_amount,
    justification,
    crop: c,
  };
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
