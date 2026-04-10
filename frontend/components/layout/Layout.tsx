import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 sm:p-4 md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          {children}
        </main>
      </div>
    </div>
  );
};

