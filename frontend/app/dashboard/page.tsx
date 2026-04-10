import { Layout } from "@/components/layout/Layout";

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          You are logged in. Use the sidebar to navigate.
        </p>
      </div>
    </Layout>
  );
}

