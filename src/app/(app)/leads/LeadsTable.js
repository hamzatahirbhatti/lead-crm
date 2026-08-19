"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { STATUSES, formatMoney, formatDate } from "@/lib/constants";
import StatusPill from "@/components/StatusPill";

export default function LeadsTable({ initialLeads, team, isAdmin, initialStatus, initialAssignee }) {
  const supabase = createClient();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "");
  const [assigneeFilter, setAssigneeFilter] = useState(initialAssignee || "");
  const [savingId, setSavingId] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

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

  const allVisibleSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSel = filtered.length > 0 && filtered.every((l) => next.has(l.id));
      filtered.forEach((l) => (allSel ? next.delete(l.id) : next.add(l.id)));
      return next;
    });
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (
      !confirm(
        `Delete ${ids.length} lead${ids.length === 1 ? "" : "s"}? This also removes their notes and cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    setDeleting(false);
    if (error) return alert("Could not delete: " + error.message);
    setLeads((prev) => prev.filter((l) => !selected.has(l.id)));
    setSelected(new Set());
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

      {/* Bulk actions */}
      {isAdmin && selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-soft px-4 py-2.5">
          <span className="text-sm font-medium text-primary">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-4">
            <button className="text-sm text-muted hover:text-ink" onClick={() => setSelected(new Set())}>
              Clear
            </button>
            <button className="btn-danger" onClick={deleteSelected} disabled={deleting}>
              {deleting ? "Deleting…" : `Delete ${selected.size}`}
            </button>
          </div>
        </div>
      )}

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
                  {isAdmin && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 cursor-pointer accent-primary"
                        aria-label="Select all"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 w-12 text-right">#</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((l, i) => (
                  <tr
                    key={l.id}
                    className={`hover:bg-surface ${savingId === l.id ? "opacity-60" : ""} ${
                      selected.has(l.id) ? "bg-primary-soft/40" : ""
                    }`}
                  >
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(l.id)}
                          onChange={() => toggleOne(l.id)}
                          className="h-4 w-4 cursor-pointer accent-primary"
                          aria-label={`Select ${l.name}`}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 figure text-right text-xs text-muted">{i + 1}</td>
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
