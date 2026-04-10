"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { asArray, asPaginated } from "@/lib/api/normalize";
import type { User } from "@/types/user.types";

interface DashboardStatsData {
  customers: number;
  users: number;
  assignments: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>({
    customers: 0,
    users: 0,
    assignments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [customersRes, usersRes] = await Promise.all([
          apiGet<unknown>("/customers?page=1&limit=1"),
          apiGet<unknown>("/users"),
        ]);

        const customersPage = asPaginated<unknown>(customersRes);
        const users = asArray<User>(usersRes);

        const assignmentsCount = users.reduce(
          (sum: number, user: User) => sum + (user._count?.assignments ?? 0),
          0,
        );

        const totalCustomers =
          typeof customersPage.meta?.total === "number"
            ? customersPage.meta.total
            : customersPage.data.length;

        setStats({
          customers: totalCustomers,
          users: users.length,
          assignments: assignmentsCount,
        });
      } catch (loadError: unknown) {
        const message =
          typeof loadError === "object" &&
          loadError !== null &&
          "message" in loadError
            ? String((loadError as { message: unknown }).message)
            : "Could not load dashboard data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, []);

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Customers</p>
        <p className="mt-1 text-2xl font-semibold">
          {isLoading ? "..." : stats.customers}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Users</p>
        <p className="mt-1 text-2xl font-semibold">
          {isLoading ? "..." : stats.users}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Assignments</p>
        <p className="mt-1 text-2xl font-semibold">
          {isLoading ? "..." : stats.assignments}
        </p>
      </div>
    </div>
  );
}

