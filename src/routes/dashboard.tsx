import { createFileRoute, Link } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileWizard } from "@/components/profile-wizard";
import { ReportsList } from "@/components/reports-list";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — UniCompass" },
      { name: "description", content: "Your admissions profile, saved strategy reports and next steps." },
      { property: "og:title", content: "Dashboard — UniCompass" },
      { property: "og:description", content: "Your admissions profile, saved strategy reports and next steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
    <PageHeading eyebrow="Your admissions workspace" title="Find your universities" description="Build your profile, explore your fit, and make a plan for what comes next."><Button asChild variant="outline" className="shell-outline"><Link to="/find-your-major"><Compass />Find Your Major<ArrowRight /></Link></Button></PageHeading>
    <main className="site-width py-8 sm:py-10">
      <Tabs defaultValue="profile">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-lg border bg-card p-1 sm:w-auto">
          <TabsTrigger value="profile">Build my profile</TabsTrigger>
          <TabsTrigger value="reports">Saved reports</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileWizard /></TabsContent>
        <TabsContent value="reports" className="mt-6"><ReportsList /></TabsContent>
      </Tabs>
    </main>
    </>
  );
}

