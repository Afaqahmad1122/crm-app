"use client";

import { authApi } from "@/api/auth.api";
import { QueryState } from "@/components/reusable";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account details from the authenticated session.
        </p>
      </div>

      <QueryState
        isLoading={meQuery.isLoading}
        isError={meQuery.isError}
        errorMessage={meQuery.error?.message}
        isEmpty={!meQuery.data}
        emptyTitle="Profile not found"
        emptyDescription="No user data was returned from the server."
        onRetry={() => {
          void meQuery.refetch();
        }}
        loadingText="Loading profile..."
      >
        <div className="rounded-lg border bg-card p-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{meQuery.data?.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{meQuery.data?.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="break-all font-mono text-xs">{meQuery.data?.id}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void meQuery.refetch();
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
