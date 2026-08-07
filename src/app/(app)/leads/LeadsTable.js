"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { STATUSES, formatMoney, formatDate } from "@/lib/constants";
import StatusPill from "@/components/StatusPill";

export default function LeadsTable({ initialLeads, team, isAdmin, initialStatus }) {
  const supabase = createClient();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [savingId, setSavingId] = useState(null);

  const bds = team; // everyone can be assigned; admins included

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (assigneeFilter === "unassigned" && l.assigned_to) return false;
      if (assigneeFilter && assigneeFilter !== "unassigned" && l.assigned_to !== assigneeFilter)
        return false;
      if (!q) return true;
      return (
        (l.name || "").toLowerCase().includes(q) ||
        (l.company || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q)
      );
    });
  }, [leads, search, statusFilter, assigneeFilter]);

  async function updateLead(id, patch) {
    setSavingId(id);
    // optimistic
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) alert("Could not save: " + error.message);
    setSavingId(null);
  }

  function nameFor(id) {
    return team.find((t) => t.id === id)?.full_name || "Unassigned";
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field max-w-xs"
          placeholder="Search name, company, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {isAdmin && (
          <select
            className="field w-auto"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="">All reps</option>
            <option value="unassigned">Unassigned</option>
            {bds.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        )}
        {(search || statusFilter || assigneeFilter) && (
          <button
            className="text-sm text-muted hover:text-ink"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setAssigneeFilter("");
            }}
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-sm text-muted">{filtered.length} shown</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted">
            No leads match. {leads.length === 0 && isAdmin && "Head to Add leads to import your first batch."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium text-muted">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((l) => (
                  <tr key={l.id} className={`hover:bg-surface ${savingId === l.id ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${l.id}`} className="font-medium text-ink hover:text-primary">
                        {l.name}
                      </Link>
                      <p className="text-xs text-muted">{l.company || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={`pill pill-${l.status} cursor-pointer border-0 pr-1 focus:ring-2 focus:ring-primary/30`}
                        value={l.status}
                        onChange={(e) => updateLead(l.id, { status: e.target.value })}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <select
                          className="field w-auto py-1 text-xs"
                          value={l.assigned_to || ""}
                          onChange={(e) => updateLead(l.id, { assigned_to: e.target.value || null })}
                        >
                          <option value="">Unassigned</option>
                          {bds.map((t) => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted">{nameFor(l.assigned_to)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 figure text-muted">{formatMoney(l.value)}</td>
                    <td className="px-4 py-3 figure text-muted">{formatDate(l.next_follow_up)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/leads/${l.id}`} className="text-sm font-medium text-primary hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
