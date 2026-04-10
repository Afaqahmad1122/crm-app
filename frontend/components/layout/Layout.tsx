import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-4 p-4">
        <Sidebar />
        <main className="flex-1 rounded-lg bg-white p-4 shadow-sm">{children}</main>
      </div>
    </div>
  );
};

