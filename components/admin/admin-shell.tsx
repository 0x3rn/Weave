"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, Search, ExternalLink, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasPermission } from "@/lib/admin-ops-types";
import {
  searchAdmin,
  adminAlerts,
  markAdminAlertRead,
} from "@/app/actions/admin/navigation";
const groups = [
  {
    name: "Overview",
    items: [
      ["Dashboard", "/admin", "legacy.manage"],
      ["Invites", "/admin/invites", "legacy.manage"],
    ],
  },
  {
    name: "Members",
    items: [
      ["Users", "/admin/users", "legacy.manage"],
      ["Verification", "/admin/verification", "verification.read"],
      ["Reports", "/admin/reports", "reports.read"],
    ],
  },
  {
    name: "Marketplace",
    items: [
      ["Marketplace", "/admin/marketplace", "marketplace.read"],
      ["Exchanges", "/admin/exchanges", "exchanges.read"],
      ["Escrow", "/admin/escrow", "escrow.read"],
      ["Skill Hour Ledger", "/admin/skill-ledger", "ledger.read"],
      ["Disputes", "/admin/disputes", "disputes.read"],
    ],
  },
  {
    name: "Business",
    items: [["Subscriptions", "/admin/subscriptions", "subscriptions.read"]],
  },
  {
    name: "Content",
    items: [
      ["CMS", "/admin/cms", "cms.read"],
      ["Blog", "/admin/blog", "blog.read"],
      ["Announcements", "/admin/notifications", "announcements.read"],
    ],
  },
  {
    name: "Insights",
    items: [["Analytics", "/admin/analytics", "analytics.read"]],
  },
  {
    name: "Operations",
    items: [["Support", "/admin/support", "support.read"]],
  },
  {
    name: "System",
    items: [
      ["Settings", "/admin/settings", "settings.read"],
      ["Audit Logs", "/admin/audit-logs", "audit.read"],
    ],
  },
];
export default function AdminShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: { name: string; role: string; permissions: string[] };
}) {
  const pathname = usePathname(),
    [mobile, setMobile] = useState(false),
    [q, setQ] = useState(""),
    [results, setResults] = useState<Awaited<ReturnType<typeof searchAdmin>>>(
      [],
    ),
    [alerts, setAlerts] = useState<Awaited<ReturnType<typeof adminAlerts>>>([]),
    [showAlerts, setShowAlerts] = useState(false),
    [error, setError] = useState("");
  const drawer = useRef<HTMLElement>(null);
  const navigation = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => hasPermission(session.permissions, i[2])),
    }))
    .filter((g) => g.items.length);
  const home = navigation[0]?.items[0]?.[1] || "/dashboard";
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      searchAdmin(q)
        .then((v) => {
          if (live) setResults(v);
        })
        .catch(() => {
          if (live) setError("Search unavailable. Retry.");
        });
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [q]);
  useEffect(() => {
    if (!mobile) return;
    const focused = document.activeElement as HTMLElement;
    drawer.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
      if (e.key === "Tab") {
        const nodes = drawer.current?.querySelectorAll<HTMLElement>("a,button");
        const first = nodes?.[0],
          last = nodes?.[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      focused?.focus();
    };
  }, [mobile]);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobile && (
        <button
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        ref={drawer}
        tabIndex={-1}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile || undefined}
        aria-label="Admin navigation"
        className={
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface flex flex-col lg:static " +
          (mobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
      >
        <div className="h-16 shrink-0 px-5 flex items-center justify-between border-b border-border">
          <Link href={home} className="font-bold text-xl text-primary">
            Weave <span className="text-xs text-muted">Admin</span>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setMobile(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin sections">
          {navigation.map((g) => (
            <div key={g.name} className="mb-4">
              <p className="text-xs uppercase tracking-wider text-muted px-3 mb-1">
                {g.name}
              </p>
              {g.items.map(([name, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobile(false)}
                  aria-current={pathname === href ? "page" : undefined}
                  className={
                    "block rounded-lg px-3 py-2 text-sm " +
                    (pathname === href
                      ? "bg-heading text-background"
                      : "text-muted hover:bg-surface-secondary")
                  }
                >
                  {name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <Link
          href="/dashboard"
          className="p-4 border-t border-border text-sm flex gap-2"
        >
          <ExternalLink size={16} />
          Exit Admin
        </Link>
      </aside>
      <div className="min-w-0 flex-1 flex flex-col">
        <header className="border-b border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-3">
          <button
            className="lg:hidden"
            onClick={() => setMobile(true)}
            aria-label="Open admin navigation"
            aria-expanded={mobile}
          >
            <Menu />
          </button>
          <div className="relative flex-1 min-w-40 max-w-xl">
            <label className="flex items-center gap-2 rounded-lg border border-border px-3">
              <Search size={16} />
              <input
                aria-label="Search admin records"
                placeholder="Search members, exchanges, cases…"
                maxLength={200}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setError("");
                }}
                className="w-full py-2 bg-transparent text-sm outline-none"
              />
            </label>
            {q.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-surface z-30 shadow-xl max-h-80 overflow-y-auto">
                {results.map((r) => (
                  <Link
                    key={r.area + r.id}
                    className="block p-3 border-b border-border text-sm hover:bg-surface-secondary"
                    href={r.href}
                    onClick={() => setQ("")}
                  >
                    {r.title}
                    <span className="block text-xs text-muted">
                      {r.area} · {r.id}
                    </span>
                  </Link>
                ))}
                {!results.length && (
                  <p className="p-3 text-sm text-muted">
                    {error || "No matching records."}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              aria-label="Admin notifications"
              aria-expanded={showAlerts}
              className="p-2 rounded-lg hover:bg-surface-secondary"
              onClick={async () => {
                setShowAlerts(!showAlerts);
                if (!showAlerts)
                  try {
                    setAlerts(await adminAlerts());
                  } catch {
                    setError("Notifications unavailable. Retry.");
                  }
              }}
            >
              <Bell size={20} />
            </button>
            {showAlerts && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[85vw] max-h-96 overflow-y-auto z-30 rounded-xl border border-border bg-surface shadow-xl">
                <div className="p-3 font-semibold">
                  Operations requiring attention
                </div>
                {alerts.map((a) => (
                  <div key={a.id} className="p-3 border-t border-border">
                    <Link
                      href={a.href}
                      onClick={() => setShowAlerts(false)}
                      className={
                        "text-sm " + (a.read ? "text-muted" : "font-semibold")
                      }
                    >
                      {a.title}
                    </Link>
                    {!a.read && (
                      <button
                        className="block text-xs text-primary mt-1"
                        onClick={async () => {
                          try {
                            await markAdminAlertRead(a.id);
                            setAlerts((current) =>
                              current.map((v) =>
                                v.id === a.id ? { ...v, read: true } : v,
                              ),
                            );
                          } catch {
                            setError(
                              "Could not mark notification read. Retry.",
                            );
                          }
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))}
                {!alerts.length && (
                  <p className="p-3 text-sm text-muted">
                    {error || "No outstanding alerts."}
                  </p>
                )}
                {alerts.length > 0 && error && (
                  <p role="alert" className="p-3 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
          <ThemeToggle />
          <Link href="/admin/help" aria-label="Admin help">
            <HelpCircle size={20} />
          </Link>
          <div className="text-right text-xs">
            <p className="font-semibold">{session.name}</p>
            <p className="text-muted">{session.role}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
