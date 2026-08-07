"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/constants";

export default function TeamList({ initialTeam, currentUserId }) {
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
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {team.map((t) => (
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
                <td className="px-5 py-3 figure text-muted">{formatDate(t.created_at)}</td>
                <td className="px-5 py-3 text-right">
                  {t.id === currentUserId ? (
                    <span className="text-xs text-muted">You</span>
                  ) : t.role === "admin" ? (
                    <button className="text-sm text-muted hover:text-ink" onClick={() => setRole(t.id, "bd")}>
                      Make BD rep
                    </button>
                  ) : (
                    <button className="text-sm font-medium text-primary hover:underline" onClick={() => setRole(t.id, "admin")}>
                      Make admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card bg-primary-soft/40 p-5">
        <h3 className="text-sm font-semibold text-ink">Adding a BD rep</h3>
        <p className="mt-1 text-sm text-muted">
          Share your app's link and have each rep create their own account on the sign-in page. New accounts
          join as BD reps automatically — they'll only see the leads you assign to them. Come back here to
          promote anyone to admin.
        </p>
      </div>
    </div>
  );
}
