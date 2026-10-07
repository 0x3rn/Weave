"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useRouter } from "next/navigation";
import { type getAdminAnalytics } from "@/lib/admin-analytics";
import { readable } from "@/lib/admin-ops-types";
export default function AnalyticsClient({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminAnalytics>>;
}) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Analytics</h1>
      <p className="text-muted">
        Actual platform records · {data.start}–{data.end} · {data.timeZone}
      </p>
      <form
        action={(f) =>
          router.push(
            "/admin/analytics?from=" + f.get("from") + "&to=" + f.get("to"),
          )
        }
        className="flex flex-wrap gap-3"
      >
        <label>
          From
          <input
            name="from"
            type="date"
            defaultValue={data.start}
            className="block bg-surface border border-border rounded-lg p-2"
          />
        </label>
        <label>
          Through
          <input
            name="to"
            type="date"
            defaultValue={data.end}
            className="block bg-surface border border-border rounded-lg p-2"
          />
        </label>
        <button className="self-end rounded-lg bg-primary text-white px-4 py-2">
          Apply range
        </button>
        {[1, 7, 30, 90].map((n) => (
          <button
            type="button"
            key={n}
            className="self-end border border-border rounded-lg p-2"
            onClick={() => {
              const now = new Date();
              router.push(
                "/admin/analytics?from=" +
                  new Date(now.getTime() - (n - 1) * 86400000)
                    .toISOString()
                    .slice(0, 10) +
                  "&to=" +
                  now.toISOString().slice(0, 10),
              );
            }}
          >
            {n === 1 ? "Today" : n + " days"}
          </button>
        ))}
      </form>
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold mb-4">Growth & collaboration</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="members" stroke="#8b5cf6" />
              <Line type="monotone" dataKey="exchanges" stroke="#10b981" />
              <Line type="monotone" dataKey="hours" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details>
          <summary className="text-sm text-muted">
            Accessible chart data
          </summary>
          <table className="text-sm w-full">
            <thead>
              <tr>
                <th>Day</th>
                <th>Members</th>
                <th>Exchanges</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.series.map((r) => (
                <tr key={r.day}>
                  <td>{r.day}</td>
                  <td>{r.members}</td>
                  <td>{r.exchanges}</td>
                  <td>{r.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
      {(
        ["members", "marketplace", "exchanges", "escrow", "safety"] as const
      ).map((section) => (
        <section key={section}>
          <h2 className="text-xl font-semibold mb-3">{readable(section)}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data[section]).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <p className="text-sm text-muted">{readable(key)}</p>
                <p className="text-2xl font-bold">
                  {Number(value).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h2 className="text-xl font-semibold mb-3">Revenue by currency</h2>
        <p className="text-sm text-muted mb-3">
          Provider-verified payments and refunds. Monthly recurring revenue
          excludes unknown billing intervals. Active, verification, suspension,
          and subscription totals represent current state; exchange metrics
          describe the selected signup cohort.
        </p>
        <DataTable rows={data.revenue} />
      </section>
      <section>
        <h2 className="font-semibold mb-3">Most requested skills</h2>
        <DataTable rows={data.skills} />
      </section>
      <section>
        <h2 className="font-semibold mb-3">Member cohorts</h2>
        <p className="text-sm text-muted mb-3">
          Returned after 30 days uses the last recorded activity date. Cohorts
          under 30 days remain incomplete.
        </p>
        <DataTable rows={data.retention} />
      </section>
    </div>
  );
}
function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length)
    return <p className="text-muted">No records in this period.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {Object.keys(rows[0]).map((k) => (
              <th key={k} className="p-3">
                {readable(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {Object.entries(row).map(([key, value]) => (
                <td key={key} className="p-3">
                  {String(value ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
