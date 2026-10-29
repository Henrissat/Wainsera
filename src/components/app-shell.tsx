"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Wine,
  LayoutDashboard,
  Library,
  CalendarClock,
  MapPin,
  Plus,
  LogOut,
  LogIn,
  FileUp,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function AppShell({
  unreadAlerts = 0,
  userEmail,
  userName,
  isLoggedIn = false,
  children,
}: {
  unreadAlerts?: number;
  userEmail?: string | null;
  userName?: string | null;
  isLoggedIn?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const label = userName || userEmail || "";
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const navItems: NavItem[] = [
    { href: "/", label: "Accueil", icon: LayoutDashboard },
    { href: "/inventaire", label: "Inventaire", icon: Library },
    {
      href: "/a-boire",
      label: "À boire",
      icon: CalendarClock,
      badge: isLoggedIn && unreadAlerts > 0 ? unreadAlerts : undefined,
    },
    ...(isLoggedIn
      ? [
          { href: "/emplacements", label: "Emplacements", icon: MapPin },
          { href: "/importer", label: "Importer", icon: FileUp },
        ]
      : []),
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (isAuthPage) {
    return (
      <div className="min-h-full">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        <main className="mx-auto w-full max-w-md px-4 py-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wine className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-primary">
              Wainsera
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Cave personnelle</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge != null && (
                  <span className="rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sortir
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <LogIn className="h-3.5 w-3.5" />
                Connexion
              </Link>
            )}
          </div>
          {isLoggedIn && label && (
            <p className="truncate px-2 text-xs text-muted-foreground" title={userEmail ?? undefined}>
              {label}
            </p>
          )}
          {isLoggedIn && (
            <Link
              href="/ajouter"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Link>
          )}
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Top bar mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wine className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-bold text-primary">
              Wainsera
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {isLoggedIn && (
              <Link
                href="/importer"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Importer"
              >
                <FileUp className="h-4 w-4" />
                Import
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {isLoggedIn ? (
              <Link
                href="/ajouter"
                className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                aria-label="Ajouter"
              >
                <Plus className="h-6 w-6" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                aria-label="Connexion"
              >
                <LogIn className="h-5 w-5" />
              </Link>
            )}

            {navItems
              .slice(2)
              .filter((item) => item.href !== "/importer")
              .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.badge != null && (
                    <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-warning" />
                  )}
                </Link>
              );
            })}

            {!isLoggedIn && navItems.length < 3 && (
              <Link
                href="/login"
                className="flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted-foreground"
              >
                <LogIn className="h-5 w-5" />
                Compte
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
