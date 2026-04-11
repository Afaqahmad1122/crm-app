"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import { Layout } from "@/components/layout/Layout";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/errors";
import { clearAuthToken, getAuthToken } from "@/lib/api/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const token = getAuthToken();
  const meQuery = useQuery({
    queryKey: ["auth", "me", "guard"],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!meQuery.isError) return;

    const isUnauthorized =
      meQuery.error instanceof ApiError && meQuery.error.statusCode === 401;
    if (isUnauthorized) {
      clearAuthToken();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [token, pathname, router, meQuery.isError, meQuery.error]);

  if (!token || meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Spinner className="mr-2 size-4" />
        Checking session...
      </div>
    );
  }

  if (meQuery.isError) {
    return null;
  }

  return <Layout>{children}</Layout>;
}

