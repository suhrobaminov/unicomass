/**
 * Defensive normalization for AI-generated strategy reports.
 * The model can vary key names/shapes, so everything here degrades gracefully
 * instead of throwing inside React render.
 */

export type Tier = "Reach" | "Target" | "Safety";

export type School = {
  school_name: string;
  tier: Tier;
  admission_rate_estimate: string;
  reason_for_tier: string;
};

export type NormalizedReport = {
  profile_strength_score: number | null;
  summary_bullets: string[];
  categorized_schools: School[];
  profile_gaps: string[];
  actionable_next_steps: string[];
  raw_text: string | null;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function toText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v && typeof v === "object") {
    const r = asRecord(v);
    for (const k of ["text", "description", "detail", "step", "gap", "bullet", "value", "title"]) {
      if (typeof r[k] === "string") return (r[k] as string).trim();
    }
  }
  return "";
}

function toStringList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(toText).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(/\r?\n|(?:^|\s)[-•*]\s+/)
      .map((s) => s.trim().replace(/^[-•*\d.)\s]+/, ""))
      .filter(Boolean);
  }
  return [];
}

function toTier(v: unknown): Tier | null {
  const s = toText(v).toLowerCase();
  if (s.includes("reach") || s.includes("dream")) return "Reach";
  if (s.includes("target") || s.includes("match")) return "Target";
  if (s.includes("safety") || s.includes("likely")) return "Safety";
  return null;
}

function toSchool(v: unknown, fallbackTier: Tier | null): School | null {
  if (typeof v === "string") {
    const name = v.trim();
    if (!name) return null;
    return {
      school_name: name,
      tier: fallbackTier ?? "Target",
      admission_rate_estimate: "—",
      reason_for_tier: "",
    };
  }
  const r = asRecord(v);
  const name =
    toText(r["school_name"]) || toText(r["name"]) || toText(r["university"]) || toText(r["school"]);
  if (!name) return null;
  return {
    school_name: name,
    tier: toTier(r["tier"] ?? r["category"] ?? r["type"]) ?? fallbackTier ?? "Target",
    admission_rate_estimate:
      toText(r["admission_rate_estimate"]) ||
      toText(r["admission_rate"]) ||
      toText(r["acceptance_rate"]) ||
      "—",
    reason_for_tier:
      toText(r["reason_for_tier"]) || toText(r["reason"]) || toText(r["why"]) || toText(r["rationale"]),
  };
}

function collectSchools(root: Record<string, unknown>): School[] {
  const out: School[] = [];

  const flat =
    root["categorized_schools"] ?? root["universities"] ?? root["schools"] ?? root["recommendations"];
  if (Array.isArray(flat)) {
    for (const item of flat) {
      const s = toSchool(item, null);
      if (s) out.push(s);
    }
  }

  // Grouped shapes: { reach: [...], target: [...], safety: [...] } — possibly nested.
  const groups: Array<[Tier, unknown]> = [
    ["Reach", root["reach"] ?? root["reach_schools"] ?? root["reaches"]],
    ["Target", root["target"] ?? root["target_schools"] ?? root["targets"] ?? root["match"]],
    ["Safety", root["safety"] ?? root["safety_schools"] ?? root["safeties"] ?? root["likely"]],
  ];
  const nested = asRecord(flat);
  for (const [tier, key] of [
    ["Reach", "reach"],
    ["Target", "target"],
    ["Safety", "safety"],
  ] as Array<[Tier, string]>) {
    if (nested[key]) groups.push([tier, nested[key]]);
  }

  for (const [tier, value] of groups) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const s = toSchool(item, tier);
      if (s) out.push(s);
    }
  }

  // De-duplicate by name+tier.
  const seen = new Set<string>();
  return out.filter((s) => {
    const k = `${s.school_name.toLowerCase()}|${s.tier}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Accepts an object, a JSON string, or fenced markdown JSON. Never throws. */
export function normalizeReport(input: unknown): NormalizedReport {
  let value: unknown = input;
  let rawText: string | null = null;

  if (typeof value === "string") {
    const cleaned = value.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    try {
      value = JSON.parse(cleaned);
    } catch {
      rawText = cleaned;
      value = {};
    }
  }

  const r = asRecord(value);
  const scoreRaw = r["profile_strength_score"] ?? r["score"] ?? r["overall_score"];
  const score = Number(scoreRaw);

  return {
    profile_strength_score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    summary_bullets: toStringList(r["summary_bullets"] ?? r["summary"] ?? r["strategy"]),
    categorized_schools: collectSchools(r),
    profile_gaps: toStringList(r["profile_gaps"] ?? r["gaps"] ?? r["weaknesses"]),
    actionable_next_steps: toStringList(
      r["actionable_next_steps"] ?? r["next_steps"] ?? r["action_items"] ?? r["roadmap"],
    ),
    raw_text: rawText,
  };
}
