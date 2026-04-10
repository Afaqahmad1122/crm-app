import { Suspense } from "react";
import { LoginClient } from "./login-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-gray-50 px-4 py-10">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
