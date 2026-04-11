"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import { Layout } from "@/components/layout/Layout";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/errors";
import { clearAuthToken } from "@/lib/api/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const meQuery = useQuery({
    queryKey: ["auth", "me", "guard"],
    queryFn: authApi.me,
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!meQuery.isError) return;

    const isUnauthorized =
      meQuery.error instanceof ApiError && meQuery.error.statusCode === 401;
    if (isUnauthorized) {
      clearAuthToken();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, meQuery.isError, meQuery.error]);

  if (meQuery.isLoading) {
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

