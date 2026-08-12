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
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      ...emptyStore(),
      ...parsed,
      profile: { ...EMPTY_PROFILE, ...(parsed.profile ?? {}) },
    };
  } catch {
    return emptyStore();
  }
}

export function saveStore(patch: Partial<Store>): Store {
  const next = { ...loadStore(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
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
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}
