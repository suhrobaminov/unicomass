import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileWizard } from "@/components/profile-wizard";
import { ReportsList } from "@/components/reports-list";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — youradviser" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold">Your workspace</h1>
        <p className="mt-2 text-muted-foreground">Build your profile, then generate strategy reports on demand.</p>
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
