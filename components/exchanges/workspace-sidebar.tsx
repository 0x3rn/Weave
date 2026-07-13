"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, FolderGit2, CheckSquare, Activity, StickyNote } from "lucide-react";

interface WorkspaceSidebarProps {
  exchangeId: string;
}

export default function WorkspaceSidebar({ exchangeId }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const basePath = `/exchanges/${exchangeId}`;

  const navItems = [
    { name: "Overview", href: basePath, icon: LayoutDashboard },
    { name: "Messages", href: `${basePath}/messages`, icon: MessageSquare },
    { name: "Files", href: `${basePath}/files`, icon: FolderGit2 },
    { name: "Milestones", href: `${basePath}/milestones`, icon: CheckSquare },
    { name: "Activity", href: `${basePath}/activity`, icon: Activity },
    { name: "Notes", href: `${basePath}/notes`, icon: StickyNote },
  ];

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col hidden md:flex shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider">Workspace</h2>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-body hover:bg-surface-secondary hover:text-heading"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
