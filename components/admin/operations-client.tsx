"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Markdown from "react-markdown";
import BillingOperationHistory from "./billing-operation-history";
import {
  Search,
  Download,
  Plus,
  X,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  AREA_META,
  readable,
  hasPermission,
  type AdminList,
  type AdminDetail,
  type AdminArea,
} from "@/lib/admin-ops-types";
import {
  readAdminRecord,
  readAdminHistory,
  mutateAdminRecord,
  adminLookups,
  saveContentTaxonomy,
} from "@/app/actions/admin/operations";
import { uploadAdminAsset } from "@/app/actions/admin/uploads";
import { inspectAdminEvidence } from "@/app/actions/admin/evidence";
import { adminBillingOperation } from "@/app/actions/admin/billing-operations";

const control =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const button =
  "rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-secondary disabled:opacity-50";
const date = (value: string, tz: string) =>
  value ? new Date(value).toLocaleString(undefined, { timeZone: tz }) : "—";
function csvCell(value: unknown) {
  let v = String(value ?? "");
  if (/^[=+@\-\t\r]/.test(v)) v = "'" + v;
  return '"' + v.replaceAll('"', '""') + '"';
}
function download(rows: Record<string, string>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.map(csvCell).join(","),
    ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export default function OperationsClient({
  initial,
  selected,
}: {
  initial: AdminList;
  selected?: string;
}) {
  const router = useRouter(),
    params = useSearchParams(),
    meta = AREA_META[initial.area];
  const [detail, setDetail] = useState<AdminDetail | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [newRecord, setNewRecord] = useState(false);
  const openRequest = useRef(0);
  async function open(id: string) {
    const request = ++openRequest.current;
    setLoading(true);
    setError("");
    try {
      const record = await readAdminRecord(initial.area, id);
      if (request !== openRequest.current) return;
      setDetail(record);
      setNewRecord(false);
    } catch (e) {
      if (request === openRequest.current)
        setError(e instanceof Error ? e.message : "Could not load record");
    } finally {
      if (request === openRequest.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (selected) {
      let live = true;
      readAdminRecord(initial.area, selected)
        .then((v) => {
          if (live) setDetail(v);
        })
        .catch((e) => {
          if (live) setError(String(e.message));
        });
      return () => {
        live = false;
      };
    }
  }, [selected, initial.area]);
  const create = () => {
    setNewRecord(true);
    setDetail({
      id: crypto.randomUUID(),
      area: initial.area,
      title:
        "New " +
        (initial.area === "blog"
          ? "post"
          : initial.area === "cms"
            ? "content"
            : "adjustment"),
      status: "draft",
      sections: [],
      history: [],
      actions: [initial.area === "skill-ledger" ? "adjust" : "save"],
    });
  };
  function filter(form: FormData) {
    const query = new URLSearchParams();
    for (const [key, v] of form.entries())
      if (String(v)) query.set(key, String(v));
    router.push("/admin/" + initial.area + "?" + query.toString());
  }
  const pageLink = (page: number) => {
    const q = new URLSearchParams(params.toString());
    q.set("page", String(page));
    q.delete("id");
    return "/admin/" + initial.area + "?" + q;
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">{meta.title}</h1>
          <p className="mt-1 text-muted">{meta.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            className={button}
            onClick={() => router.refresh()}
            aria-label="Refresh records"
          >
            <RefreshCw size={16} />
          </button>
          <button
            className={button}
            onClick={() =>
              download(
                initial.rows.map((row) => ({
                  ID: row.id,
                  Title: row.title,
                  Status: row.status,
                  Created: row.date,
                  ...row.cells,
                })),
                initial.area + "-page-" + initial.page + ".csv",
              )
            }
            disabled={!initial.rows.length}
          >
            <Download size={16} className="inline mr-2" />
            Export this page
          </button>
          {initial.canWrite &&
            ["cms", "blog", "skill-ledger"].includes(initial.area) && (
              <button
                className={button + " bg-primary text-white"}
                onClick={create}
              >
                <Plus size={16} className="inline mr-1" />
                {initial.area === "skill-ledger" ? "Adjust Hours" : "Create"}
              </button>
            )}
        </div>
      </div>
      {!!initial.summary.length && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {initial.summary.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
              {s.detail && <p className="text-xs text-muted">{s.detail}</p>}
            </div>
          ))}
        </div>
      )}
      <form
        action={filter}
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3 xl:grid-cols-6"
      >
        <label className="sm:col-span-2 text-sm">
          Search
          <input
            name="q"
            defaultValue={params.get("q") || ""}
            className={control}
            placeholder="Search title, member, or record ID"
            maxLength={200}
          />
        </label>
        <label className="text-sm">
          Status
          <select
            name="status"
            className={control}
            defaultValue={params.get("status") || ""}
          >
            <option value="">All</option>
            {meta.statuses.map((s) => (
              <option key={s} value={s}>
                {readable(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          From
          <input
            type="date"
            name="from"
            className={control}
            defaultValue={params.get("from") || ""}
          />
        </label>
        <label className="text-sm">
          Through
          <input
            type="date"
            name="to"
            className={control}
            defaultValue={params.get("to") || ""}
          />
        </label>
        <label className="text-sm">
          Sort
          <select
            name="sort"
            className={control}
            defaultValue={params.get("sort") || "newest"}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
        {["reports", "disputes", "support"].includes(initial.area) && (
          <label className="text-sm">
            Priority
            <select
              name="priority"
              className={control}
              defaultValue={params.get("priority") || ""}
            >
              <option value="">All priorities</option>
              {["critical", "high", "normal", "low"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        {["marketplace", "reports", "support", "blog"].includes(
          initial.area,
        ) && (
          <label className="text-sm">
            Category
            <input
              name="category"
              className={control}
              defaultValue={params.get("category") || ""}
            />
          </label>
        )}
        <div className="flex items-end gap-2">
          <button className={button}>
            <Search size={14} className="inline mr-1" />
            Filter
          </button>
          <Link href={"/admin/" + initial.area} className={button}>
            Clear
          </Link>
        </div>
      </form>
      {notice && (
        <p role="status" className="rounded-lg border border-green-600 p-3">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-red-500 p-3">
          {error}
        </p>
      )}
      {loading && <p role="status">Loading record…</p>}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="p-3">Record</th>
              {meta.columns.map((c) => (
                <th key={c} className="p-3 whitespace-nowrap">
                  {c}
                </th>
              ))}
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initial.rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-border hover:bg-surface-secondary"
              >
                <td className="p-3 min-w-48">
                  <button
                    onClick={() => open(row.id)}
                    className="text-left font-medium text-primary hover:underline"
                  >
                    {row.title}
                  </button>
                  <p className="text-xs text-muted break-all">{row.id}</p>
                </td>
                {meta.columns.map((c) => (
                  <td key={c} className="p-3 max-w-60 break-words">
                    {row.cells[c]}
                  </td>
                ))}
                <td className="p-3">
                  <span className="rounded-full border border-border px-2 py-1 whitespace-nowrap">
                    {readable(row.status)}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  {date(row.date, initial.timeZone)}
                </td>
                <td className="p-3">
                  <button className={button} onClick={() => open(row.id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!initial.rows.length && (
              <tr>
                <td
                  colSpan={meta.columns.length + 4}
                  className="p-12 text-center text-muted"
                >
                  No records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>
          {initial.total} records · Page {initial.page} of{" "}
          {Math.max(1, Math.ceil(initial.total / initial.pageSize))} ·{" "}
          {initial.timeZone}
        </span>
        <div className="flex gap-2">
          {initial.page > 1 && (
            <Link className={button} href={pageLink(initial.page - 1)}>
              Previous
            </Link>
          )}
          {initial.page * initial.pageSize < initial.total && (
            <Link className={button} href={pageLink(initial.page + 1)}>
              Next
            </Link>
          )}
        </div>
      </div>
      {["cms", "blog"].includes(initial.area) && initial.canWrite && (
        <Taxonomy area={initial.area} />
      )}
      {detail && (
        <DetailPanel
          key={
            detail.id +
            detail.status +
            String(detail.version) +
            detail.history[0]?.id
          }
          detail={detail}
          isNew={newRecord}
          permissions={initial.permissions}
          timeZone={initial.timeZone}
          close={() => setDetail(null)}
          saved={async () => {
            setNotice("Changes saved and audit recorded.");
            router.refresh();
            if (!newRecord) await open(detail.id);
            else setDetail(null);
          }}
        />
      )}
    </div>
  );
}
function DetailPanel({
  detail,
  isNew,
  permissions,
  timeZone,
  close,
  saved,
}: {
  detail: AdminDetail;
  isNew: boolean;
  permissions: string[];
  timeZone: string;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const ref = useRef<HTMLDivElement>(null),
    inFlight = useRef(false),
    [action, setAction] = useState(detail.actions[0] || ""),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [history, setHistory] = useState(detail.history),
    [evidence, setEvidence] = useState<Awaited<
      ReturnType<typeof inspectAdminEvidence>
    > | null>(null),
    [lookups, setLookups] = useState<Awaited<
      ReturnType<typeof adminLookups>
    > | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [awards, setAwards] = useState({ providerAward: 0, requesterAward: 0 }),
    [op, setOp] = useState(() => crypto.randomUUID());
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !inFlight.current) close();
      if (e.key === "Tab") {
        const nodes = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button,input,select,textarea,a[href],[tabindex="0"]',
          ) || [],
        ).filter((el) => !el.hasAttribute("disabled"));
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      focused?.focus();
    };
  }, [close, pending]);
  useEffect(() => {
    const p = AREA_META[detail.area].write;
    if (
      [
        "skill-ledger",
        "support",
        "reports",
        "disputes",
        "cms",
        "blog",
      ].includes(detail.area) &&
      hasPermission(permissions, p)
    )
      adminLookups(p)
        .then(setLookups)
        .catch((e) => setError(e.message));
  }, [detail.area, permissions]);
  const isContent = ["cms", "blog"].includes(detail.area),
    financial =
      ["release", "refund", "resolve", "cancel", "reverse", "adjust"].includes(
        action,
      ) && !["reports", "support"].includes(detail.area);
  async function submit(form: FormData) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const data: Record<string, unknown> = Object.fromEntries(form.entries());
      data.confirmed = confirmed;
      if (data.deadline)
        data.deadline = new Date(String(data.deadline)).toISOString();
      const upload = form.get("attachment");
      if (upload instanceof File && upload.size) {
        const f = new FormData();
        f.set("file", upload);
        data.attachments = [await uploadAdminAsset("support", f)];
      }
      data.featured = form.get("featured") === "on";
      for (const k of ["amount", "providerAward", "requesterAward"])
        if (form.has(k)) data[k] = Number(form.get(k));
      const result =
        detail.area === "subscriptions" && action !== "note"
          ? await adminBillingOperation({
              userId: detail.id,
              action,
              reason,
              operationId: op,
              confirmed,
              amount: Number(form.get("amount") || 0),
              transactionId: String(form.get("transactionId") || ""),
            })
          : await mutateAdminRecord({
              area: detail.area,
              id: detail.id,
              action,
              data,
              reason,
              operationId: op,
            });
      if (!result.success) throw new Error(result.error || "Could not save");
      setOp(crypto.randomUUID());
      setReason("");
      setConfirmed(false);
      await saved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Retry.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  async function inspect() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      setEvidence(await inspectAdminEvidence(detail.area, detail.id, reason));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evidence unavailable");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={() => {
        if (!pending && !inFlight.current) close();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-title"
        className="w-full max-w-4xl h-full overflow-y-auto bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="record-title" className="text-xl font-bold">
              {detail.title}
            </h2>
            <p className="text-muted break-all">
              {detail.id} · {readable(detail.status)}
            </p>
          </div>
          <button
            aria-label="Close record"
            className={button}
            onClick={() => {
              if (!inFlight.current) close();
            }}
            disabled={pending}
          >
            <X size={18} />
          </button>
        </div>
        {!!detail.related?.length && (
          <div className="flex flex-wrap gap-3 my-4">
            {detail.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-primary underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        {isContent ? (
          <ContentEditor
            detail={detail}
            isNew={isNew}
            taxonomy={lookups?.taxonomy || []}
            members={lookups?.members || []}
            saved={saved}
            busy={(value) => {
              inFlight.current = value;
              setPending(value);
            }}
          />
        ) : (
          <>
            {detail.sections.map((section, i) => (
              <section
                key={i}
                className="my-5 rounded-xl border border-border bg-surface p-4"
              >
                <h3 className="font-semibold mb-3">{section.title}</h3>
                {section.text && (
                  <p className="whitespace-pre-wrap break-words">
                    {section.text}
                  </p>
                )}
                {section.fields && (
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {section.fields.map((f) => (
                      <div key={f.label}>
                        <dt className="text-xs text-muted">{f.label}</dt>
                        <dd className="text-sm whitespace-pre-wrap break-words">
                          {f.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {section.rows && (
                  <div className="overflow-x-auto">
                    {section.rows.length ? (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            {Object.keys(section.rows[0]).map((k) => (
                              <th key={k} className="p-2">
                                {k}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row, n) => (
                            <tr key={n} className="border-t border-border">
                              {Object.entries(row).map(([k, v]) => (
                                <td
                                  key={k}
                                  className="p-2 break-words max-w-80"
                                >
                                  {v}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-muted">No records yet.</p>
                    )}
                  </div>
                )}
              </section>
            ))}
            {["verification", "exchanges", "disputes", "reports"].includes(
              detail.area,
            ) &&
              hasPermission(
                permissions,
                detail.area === "verification"
                  ? "verification.sensitive"
                  : "exchanges.messages",
              ) && (
                <section className="my-5 border border-border rounded-xl p-4">
                  <h3 className="font-semibold">Private evidence access</h3>
                  <p className="text-sm text-muted">
                    State an investigation reason below. Access is audited and
                    message inspection must be permitted by platform policy.
                  </p>
                  <input
                    aria-label="Evidence access reason"
                    className={control + " mt-2"}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setOp(crypto.randomUUID());
                    }}
                    placeholder="Reason for inspecting this evidence"
                  />
                  <button
                    className={button + " mt-2"}
                    disabled={pending || reason.trim().length < 3}
                    onClick={inspect}
                  >
                    <ShieldCheck size={14} className="inline mr-1" />
                    Inspect evidence
                  </button>
                  {evidence && (
                    <div className="space-y-2 mt-3">
                      {evidence.documents.map((doc) => (
                        <a
                          key={doc.href}
                          href={doc.href}
                          className="block text-primary underline"
                        >
                          Download {doc.name}
                        </a>
                      ))}
                      {evidence.messages.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <p className="text-xs text-muted">
                            {m.sender} · {m.date}
                          </p>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      ))}
                      {!evidence.documents.length &&
                        !evidence.messages.length && <p>No evidence found.</p>}
                    </div>
                  )}
                </section>
              )}
            {detail.area === "subscriptions" && (
              <BillingOperationHistory
                userId={detail.id}
                canWrite={hasPermission(permissions, "subscriptions.provider")}
              />
            )}
            {detail.actions.length > 0 && (
              <form
                action={submit}
                className="my-5 rounded-xl border border-border p-4 space-y-3"
              >
                <h3 className="font-semibold">Admin action</h3>
                <label className="block text-sm">
                  Action
                  <select
                    className={control}
                    value={action}
                    onChange={(e) => {
                      setAction(e.target.value);
                      setConfirmed(false);
                      setOp(crypto.randomUUID());
                    }}
                    disabled={pending}
                  >
                    {detail.actions.map((v) => (
                      <option key={v} value={v}>
                        {readable(v)}
                      </option>
                    ))}
                  </select>
                </label>
                {action === "adjust" && (
                  <>
                    <label className="block text-sm">
                      Member
                      <select name="memberId" required className={control}>
                        <option value="">Choose member</option>
                        {lookups?.members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {m.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      Skill Hours (negative to remove)
                      <input
                        name="amount"
                        type="number"
                        step="1"
                        required
                        className={control}
                        onChange={() => setOp(crypto.randomUUID())}
                      />
                    </label>
                    <label className="block text-sm">
                      Internal note
                      <textarea
                        name="internalNote"
                        className={control}
                        maxLength={5000}
                      />
                    </label>
                  </>
                )}
                {action === "extend" && (
                  <label className="block text-sm">
                    New deadline
                    <input
                      required
                      name="deadline"
                      type="datetime-local"
                      className={control}
                    />
                  </label>
                )}
                {action === "feature" && (
                  <label className="flex gap-2">
                    <input type="checkbox" name="featured" defaultChecked />
                    Feature this listing
                  </label>
                )}
                {action === "triage" && (
                  <>
                    <label className="block text-sm">
                      Status
                      <select
                        name="status"
                        required
                        className={control}
                        defaultValue={detail.status}
                      >
                        {AREA_META[detail.area].statuses
                          .filter(
                            (s) =>
                              !["resolved", "dismissed"].includes(s) ||
                              detail.area === "support",
                          )
                          .map((s) => (
                            <option key={s} value={s}>
                              {readable(s)}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      Priority
                      <select
                        name="priority"
                        className={control}
                        defaultValue={String(
                          detail.editor?.priority || "normal",
                        )}
                      >
                        {["critical", "high", "normal", "low"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      Assigned admin
                      <select
                        name="assignedTo"
                        className={control}
                        defaultValue={String(detail.editor?.assigned_to || "")}
                      >
                        <option value="">Unassigned</option>
                        {lookups?.members
                          .filter((m) => m.role)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role})
                            </option>
                          ))}
                      </select>
                    </label>
                  </>
                )}
                {action === "resolve" &&
                  detail.area === "disputes" &&
                  detail.settlement && (
                    <>
                      <p className="text-sm">
                        Set awards from the reserves. Unawarded Hours return to
                        their original owner.
                      </p>
                      <label className="block text-sm">
                        Hours awarded to {detail.settlement.provider} (held by{" "}
                        {detail.settlement.requester})
                        <input
                          name="providerAward"
                          className={control}
                          type="number"
                          min="0"
                          max={detail.settlement.requesterHeld}
                          value={awards.providerAward}
                          onChange={(e) => {
                            setAwards({
                              ...awards,
                              providerAward: Number(e.target.value),
                            });
                            setOp(crypto.randomUUID());
                          }}
                        />
                      </label>
                      <label className="block text-sm">
                        Hours awarded to {detail.settlement.requester} (held by{" "}
                        {detail.settlement.provider})
                        <input
                          name="requesterAward"
                          className={control}
                          type="number"
                          min="0"
                          max={detail.settlement.providerHeld}
                          value={awards.requesterAward}
                          onChange={(e) => {
                            setAwards({
                              ...awards,
                              requesterAward: Number(e.target.value),
                            });
                            setOp(crypto.randomUUID());
                          }}
                        />
                      </label>
                    </>
                  )}
                {financial && detail.settlement && (
                  <div className="rounded-lg bg-surface-secondary p-3 text-sm">
                    <p className="font-semibold">Settlement preview</p>
                    <p>
                      {detail.settlement.provider} receives{" "}
                      {action === "release"
                        ? detail.settlement.requesterHeld
                        : action === "resolve"
                          ? awards.providerAward +
                            detail.settlement.providerHeld -
                            awards.requesterAward
                          : detail.settlement.providerHeld}{" "}
                      Skill Hours.
                    </p>
                    <p>
                      {detail.settlement.requester} receives{" "}
                      {action === "release"
                        ? detail.settlement.providerHeld
                        : action === "resolve"
                          ? awards.requesterAward +
                            detail.settlement.requesterHeld -
                            awards.providerAward
                          : detail.settlement.requesterHeld}{" "}
                      Skill Hours.
                    </p>
                    {detail.settlement.cashDeposits && (
                      <p className="text-red-500">
                        Cash deposits are present. This settlement is blocked
                        until a payment adapter confirms their disposition.
                      </p>
                    )}
                  </div>
                )}
                {action === "reply" && detail.area === "support" && (
                  <label className="block text-sm">
                    Attachment (optional)
                    <input
                      type="file"
                      name="attachment"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className={control}
                    />
                  </label>
                )}
                {detail.area === "subscriptions" && action === "refund" && (
                  <>
                    <label className="block text-sm">
                      Provider transaction ID / reference
                      <input
                        name="transactionId"
                        required
                        className={control}
                      />
                    </label>
                    <label className="block text-sm">
                      Refund amount (minor currency units)
                      <input
                        name="amount"
                        type="number"
                        min="1"
                        required
                        className={control}
                      />
                    </label>
                  </>
                )}
                <label className="block text-sm">
                  {action === "reply" ? "Reply to member" : "Reason (required)"}
                  <textarea
                    className={control}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setOp(crypto.randomUUID());
                    }}
                    minLength={3}
                    maxLength={5000}
                    required
                    rows={4}
                  />
                </label>
                {(financial ||
                  (detail.area === "subscriptions" && action !== "note")) && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => {
                        setConfirmed(e.target.checked);
                        setOp(crypto.randomUUID());
                      }}
                      required
                    />
                    I reviewed the impact and confirm this action.
                  </label>
                )}
                <button
                  className={button + " bg-primary text-white"}
                  disabled={
                    pending ||
                    reason.trim().length < 3 ||
                    (financial && !confirmed)
                  }
                >
                  {pending ? "Saving…" : "Confirm " + readable(action)}
                </button>
              </form>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="border border-red-500 p-3 rounded-lg">
            {error}
          </p>
        )}
        <section className="my-5">
          <h3 className="font-semibold mb-3">History & conversation</h3>
          {!history.length && (
            <p className="text-sm text-muted">No recorded events.</p>
          )}
          <ol className="space-y-3">
            {history.map((event) => (
              <li key={event.id} className="border-l-2 border-border pl-3">
                <p className="text-xs text-muted">
                  {event.actor} · {date(event.date, timeZone)}
                  {event.internal ? " · Internal" : ""}
                </p>
                <p className="font-medium text-sm">{readable(event.action)}</p>
                <p className="whitespace-pre-wrap text-sm">{event.message}</p>
                {event.attachments?.map((file) => (
                  <a
                    key={file.href}
                    href={file.href}
                    className="block text-sm text-primary underline"
                  >
                    Download {file.name}
                  </a>
                ))}
              </li>
            ))}
          </ol>
          {history.length >= 50 && (
            <button
              className={button + " mt-3"}
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try {
                  const last = history.at(-1)!;
                  const more = await readAdminHistory(detail.area, detail.id, {
                    date: last.date,
                    id: last.id,
                  });
                  setHistory([...history, ...more]);
                  if (!more.length) setError("No earlier events.");
                } catch (e) {
                  setError(String(e));
                } finally {
                  setPending(false);
                }
              }}
            >
              Load earlier events
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
function ContentEditor({
  detail,
  isNew,
  taxonomy,
  members,
  saved,
  busy,
}: {
  detail: AdminDetail;
  isNew: boolean;
  taxonomy: Record<string, unknown>[];
  members: { id: string; name: string }[];
  saved: () => Promise<void>;
  busy: (value: boolean) => void;
}) {
  const d = detail.editor || {},
    [content, setContent] = useState(String(d.content || "")),
    [preview, setPreview] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const inFlight = useRef(false);
  const wrap = (before: string, after = "") => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart,
      end = el.selectionEnd;
    setContent(
      content.slice(0, start) +
        before +
        content.slice(start, end) +
        after +
        content.slice(end),
    );
  };
  async function save(form: FormData) {
    if (inFlight.current) return;
    inFlight.current = true;
    busy(true);
    setPending(true);
    setError("");
    try {
      const data: Record<string, unknown> = Object.fromEntries(form.entries());
      data.content = content;
      if (data.publishAt)
        data.publishAt = new Date(String(data.publishAt)).toISOString();
      data.version = detail.version;
      data.tags = String(data.tags || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      data.sortOrder = Number(data.sortOrder || 0);
      data.links = String(data.links || "")
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const i = line.indexOf("|");
          return {
            label: line.slice(0, i).trim(),
            href: line.slice(i + 1).trim(),
          };
        });
      const result = await mutateAdminRecord({
        area: detail.area,
        id: detail.id,
        action: "save",
        data,
        reason: String(form.get("reason") || ""),
        operationId: crypto.randomUUID(),
      });
      if (!result.success) throw new Error(result.error);
      await saved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      inFlight.current = false;
      busy(false);
      setPending(false);
    }
  }
  return (
    <form action={save} className="space-y-4 my-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Title
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={String(d.title || "")}
            className={control}
          />
        </label>
        <label className="text-sm">
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+([-/][a-z0-9]+)*"
            defaultValue={String(d.slug || "")}
            className={control}
          />
        </label>
        <label className="text-sm">
          Content type
          <select
            name="kind"
            className={control}
            defaultValue={String(
              d.kind || (detail.area === "blog" ? "post" : "page"),
            )}
            disabled={!isNew}
          >
            <option
              value={String(
                d.kind || (detail.area === "blog" ? "post" : "page"),
              )}
            >
              {String(d.kind || (detail.area === "blog" ? "post" : "page"))}
            </option>
            {isNew &&
              detail.area === "cms" &&
              ["faq", "navigation", "global"].map((k) => (
                <option key={k}>{k}</option>
              ))}
          </select>
          {!isNew && <input type="hidden" name="kind" value={String(d.kind)} />}
        </label>
        <label className="text-sm">
          Status
          <select
            name="status"
            className={control}
            defaultValue={String(d.status || "draft")}
          >
            {["draft", "published", "scheduled", "archived"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Publish date
          <input
            name="publishAt"
            type="datetime-local"
            className={control}
            defaultValue={
              d.publish_at
                ? new Date(
                    new Date(String(d.publish_at)).getTime() -
                      new Date(String(d.publish_at)).getTimezoneOffset() *
                        60000,
                  )
                    .toISOString()
                    .slice(0, 16)
                : ""
            }
          />
        </label>
        <label className="text-sm">
          Author
          <select
            name="authorId"
            className={control}
            defaultValue={String(d.author_id || "")}
          >
            <option value="">Current administrator</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Category
          <select
            name="category"
            className={control}
            defaultValue={String(d.category || "")}
          >
            <option value="">Uncategorized</option>
            {taxonomy
              .filter((t) => t.kind === "category")
              .map((t) => (
                <option key={String(t.id)} value={String(t.slug)}>
                  {String(t.name)}
                </option>
              ))}
          </select>
        </label>
        <label className="text-sm">
          Tags (comma separated)
          <input
            name="tags"
            className={control}
            defaultValue={Array.isArray(d.tags) ? d.tags.join(", ") : ""}
          />
        </label>
        <label className="text-sm">
          Placement
          <select
            name="placement"
            className={control}
            defaultValue={String(d.placement || "")}
          >
            <option value="">Default</option>
            {[
              "header",
              "footer",
              "announcement",
              "homepage",
              "contact",
              "legal",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Order
          <input
            name="sortOrder"
            type="number"
            className={control}
            defaultValue={Number(d.sort_order || 0)}
          />
        </label>
      </div>
      <label className="block text-sm">
        Excerpt
        <textarea
          name="excerpt"
          maxLength={2000}
          defaultValue={String(d.excerpt || "")}
          className={control}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {[
          ["Heading", "## "],
          ["Bold", "**", "**"],
          ["Italic", "*", "*"],
          ["List", "\n- "],
          ["Quote", "\n> "],
          ["Link", "[", "](https://example.com)"],
          ["Image", "![Description](", ")"],
          ["Code", "\n```\n", "\n```"],
        ].map(([label, start, end]) => (
          <button
            key={label}
            type="button"
            className={button}
            onClick={() => wrap(start, end)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={button}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="prose dark:prose-invert max-w-none border border-border rounded-lg p-4">
          <Markdown>{content}</Markdown>
        </div>
      ) : (
        <label className="block text-sm">
          Content (Markdown)
          <textarea
            ref={textRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={control + " min-h-72 font-mono"}
            maxLength={100000}
          />
        </label>
      )}
      <label className="block text-sm">
        Navigation links (Label | /path, one per line)
        <textarea
          name="links"
          className={control}
          defaultValue={
            Array.isArray(d.links)
              ? d.links
                  .map((v) => String(v.label) + " | " + String(v.href))
                  .join("\n")
              : ""
          }
        />
      </label>
      <label className="block text-sm">
        Upload public image
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className={control}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPending(true);
            try {
              const f = new FormData();
              f.set("file", file);
              const image = await uploadAdminAsset(
                detail.area as "cms" | "blog",
                f,
              );
              setContent(content + "\n\n![Description](" + image.url + ")");
              setError("Image uploaded: " + image.url);
            } catch (err) {
              setError(String(err));
            } finally {
              setPending(false);
            }
          }}
        />
      </label>
      <details className="rounded-lg border border-border p-3">
        <summary>Images & search engine metadata</summary>
        <div className="grid gap-3 sm:grid-cols-2 mt-3">
          {[
            ["featuredImage", "Featured image URL", "featured_image"],
            ["ogImage", "Open Graph image URL", "og_image"],
            ["seoTitle", "SEO title", "seo_title"],
            ["seoDescription", "SEO description", "seo_description"],
            ["canonicalUrl", "Canonical URL", "canonical_url"],
          ].map(([name, label, key]) => (
            <label key={name} className="text-sm">
              {label}
              <input
                name={name}
                className={control}
                defaultValue={String(d[key] || "")}
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">
          Upload an image above, then paste its URL here.
        </p>
      </details>
      <label className="block text-sm">
        Publishing reason
        <textarea
          name="reason"
          required
          minLength={3}
          maxLength={5000}
          className={control}
        />
      </label>
      {error && (
        <p role="alert" className="text-red-500">
          {error}
        </p>
      )}
      <button className={button + " bg-primary text-white"} disabled={pending}>
        {pending ? "Saving…" : "Save content"}
      </button>
      {!isNew && (
        <Link
          className={button + " ml-3"}
          target="_blank"
          href={"/admin/preview/" + detail.id}
        >
          Preview saved content
        </Link>
      )}
    </form>
  );
}
function Taxonomy({ area }: { area: AdminArea }) {
  const [data, setData] = useState<Awaited<
      ReturnType<typeof adminLookups>
    > | null>(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  useEffect(() => {
    adminLookups(AREA_META[area].write)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [area]);
  if (area !== "blog") return null;
  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="font-semibold">Categories & authors</summary>
      <div className="grid gap-3 mt-4 sm:grid-cols-2">
        {data?.taxonomy.map((t) => (
          <div
            key={String(t.id)}
            className="text-sm border border-border p-3 rounded-lg"
          >
            {String(t.name)} · {String(t.kind)} · {String(t.slug)}
          </div>
        ))}
      </div>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        action={async (f) => {
          setPending(true);
          const result = await saveContentTaxonomy({
            kind: String(f.get("kind")),
            name: String(f.get("name")),
            slug: String(f.get("slug")),
            bio: String(f.get("bio")),
            userId: String(f.get("userId") || ""),
            reason: String(f.get("reason")),
          });
          if (!result.success) setError(result.error || "Could not save");
          else setData(await adminLookups("blog.write"));
          setPending(false);
        }}
      >
        <label className="text-sm">
          Type
          <select name="kind" className={control}>
            <option value="category">Category</option>
            <option value="author">Author</option>
          </select>
        </label>
        <label className="text-sm">
          Name
          <input name="name" required className={control} />
        </label>
        <label className="text-sm">
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            className={control}
          />
        </label>
        <label className="text-sm">
          Author account
          <select name="userId" className={control}>
            <option value="">None (category)</option>
            {data?.members
              .filter((m) => m.role)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </label>
        <label className="text-sm">
          Biography
          <textarea name="bio" className={control} />
        </label>
        <label className="text-sm">
          Reason
          <input required minLength={3} name="reason" className={control} />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className={button} disabled={pending}>
          Add category / author
        </button>
      </form>
    </details>
  );
}
