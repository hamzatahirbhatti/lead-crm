"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STATUSES, formatMoney, formatDate } from "@/lib/constants";
import StatusPill from "@/components/StatusPill";

export default function LeadDetail({ lead, initialNotes, team, isAdmin, currentUserId }) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: lead.name || "",
    company: lead.company || "",
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "",
    value: lead.value ?? "",
    designation: lead.designation || "",
    website: lead.website || "",
    linkedin: lead.linkedin || "",
    location: lead.location || "",
    status: lead.status,
    assigned_to: lead.assigned_to || "",
    next_follow_up: lead.next_follow_up || "",
  });
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [postingNote, setPostingNote] = useState(false);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    setSavingField(true);
    const patch = {
      name: form.name,
      company: form.company || null,
      email: form.email || null,
      phone: form.phone || null,
      source: form.source || null,
      value: form.value === "" ? null : Number(form.value),
      designation: form.designation || null,
      website: form.website || null,
      linkedin: form.linkedin || null,
      location: form.location || null,
      status: form.status,
      next_follow_up: form.next_follow_up || null,
    };
    if (isAdmin) patch.assigned_to = form.assigned_to || null;

    const { error } = await supabase.from("leads").update(patch).eq("id", lead.id);
    setSavingField(false);
    if (error) return alert("Could not save: " + error.message);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
    router.refresh();
  }

  async function addNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setPostingNote(true);
    const { data, error } = await supabase
      .from("notes")
      .insert({ lead_id: lead.id, author_id: currentUserId, body: newNote.trim() })
      .select("*, author:author_id(full_name), reactions:note_reactions(user_id)")
      .single();
    setPostingNote(false);
    if (error) return alert("Could not add note: " + error.message);
    setNotes((prev) => [data, ...prev]);
    setNewNote("");
  }

  async function toggleReaction(note) {
    const reacted = (note.reactions || []).some((r) => r.user_id === currentUserId);
    // optimistic update
    const apply = (add) =>
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== note.id) return n;
          const list = n.reactions || [];
          return {
            ...n,
            reactions: add
              ? [...list, { user_id: currentUserId }]
              : list.filter((r) => r.user_id !== currentUserId),
          };
        })
      );
    apply(!reacted);

    const req = reacted
      ? supabase
          .from("note_reactions")
          .delete()
          .eq("note_id", note.id)
          .eq("user_id", currentUserId)
          .eq("emoji", "👍")
      : supabase
          .from("note_reactions")
          .insert({ note_id: note.id, user_id: currentUserId, emoji: "👍" });

    const { error } = await req;
    if (error) apply(reacted); // revert on failure
  }

  async function deleteLead() {
    if (!confirm("Delete this lead and all its notes? This cannot be undone.")) return;
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) return alert("Could not delete: " + error.message);
    router.push("/leads");
    router.refresh();
  }

  return (
    <div className="grid gap-6 p-8 lg:grid-cols-[1.4fr_1fr]">
      {/* Left: details */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{form.name || "Untitled lead"}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusPill status={form.status} />
              <span className="text-sm text-muted">{form.company || "No company"}</span>
            </div>
          </div>
          {isAdmin && (
            <button onClick={deleteLead} className="btn-danger">Delete</button>
          )}
        </div>

        <div className="card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Company"><input className="field" value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
            <Field label="Email"><input className="field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Phone"><input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Designation"><input className="field" value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Marketing Manager" /></Field>
            <Field label="Website"><input className="field" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="company.com" /></Field>
            <Field label="LinkedIn"><input className="field" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/…" /></Field>
            <Field label="Location"><input className="field" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" /></Field>
            <Field label="Source"><input className="field" value={form.source} onChange={(e) => set("source", e.target.value)} /></Field>
            <Field label="Deal value">
              <input className="field" type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0" />
            </Field>
            <Field label="Status">
              <select className="field" value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Next follow-up">
              <input className="field" type="date" value={form.next_follow_up || ""} onChange={(e) => set("next_follow_up", e.target.value)} />
            </Field>
            {isAdmin && (
              <Field label="Assigned to">
                <select className="field" value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}>
                  <option value="">Unassigned</option>
                  {team.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={save} className="btn-primary" disabled={savingField}>
              {savingField ? "Saving…" : "Save changes"}
            </button>
            {savedFlash && <span className="text-sm text-stage-won">Saved.</span>}
          </div>
        </div>
      </div>

      {/* Right: notes / follow-ups */}
      <div className="space-y-4">
        <div className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Notes & follow-ups</h2>
          </div>
          <form onSubmit={addNote} className="border-b border-line p-4">
            <textarea
              className="field min-h-[80px] resize-y"
              placeholder="Log a call, an email, or a next step…"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button type="submit" className="btn-primary mt-3 w-full" disabled={postingNote || !newNote.trim()}>
              {postingNote ? "Adding…" : "Add note"}
            </button>
          </form>

          {notes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No notes yet. The first call or email you log will show up here.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {notes.map((n) => (
                <li key={n.id} className="px-5 py-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">{n.author?.full_name || "Someone"}</span>
                    <span className="figure text-xs text-muted">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted">{n.body}</p>
                  {(() => {
                    const count = (n.reactions || []).length;
                    const reacted = (n.reactions || []).some((r) => r.user_id === currentUserId);
                    return (
                      <button
                        onClick={() => toggleReaction(n)}
                        className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                          reacted
                            ? "border-primary/30 bg-primary-soft text-primary"
                            : "border-line bg-white text-muted hover:bg-surface"
                        }`}
                        title={reacted ? "Remove your reaction" : "React with a thumbs up"}
                      >
                        <span className="text-sm leading-none">👍</span>
                        {count > 0 && <span className="figure">{count}</span>}
                      </button>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
