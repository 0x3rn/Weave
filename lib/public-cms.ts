import "server-only";
import { sql, iso } from "./neon";
export type PublicCmsDocument = Record<string, unknown> & {
  id: string;
  kind: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  featured_image: string | null;
  og_image: string | null;
  canonical_url: string | null;
  category: string;
  publish_at: string;
  author: string;
};
export const publishedPredicate =
  "(d.status='published'and(d.publish_at is null or d.publish_at<=now())or d.status='scheduled'and d.publish_at<=now())";
export async function publicDocument(kind: string, slug: string) {
  const [row] = await sql.query(
    `select d.id,d.kind,d.title,d.slug,d.content,d.excerpt,d.seo_title,d.seo_description,d.featured_image,d.og_image,d.canonical_url,d.category,d.tags,d.publish_at,coalesce(a.name,u.full_name,'Weave')as author from cms_documents d left join users u on u.id=d.author_id left join cms_taxonomy a on a.kind='author'and a.user_id=d.author_id where d.kind=$1 and d.slug=$2 and ${publishedPredicate} limit 1`,
    [kind, slug],
  );
  return row
    ? ({ ...row, publish_at: iso(row.publish_at) } as PublicCmsDocument)
    : null;
}
export async function publicBlog(
  filters: { q?: string; category?: string; page?: string } = {},
) {
  const page = Math.max(1, Number.parseInt(filters.page || "1") || 1),
    args = [
      (filters.q || "").slice(0, 200),
      (filters.category || "").slice(0, 80),
    ];
  const where = `d.kind='post'and ${publishedPredicate}and($1::text=''or d.title ilike '%'||$1||'%'or d.excerpt ilike '%'||$1||'%')and($2::text=''or d.category=$2)`;
  const [rows, count, categories] = await Promise.all([
    sql.query(
      `select d.id,d.title,d.slug,d.excerpt,d.category,d.featured_image,d.publish_at,coalesce(u.full_name,'Weave')as author from cms_documents d left join users u on u.id=d.author_id where ${where} order by d.publish_at desc,d.id limit 12 offset $3`,
      [...args, (page - 1) * 12],
    ),
    sql.query(
      `select count(*)::int as count from cms_documents d where ${where}`,
      args,
    ),
    sql.query(
      `select distinct d.category from cms_documents d where d.kind='post'and ${publishedPredicate}and d.category<>''order by category`,
    ),
  ]);
  return {
    rows: rows.map(
      (row) =>
        ({ ...row, publish_at: iso(row.publish_at) }) as PublicCmsDocument,
    ),
    total: Number(count[0].count),
    page,
    categories: categories.map((row) => String(row.category)),
  };
}
export async function publicSiteContent() {
  const [documents, settings] = await Promise.all([
    sql.query(
      `select d.id,d.kind,d.title,d.slug,d.content,d.placement,d.links from cms_documents d where d.kind in('navigation','global','faq')and ${publishedPredicate}order by d.sort_order,d.title`,
    ),
    sql.query(
      "select value from platform_settings where section in('general','cms')order by section",
    ),
  ]);
  return {
    documents,
    settings: settings.reduce(
      (out, row) => ({ ...out, ...row.value }),
      {} as Record<string, unknown>,
    ),
  };
}
