import { adminSession } from "@/lib/admin-ops-access";
import { hasPermission } from "@/lib/admin-ops-types";
import { sql } from "@/lib/neon";
import Markdown from "react-markdown";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Content Preview",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await adminSession();
  const { id } = await params;
  const [d] = await sql.query(
    "select kind,title,content,featured_image,status from cms_documents where id=$1",
    [id],
  );
  if (!d) notFound();
  if (
    !hasPermission(s.permissions, d.kind === "post" ? "blog.read" : "cms.read")
  )
    throw new Error("Forbidden");
  return (
    <article className="max-w-4xl mx-auto space-y-5">
      <p className="rounded-lg bg-surface-secondary p-3">
        Private saved preview · {String(d.status)}
      </p>
      <h1 className="text-4xl font-bold">{String(d.title)}</h1>
      {d.featured_image && (
        <img
          src={String(d.featured_image)}
          alt=""
          className="rounded-xl max-h-96"
        />
      )}
      <div className="prose dark:prose-invert">
        <Markdown>{String(d.content)}</Markdown>
      </div>
    </article>
  );
}
