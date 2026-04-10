 "use client";

import { useRouter } from "next/navigation";
import { authApi } from "@/api/auth.api";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const router = useRouter();

  const onLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <span className="text-sm font-semibold">CRM App</span>
        <Button variant="outline" size="sm" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
};

