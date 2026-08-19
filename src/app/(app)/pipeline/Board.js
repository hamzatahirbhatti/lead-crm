"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUSES, formatMoney } from "@/lib/constants";

const STAGE_COLORS = {
  New: "#3B82F6",
  Contacted: "#F59E0B",
  Qualified: "#8B5CF6",
  Won: "#10B981",
  Lost: "#94A3B8",
};

function initials(name) {
  if (!name) return "–";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Board({ leads, team, isAdmin, initialAssignee }) {
  const [assignee, setAssignee] = useState(initialAssignee || "");

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (assignee === "unassigned") return !l.assigned_to;
        if (assignee) return l.assigned_to === assignee;
        return true;
      }),
    [leads, assignee]
  );

  const columns = STATUSES.map((s) => ({ status: s, items: filtered.filter((l) => l.status === s) }));

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          <select className="field w-auto" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">All reps</option>
            <option value="unassigned">Unassigned</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
          <span className="text-sm text-muted">{filtered.length} leads shown</span>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.status} className="w-72 shrink-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[col.status] }} />
              <span className="text-sm font-semibold text-ink">{col.status}</span>
              <span className="figure text-xs text-muted">{col.items.length}</span>
            </div>

            <div className="space-y-2">
              {col.items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                  No leads
                </p>
              ) : (
                col.items.map((l) => (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    className="block rounded-lg border border-line bg-white p-3 shadow-card transition-colors hover:border-primary/40"
                  >
                    <p className="text-sm font-medium text-ink">{l.name}</p>
                    {l.company && <p className="truncate text-xs text-muted">{l.company}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                            l.assigned?.full_name ? "bg-primary-soft text-primary" : "bg-surface text-muted"
                          }`}
                        >
                          {initials(l.assigned?.full_name)}
                        </span>
                        <span className="truncate text-xs text-muted">
                          {l.assigned?.full_name || "Unassigned"}
                        </span>
                      </span>
                      {l.value != null && l.value !== "" && (
                        <span className="figure shrink-0 text-xs text-muted">{formatMoney(l.value)}</span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
