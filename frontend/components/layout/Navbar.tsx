"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const onLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <span className="text-sm font-semibold">CRM App</span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/profile">Profile</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
