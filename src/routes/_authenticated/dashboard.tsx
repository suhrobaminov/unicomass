import { createFileRoute, Link } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileWizard } from "@/components/profile-wizard";
import { ReportsList } from "@/components/reports-list";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — UniCompass" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">Your workspace</h1>
          <p className="mt-2 text-muted-foreground">Build your profile, then generate strategy reports on demand.</p>
        </div>
        <Link to="/find-your-major">
          <Button className="bg-brand text-white shadow-elegant hover:opacity-95">
            <Compass className="mr-2 h-4 w-4" /> Find Your Major <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="reports">My Strategy Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileWizard /></TabsContent>
        <TabsContent value="reports" className="mt-6"><ReportsList /></TabsContent>
      </Tabs>
    </main>
  );
}

