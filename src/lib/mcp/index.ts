import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getAdmissionsProfile from "./tools/get-admissions-profile";
import listActivities from "./tools/list-activities";
import listStrategyReports from "./tools/list-strategy-reports";
import getStrategyReport from "./tools/get-strategy-report";
import getMajorAssessment from "./tools/get-major-assessment";

// Issuer must be the direct Supabase host; VITE_SUPABASE_PROJECT_ID is inlined at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "unicompass-mcp",
  title: "UniCompass",
  version: "0.1.0",
  instructions:
    "Tools for UniCompass, a university admissions guidance app. Read the signed-in student's admissions profile, activities and awards, generated strategy reports (reach/target/safety universities, gaps, next steps), and their 'Find Your Major' assessment results. All tools are read-only and scoped to the authenticated user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getAdmissionsProfile,
    listActivities,
    listStrategyReports,
    getStrategyReport,
    getMajorAssessment,
  ],
});
