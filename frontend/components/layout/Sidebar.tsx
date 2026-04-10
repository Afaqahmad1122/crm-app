 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Customers", href: "/dashboard/customers" },
  { label: "Notes", href: "/dashboard/notes" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Assignments", href: "/dashboard/assignments" },
];

export const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="sticky top-20 h-[calc(100vh-6rem)] w-60 overflow-y-auto rounded-xl border bg-white p-3 shadow-sm">
      <ul className="space-y-1 text-sm">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2 transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

