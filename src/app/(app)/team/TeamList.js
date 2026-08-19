"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/constants";

export default function TeamList({ initialTeam, currentUserId, counts = {}, unassigned = 0 }) {
  const supabase = createClient();
  const [team, setTeam] = useState(initialTeam);
  const [busyId, setBusyId] = useState(null);

  async function setRole(id, role) {
    setBusyId(id);
    setTeam((prev) => prev.map((t) => (t.id === id ? { ...t, role } : t)));
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    setBusyId(null);
    if (error) alert("Could not update role: " + error.message);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium text-muted">
              <th className="px-5 py-3">Member</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Leads assigned</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {team.map((t) => {
              const c = counts[t.id] || { total: 0, open: 0 };
              return (
                <tr key={t.id} className={busyId === t.id ? "opacity-60" : ""}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{t.full_name}</p>
                    <p className="text-xs text-muted">{t.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`pill ${t.role === "admin" ? "pill-Qualified" : "pill-New"}`}>
                      {t.role === "admin" ? "Admin" : "BD rep"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {c.total > 0 ? (
                      <Link href={`/leads?assignee=${t.id}`} className="group inline-flex items-baseline gap-1.5">
                        <span className="figure text-base font-medium text-ink group-hover:text-primary">
                          {c.total}
                        </span>
                        <span className="text-xs text-muted">({c.open} open)</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3 figure text-muted">{formatDate(t.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    {t.id === currentUserId ? (
                      <span className="text-xs text-muted">You</span>
                    ) : t.role === "admin" ? (
                      <button className="text-sm text-muted hover:text-ink" onClick={() => setRole(t.id, "bd")}>
                        Make BD rep
                      </button>
                    ) : (
                      <button
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => setRole(t.id, "admin")}
                      >
                        Make admin
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unassigned > 0 && (
        <Link
          href="/leads?assignee=unassigned"
          className="card flex items-center justify-between p-4 hover:border-primary/40"
        >
          <span className="text-sm text-ink">
            <span className="figure font-medium">{unassigned}</span> lead{unassigned === 1 ? "" : "s"} not
            assigned to anyone yet
          </span>
          <span className="text-sm font-medium text-primary">Assign them &rarr;</span>
        </Link>
      )}

      <div className="card bg-primary-soft/40 p-5">
        <h3 className="text-sm font-semibold text-ink">How assignment works</h3>
        <p className="mt-1 text-sm text-muted">
          Click any number in the "Leads assigned" column to see exactly which leads that rep is working. Each
          BD rep only sees the leads assigned to them; you see everyone's. Assign or reassign leads from the
          Leads table or any lead's page.
        </p>
      </div>
    </div>
  );
}
