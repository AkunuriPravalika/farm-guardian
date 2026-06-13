import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/documentation")({
  head: () => ({
    meta: [
      { title: "Documentation — SmartShield" },
      { name: "description", content: "Academic documentation for SmartShield: abstract, problem statement, methodology, diagrams and viva Q&A." },
    ],
  }),
  component: Documentation,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-2 whitespace-pre-wrap">{children}</CardContent>
    </Card>
  );
}

function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-5">
        <header>
          <h1 className="text-3xl font-bold">Project Documentation</h1>
          <p className="text-muted-foreground">SmartShield: AI Weather Insurance for Small Farmers — final-year B.Tech project documentation.</p>
        </header>

        <Section title="Abstract">
          SmartShield is an AI-powered web platform that protects small and marginal farmers from
          unexpected weather-related losses. It pulls live weather and 7-day forecast data for the
          farmer's exact coordinates, runs a crop-aware AI risk model, generates a 0–100 risk score,
          and recommends whether to activate weather-indexed crop insurance — with an estimated
          coverage amount. Alerts, historical reports and an admin analytics dashboard make the
          full Weather → AI → Risk → Insurance → Alert pipeline transparent and auditable.
        </Section>

        <Section title="Problem Statement">
          Small farmers in India face heavy losses from drought, heavy rainfall and heatwaves.
          They typically lack timely weather risk information, do not know when crop insurance
          should be activated, and existing schemes are reactive rather than predictive.
          SmartShield addresses this gap with proactive, AI-driven, location-specific risk
          intelligence delivered in plain language.
        </Section>

        <Section title="Research Gap">
          Existing weather portals (IMD, Agromet) show raw forecast numbers but do not translate
          them into crop-specific actionable decisions. Insurance products like PMFBY are
          claim-based and post-loss. There is no widely-deployed system that combines per-farm
          weather, AI risk scoring and pre-emptive insurance activation guidance in one tool
          accessible to small farmers.
        </Section>

        <Section title="Existing System">
          • IMD and Agromet advisories — generic, district-level, not crop-specific.{"\n"}
          • PMFBY (Pradhan Mantri Fasal Bima Yojana) — post-loss claim settlement.{"\n"}
          • Private agri-apps — mostly market price / advisory, no AI risk scoring.{"\n"}
          • Manual extension officer visits — limited reach, slow.
        </Section>

        <Section title="Proposed System">
          A full-stack web platform where each farmer registers their location, crop and farm size,
          and receives:{"\n"}
          1. Live current weather + 7-day forecast.{"\n"}
          2. AI risk score (0–100) with crop-specific reasoning.{"\n"}
          3. Insurance recommendation with estimated coverage in INR.{"\n"}
          4. Email-style alerts when risk crosses threshold.{"\n"}
          5. Historical reports and admin analytics across all farmers.
        </Section>

        <Section title="Objectives">
          • Provide hyper-local weather risk intelligence to small farmers.{"\n"}
          • Convert raw weather into crop-specific, plain-language insights.{"\n"}
          • Recommend insurance activation before loss occurs.{"\n"}
          • Maintain an auditable history of predictions and alerts.{"\n"}
          • Equip administrators with risk distribution and adoption analytics.
        </Section>

        <Section title="Methodology">
          1. Farmer registers and saves farm profile (coordinates, crop, area).{"\n"}
          2. Backend fetches Open-Meteo current + 7-day forecast.{"\n"}
          3. Weather is persisted to <code>weather_readings</code>.{"\n"}
          4. AI risk engine (Gemini via Lovable AI Gateway) classifies risk; deterministic crop-aware
          fallback engine guarantees an answer if the AI is unavailable.{"\n"}
          5. Prediction is stored in <code>risk_predictions</code>; if score ≥ 60 an alert row is created.{"\n"}
          6. Dashboard, reports and admin views read from these tables, secured by RLS.
        </Section>

        <Section title="System Architecture">
          Three-tier architecture:{"\n"}
          • Presentation — React 19 + TanStack Start (SSR), Tailwind, shadcn/ui.{"\n"}
          • Application — TanStack server functions, Supabase auth middleware, AI gateway.{"\n"}
          • Data — Supabase Postgres with RLS, Open-Meteo external API, Lovable AI Gateway.{"\n\n"}
          See the dedicated <strong>/architecture</strong> page for a visual pipeline.
        </Section>

        <Section title="Module Descriptions">
          • Auth Module — email/password sign-up, role assignment (farmer/admin).{"\n"}
          • Farm Profile Module — captures location (with reverse geocoding), crop and area.{"\n"}
          • Weather Module — Open-Meteo client and reading persistence.{"\n"}
          • AI Risk Module — crop-aware scoring with contribution breakdown and confidence.{"\n"}
          • Insurance Module — threshold + coverage calculation per crop and acreage.{"\n"}
          • Alerts Module — generates and stores alert messages.{"\n"}
          • Reports Module — historical analytics with charts.{"\n"}
          • Admin Module — farmer roster, risk distribution and adoption stats.
        </Section>

        <Section title="ER Diagram (textual)">
          {`auth.users (1) ──< profiles (1) ──< weather_readings (1) ──< risk_predictions
                              │
                              └──< alerts
auth.users (1) ──< user_roles`}
        </Section>

        <Section title="Use Case Diagram (textual)">
          {`Actors: Farmer, Admin, Weather API, AI Gateway

Farmer:
  - Register / Login
  - Save Farm Profile
  - Run Risk Analysis
  - View Dashboard / Reports
  - Receive Alerts

Admin:
  - View All Farmers
  - View Risk Distribution
  - View Insurance Stats

System:
  - Fetch Weather (Weather API)
  - Score Risk (AI Gateway)
  - Persist Records
  - Trigger Alerts`}
        </Section>

        <Section title="Sequence Diagram (textual)">
          {`Farmer → UI: Click "Run AI risk analysis"
UI → ServerFn(runRiskAnalysis): POST
ServerFn → Open-Meteo: GET forecast
Open-Meteo → ServerFn: weather JSON
ServerFn → DB: INSERT weather_readings
ServerFn → AI Gateway: prompt(weather, crop)
AI Gateway → ServerFn: structured risk JSON
ServerFn → DB: INSERT risk_predictions [+ alerts]
ServerFn → UI: prediction
UI → Farmer: render risk + insurance card`}
        </Section>

        <Section title="Activity Diagram (textual)">
          {`Start → Login? → No → Auth Page → Login
                  └ Yes → Has Profile? → No → Farm Profile Form
                                     └ Yes → Dashboard
Dashboard → Run Analysis → Fetch Weather → AI Score
        → Score ≥ 60 ? → Yes → Create Alert + Recommend Insurance
                       └ No  → Recommend No Action
        → Show Result → End`}
        </Section>

        <Section title="SRS — Software Requirements (summary)">
          Functional: registration, profile, weather fetch, AI scoring, insurance recommendation,
          alerts, historical reports, admin analytics, role-based access.{"\n"}
          Non-functional: 99% availability, &lt; 3s analysis latency, mobile-responsive, RLS-secured,
          audit history retained ≥ 90 days, INR currency formatting.
        </Section>

        <Section title="IEEE-Style Report (outline)">
          I. Introduction · II. Literature Survey · III. Existing System · IV. Proposed System ·
          V. System Design · VI. Implementation · VII. Results &amp; Analysis ·
          VIII. Conclusion &amp; Future Scope · IX. References.
        </Section>

        <Section title="Presentation Outline (PPT)">
          {`1. Title — SmartShield: AI Weather Insurance for Small Farmers
2. Problem Statement
3. Existing System & Gaps
4. Proposed System
5. System Architecture
6. Modules
7. AI Risk Model
8. Insurance Recommendation Logic
9. Demo Screenshots
10. Results / Charts
11. Conclusion & Future Scope
12. References / Q&A`}
        </Section>

        <Section title="Viva Questions & Answers">
          {`Q1. What problem does SmartShield solve?
A. It predicts crop weather risk and tells small farmers when to activate insurance.

Q2. Which weather API is used?
A. Open-Meteo — free, no key, global coverage.

Q3. Which AI model and why?
A. Gemini via Lovable AI Gateway — strong structured-output performance and a fallback rule engine ensures availability.

Q4. How is data secured?
A. Supabase Postgres with Row Level Security; each farmer can only read their own rows; admin role uses a security-definer has_role() function to avoid recursion.

Q5. How is the risk score calculated?
A. AI considers weekly rainfall, peak temperature, humidity and crop thresholds. Score 0–100; ≥60 triggers insurance recommendation.

Q6. Why crop-specific logic?
A. Rice tolerates water; wheat fails in heat at flowering; cotton suffers from excess rain. One-size-fits-all scoring would mislead.

Q7. How is coverage amount computed?
A. base_coverage_per_acre × acres × severity_factor(score). Stored crop profile drives the base.

Q8. What's the role of the admin?
A. Aggregate risk distribution, total farmers, insurance stats and adoption — for policy decisions.

Q9. Future scope?
A. SMS/WhatsApp alerts, satellite NDVI integration, claim auto-filing with PMFBY, regional language UI.`}
        </Section>
      </div>
    </div>
  );
}
