"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
export function SiteManagedContent({ placement }: { placement: string }) {
  const [data, setData] = useState<{
    documents: Record<string, unknown>[];
    settings: Record<string, unknown>;
  } | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/content/site")
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (
          live &&
          v &&
          typeof v === "object" &&
          "documents" in v &&
          "settings" in v
        )
          setData(
            v as {
              documents: Record<string, unknown>[];
              settings: Record<string, unknown>;
            },
          );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!data) return null;
  const docs = data.documents.filter((d) => d.placement === placement);
  return (
    <>
      {placement === "announcement" && Boolean(data.settings.announcement) && (
        <div className="bg-primary text-white text-center p-3 text-sm">
          {String(data.settings.announcement)}
        </div>
      )}
      {docs.map((d) => (
        <section key={String(d.id)} className="container mx-auto p-4">
          {d.kind === "navigation" ? (
            <nav
              className="flex flex-wrap gap-4"
              aria-label={"Managed " + placement + " links"}
            >
              {(Array.isArray(d.links) ? d.links : [])
                .filter(
                  (v) =>
                    v && typeof v.href === "string" && /^\/(?!\/)/.test(v.href),
                )
                .map((link, i) => (
                  <Link
                    key={i}
                    className="text-sm hover:underline"
                    href={String(link.href)}
                  >
                    {String(link.label)}
                  </Link>
                ))}
            </nav>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <Markdown>{String(d.content || "")}</Markdown>
            </div>
          )}
        </section>
      ))}
      {placement === "footer" && (
        <div className="container mx-auto p-4 text-sm text-muted">
          {Boolean(data.settings.contactInformation) && (
            <p>{String(data.settings.contactInformation)}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(data.settings.socialLinks)
              ? data.settings.socialLinks
              : []
            )
              .filter((v) => typeof v === "string" && v.startsWith("https://"))
              .map((url: string) => (
                <a key={url} href={url} rel="noreferrer" target="_blank">
                  {new URL(url).hostname}
                </a>
              ))}
            {(Array.isArray(data.settings.legalLinks)
              ? data.settings.legalLinks
              : []
            )
              .filter((v) => typeof v === "string" && /^\/(?!\/)/.test(v))
              .map((path: string) => (
                <Link key={path} href={path}>
                  {path.split("/").at(-1)}
                </Link>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
