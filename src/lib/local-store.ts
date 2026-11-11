/**
 * Browser-local persistence for UniCompass.
 * No account required — everything a student enters lives in localStorage
 * on their own device.
 */

export type Profile = {
  full_name: string;
  region: string;
  intended_majors: string;
  graduation_year: number | null;
  gpa_unweighted: number | null;
  gpa_weighted: number | null;
  class_rank: string;
  sat_score: number | null;
  act_score: number | null;
  ap_count: number;
  ib_count: number;
  honors_count: number;
};

export type EC = {
  id: string;
  name: string;
  category: string;
  leadership_role: string;
  hours_per_week: number | null;
  description: string;
};

export type Award = {
  id: string;
  title: string;
  selection_level: string;
  description: string;
};

export type SavedReport = {
  id: string;
  created_at: string;
  payload: Record<string, unknown>;
};

export type SavedAssessment = {
  answers: Record<string, number>;
  completed: boolean;
  results: Record<string, unknown> | null;
  updated_at: string;
};

export type Store = {
  profile: Profile;
  ecs: EC[];
  awards: Award[];
  reports: SavedReport[];
  assessment: SavedAssessment | null;
};

export const EMPTY_PROFILE: Profile = {
  full_name: "",
  region: "",
  intended_majors: "",
  graduation_year: null,
  gpa_unweighted: null,
  gpa_weighted: null,
  class_rank: "",
  sat_score: null,
  act_score: null,
  ap_count: 0,
  ib_count: 0,
  honors_count: 0,
};

const KEY = "unicompass.v1";

const emptyStore = (): Store => ({
  profile: { ...EMPTY_PROFILE },
  ecs: [],
  awards: [],
  reports: [],
  assessment: null,
});

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store> | null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyStore();

    const profile =
      parsed.profile && typeof parsed.profile === "object" && !Array.isArray(parsed.profile)
        ? parsed.profile as Record<string, unknown>
        : {};
    const text = (value: unknown, max = 500) =>
      typeof value === "string" ? value.slice(0, max) : "";
    const number = (value: unknown, min: number, max: number): number | null => {
      if (value === null || value === undefined || value === "") return null;
      const parsedNumber = Number(value);
      return Number.isFinite(parsedNumber) ? Math.max(min, Math.min(max, parsedNumber)) : null;
    };
    const count = (value: unknown) => Math.round(number(value, 0, 50) ?? 0);

    const ecs: EC[] = Array.isArray(parsed.ecs)
      ? parsed.ecs.flatMap((value) => {
          if (!value || typeof value !== "object" || Array.isArray(value)) return [];
          const item = value as Record<string, unknown>;
          const name = text(item.name, 120);
          if (!name.trim()) return [];
          return [{
            id: text(item.id, 80) || newId(),
            name,
            category: text(item.category, 80),
            leadership_role: text(item.leadership_role, 120),
            hours_per_week: number(item.hours_per_week, 0, 100),
            description: text(item.description, 600),
          }];
        })
      : [];

    const awards: Award[] = Array.isArray(parsed.awards)
      ? parsed.awards.flatMap((value) => {
          if (!value || typeof value !== "object" || Array.isArray(value)) return [];
          const item = value as Record<string, unknown>;
          const title = text(item.title, 160);
          if (!title.trim()) return [];
          return [{
            id: text(item.id, 80) || newId(),
            title,
            selection_level: text(item.selection_level, 100),
            description: text(item.description, 600),
          }];
        })
      : [];

    const reports: SavedReport[] = Array.isArray(parsed.reports)
      ? parsed.reports.flatMap((value) => {
          if (!value || typeof value !== "object" || Array.isArray(value)) return [];
          const item = value as Record<string, unknown>;
          const payload = item.payload;
          if (typeof item.id !== "string" || !payload || typeof payload !== "object" || Array.isArray(payload)) return [];
          return [{
            id: item.id.slice(0, 100),
            created_at: text(item.created_at, 80),
            payload: payload as Record<string, unknown>,
          }];
        })
      : [];

    let assessment: SavedAssessment | null = null;
    if (parsed.assessment && typeof parsed.assessment === "object" && !Array.isArray(parsed.assessment)) {
      const saved = parsed.assessment as Record<string, unknown>;
      const answerRecord = saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers)
        ? saved.answers as Record<string, unknown>
        : {};
      const answers = Object.fromEntries(
        Object.entries(answerRecord).filter(([, value]) =>
          typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5,
        ).map(([key, value]) => [key, Number(value)]),
      );
      const results =
        saved.results && typeof saved.results === "object" && !Array.isArray(saved.results)
          ? saved.results as Record<string, unknown>
          : null;
      assessment = {
        answers,
        completed: saved.completed === true && results !== null,
        results,
        updated_at: text(saved.updated_at, 80),
      };
    }

    return {
      ...emptyStore(),
      profile: {
        full_name: text(profile.full_name, 100),
        region: text(profile.region, 100),
        intended_majors: text(profile.intended_majors, 200),
        graduation_year: number(profile.graduation_year, 2020, 2040),
        gpa_unweighted: number(profile.gpa_unweighted, 0, 5),
        gpa_weighted: number(profile.gpa_weighted, 0, 6),
        class_rank: text(profile.class_rank, 100),
        sat_score: number(profile.sat_score, 400, 1600),
        act_score: number(profile.act_score, 1, 36),
        ap_count: count(profile.ap_count),
        ib_count: count(profile.ib_count),
        honors_count: count(profile.honors_count),
      },
      ecs,
      awards,
      reports,
      assessment,
    };
  } catch {
    return emptyStore();
  }
}

export function saveStore(patch: Partial<Store>): Store {
  const next = { ...loadStore(), ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage can be disabled or full (private browsing, quota). Keep the
      // in-memory interaction alive rather than crashing the current screen.
    }
  }
  return next;
}

export function saveReport(payload: Record<string, unknown>): SavedReport {
  const report: SavedReport = { id: newId(), created_at: new Date().toISOString(), payload };
  const { reports } = loadStore();
  saveStore({ reports: [report, ...reports] });
  return report;
}

export function getReport(id: string): SavedReport | undefined {
  return loadStore().reports.find((r) => r.id === id);
}

export function saveAssessment(patch: Partial<SavedAssessment>): SavedAssessment {
  const current = loadStore().assessment ?? {
    answers: {},
    completed: false,
    results: null,
    updated_at: new Date().toISOString(),
  };
  const next: SavedAssessment = { ...current, ...patch, updated_at: new Date().toISOString() };
  saveStore({ assessment: next });
  return next;
}

export function clearAll() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Storage may be unavailable.
    }
  }
}
