 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile", href: "/dashboard/profile" },
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
    <aside className="w-full overflow-y-auto rounded-xl border bg-white p-3 shadow-sm md:sticky md:top-20 md:h-[calc(100vh-6rem)] md:w-60">
      <ul className="flex gap-1 overflow-x-auto pb-1 text-sm md:block md:space-y-1 md:overflow-visible md:pb-0">
        {NAV_ITEMS.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2 whitespace-nowrap transition-colors",
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

