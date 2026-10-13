import { describe, expect, test } from "bun:test";
import { buildProfileRow } from "./profile-sync";
import { EMPTY_PROFILE } from "./local-store";

describe("buildProfileRow", () => {
  test("writes only academic profile columns, never credentials", () => {
    const row = buildProfileRow("u1", { ...EMPTY_PROFILE, full_name: "Ann" });
    expect(Object.keys(row).sort()).toEqual([
      "act_score", "ap_count", "class_rank", "full_name", "gpa_unweighted", "gpa_weighted",
      "graduation_year", "honors_count", "ib_count", "intended_majors", "region", "sat_score", "user_id",
    ]);
  });
  test("blank text becomes null", () => {
    expect(buildProfileRow("u1", { ...EMPTY_PROFILE, region: "  " }).region).toBeNull();
  });
});
