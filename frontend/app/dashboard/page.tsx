import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Welcome back. Use the sidebar to navigate between modules.
      </p>
      <DashboardStats />
    </div>
  );
}
