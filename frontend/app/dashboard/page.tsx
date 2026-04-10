export default function DashboardPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Welcome back. Use the sidebar to navigate between modules.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Customers</p>
          <p className="mt-1 text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Users</p>
          <p className="mt-1 text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assignments</p>
          <p className="mt-1 text-2xl font-semibold">0</p>
        </div>
      </div>
    </div>
  );
}
