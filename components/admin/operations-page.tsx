import OperationsClient from "./operations-client";
import { getAdminList } from "@/lib/admin-ops-data";
import { type AdminArea, AREA_META } from "@/lib/admin-ops-types";
export default async function OperationsPage({
  area,
  searchParams,
}: {
  area: AdminArea;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const filters = Object.fromEntries(
    Object.entries(p).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : [],
    ),
  );
  try {
    return (
      <OperationsClient
        initial={await getAdminList(area, filters)}
        selected={filters.id}
      />
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-border p-6">
        <h1 className="text-2xl font-bold">{AREA_META[area].title}</h1>
        <p role="alert" className="mt-3">
          {error instanceof Error && error.message.startsWith("Forbidden")
            ? "Your administrator role does not permit access to this section."
            : "This section could not load. Check the database migration and retry."}
        </p>
      </section>
    );
  }
}
