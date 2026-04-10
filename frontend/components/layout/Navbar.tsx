"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/api/auth.api";
import { clearStoredAuthToken } from "@/lib/auth/token-storage";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const router = useRouter();

  const onLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* still clear client session */
    } finally {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      });
      clearStoredAuthToken();
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <span className="text-sm font-semibold">CRM App</span>
        <div className="flex items-center gap-2">
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
