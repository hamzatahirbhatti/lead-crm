import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUSES, formatMoney, formatDate } from "@/lib/constants";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";

const STAGE_COLORS = {
  New: "#3B82F6",
  Contacted: "#F59E0B",
  Qualified: "#8B5CF6",
  Won: "#10B981",
  Lost: "#94A3B8",
};

export default async function DashboardPage() {
  const supabase = createClient();

  // RLS scopes these automatically: admins see all, BDs see their own.
  const { data: leads = [] } = await supabase
    .from("leads")
    .select("id, name, company, status, value, next_follow_up, assigned_to");

  const rows = leads || [];
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let openCount = 0;
  let wonValue = 0;
  for (const l of rows) {
    counts[l.status] = (counts[l.status] || 0) + 1;
    if (l.status === "Won") wonValue += Number(l.value) || 0;
    if (l.status !== "Won" && l.status !== "Lost") openCount += 1;
  }
  const total = rows.length;
  const maxCount = Math.max(1, ...STATUSES.map((s) => counts[s]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUps = rows
    .filter((l) => l.next_follow_up)
    .sort((a, b) => new Date(a.next_follow_up) - new Date(b.next_follow_up))
    .slice(0, 6);
  const overdue = rows.filter(
    (l) => l.next_follow_up && new Date(l.next_follow_up) < today && l.status !== "Won" && l.status !== "Lost"
  ).length;

  const stats = [
    { label: "Total leads", value: total },
    { label: "Open", value: openCount },
    { label: "Won value", value: formatMoney(wonValue) },
    { label: "Follow-ups overdue", value: overdue, warn: overdue > 0 },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Where every lead stands right now." />

      <div className="space-y-6 p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-xs font-medium text-muted">{s.label}</p>
              <p className={`figure mt-2 text-2xl ${s.warn ? "text-red-600" : "text-ink"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Pipeline overview — the signature view */}
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Pipeline</h2>
            <Link href="/leads" className="text-sm font-medium text-primary hover:underline">
              View all leads
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {STATUSES.map((s) => (
              <Link
                key={s}
                href={`/leads?status=${s}`}
                className="group rounded-lg border border-line p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[s] }} />
                  <span className="text-xs font-medium text-muted">{s}</span>
                </div>
                <p className="figure mt-2 text-2xl text-ink">{counts[s]}</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(counts[s] / maxCount) * 100}%`, background: STAGE_COLORS[s] }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming follow-ups */}
        <div className="card">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold text-ink">Next follow-ups</h2>
          </div>
          {followUps.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">
              No follow-ups scheduled. Open a lead and set a follow-up date to plan your week.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {followUps.map((l) => {
                const isOverdue = new Date(l.next_follow_up) < today;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/leads/${l.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                        <p className="truncate text-xs text-muted">{l.company || "—"}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusPill status={l.status} />
                        <span
                          className={`figure text-xs ${isOverdue ? "text-red-600" : "text-muted"}`}
                        >
                          {formatDate(l.next_follow_up)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
