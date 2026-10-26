"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wine, Home, CalendarClock, MapPin, Plus } from "lucide-react";

const navItems = [
  { href: "/", label: "Inventaire", icon: Home },
  { href: "/a-boire", label: "À boire", icon: CalendarClock },
  { href: "/emplacements", label: "Emplacements", icon: MapPin },
];

export function Navbar({ unreadAlerts = 0 }: { unreadAlerts?: number }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Wine className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-display text-lg font-bold leading-none text-primary">
                  Wainsera
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cave à vin personnelle
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                const showBadge =
                  item.href === "/a-boire" && unreadAlerts > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {showBadge && (
                      <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                        {unreadAlerts > 9 ? "9+" : unreadAlerts}
                      </span>
                    )}
                  </Link>
                );
              })}
              <Link
                href="/ajouter"
                className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const showBadge = item.href === "/a-boire" && unreadAlerts > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
                {showBadge && (
                  <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
          <Link
            href="/ajouter"
            className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary transition-colors"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
            </span>
            Ajouter
          </Link>
        </div>
      </nav>
    </>
  );
}
