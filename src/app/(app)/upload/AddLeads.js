"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { LEAD_FIELDS, STATUSES } from "@/lib/constants";

function guessMapping(headers) {
  const map = {};
  for (const field of LEAD_FIELDS) {
    const hit = headers.find((h) => field.aliases.includes(h.trim().toLowerCase()));
    map[field.key] = hit || "";
  }
  return map;
}

export default function AddLeads({ team, currentUserId }) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState("csv"); // "csv" | "manual"

  return (
    <div className="max-w-3xl space-y-6">
      <div className="inline-flex rounded-lg border border-line bg-white p-1">
        <button
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "csv" ? "bg-primary text-white" : "text-muted hover:text-ink"}`}
          onClick={() => setTab("csv")}
        >
          Import CSV
        </button>
        <button
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "manual" ? "bg-primary text-white" : "text-muted hover:text-ink"}`}
          onClick={() => setTab("manual")}
        >
          Add one
        </button>
      </div>

      {tab === "csv" ? (
        <CsvImport team={team} supabase={supabase} onDone={() => router.push("/leads")} router={router} />
      ) : (
        <ManualAdd team={team} supabase={supabase} onDone={() => router.push("/leads")} router={router} />
      )}
    </div>
  );
}

/* -------------------------------- CSV -------------------------------- */
function CsvImport({ team, supabase, onDone, router }) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [assignTo, setAssignTo] = useState("");
  const [status, setStatus] = useState("New");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hs = res.meta.fields || [];
        setHeaders(hs);
        setRows(res.data);
        setMapping(guessMapping(hs));
      },
    });
  }

  async function runImport() {
    const nameCol = mapping.name;
    if (!nameCol) return alert("Map the Name column before importing.");
    setImporting(true);

    const payload = rows
      .map((r) => {
        const rec = { status, created_by: null, assigned_to: assignTo || null };
        for (const field of LEAD_FIELDS) {
          const col = mapping[field.key];
          let v = col ? (r[col] ?? "").toString().trim() : "";
          if (field.key === "value") v = v.replace(/[^0-9.]/g, "");
          rec[field.key] = v === "" ? null : field.key === "value" ? Number(v) : v;
        }
        return rec;
      })
      .filter((r) => r.name);

    if (payload.length === 0) {
      setImporting(false);
      return alert("No rows with a name were found.");
    }

    const { error, count } = await supabase.from("leads").insert(payload, { count: "exact" });
    setImporting(false);
    if (error) return alert("Import failed: " + error.message);
    setResult({ inserted: count ?? payload.length, skipped: rows.length - payload.length });
    router.refresh();
  }

  const preview = rows.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <p className="mb-3 text-sm text-muted">
          Upload a <span className="font-medium text-ink">.csv</span> with a header row. We'll match common
          columns automatically — check the mapping below before importing.
        </p>
        <input type="file" accept=".csv" onChange={onFile} className="field cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-primary-soft file:px-3 file:py-1 file:text-primary" />
      </div>

      {headers.length > 0 && (
        <>
          <div className="card p-6">
            <h3 className="mb-4 text-sm font-semibold text-ink">Match your columns</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEAD_FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="label">
                    {field.label}
                    {field.key === "name" && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    className="field"
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                  >
                    <option value="">— skip —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              <label className="block">
                <span className="label">Set status for all</span>
                <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Assign all to (optional)</span>
                <select className="field" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                  <option value="">Leave unassigned</option>
                  {team.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">
              Preview · {rows.length} rows found
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    {LEAD_FIELDS.map((f) => <th key={f.key} className="px-4 py-2">{f.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.map((r, i) => (
                    <tr key={i}>
                      {LEAD_FIELDS.map((f) => (
                        <td key={f.key} className="px-4 py-2 text-muted">
                          {mapping[f.key] ? r[mapping[f.key]] || "—" : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={runImport} className="btn-primary" disabled={importing}>
              {importing ? "Importing…" : `Import ${rows.length} leads`}
            </button>
            {result && (
              <span className="text-sm text-stage-won">
                Imported {result.inserted}. {result.skipped > 0 && `Skipped ${result.skipped} without a name.`}{" "}
                <button className="font-medium text-primary hover:underline" onClick={onDone}>View leads →</button>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ Manual ------------------------------- */
function ManualAdd({ team, supabase, onDone, router }) {
  const empty = { name: "", company: "", email: "", phone: "", source: "", value: "", designation: "", website: "", linkedin: "", location: "", status: "New", assigned_to: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name.trim(),
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
      assigned_to: form.assigned_to || null,
    });
    setSaving(false);
    if (error) return alert("Could not add: " + error.message);
    setForm(empty);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *"><input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field>
        <Field label="Company"><input className="field" value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
        <Field label="Email"><input className="field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Phone"><input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Designation"><input className="field" value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Marketing Manager" /></Field>
        <Field label="Website"><input className="field" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="company.com" /></Field>
        <Field label="LinkedIn"><input className="field" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/…" /></Field>
        <Field label="Location"><input className="field" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" /></Field>
        <Field label="Source"><input className="field" value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Webinar, referral…" /></Field>
        <Field label="Deal value"><input className="field" type="number" value={form.value} onChange={(e) => set("value", e.target.value)} /></Field>
        <Field label="Status">
          <select className="field" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Assign to">
          <select className="field" value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}>
            <option value="">Unassigned</option>
            {team.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Adding…" : "Add lead"}
        </button>
        {saved && <span className="text-sm text-stage-won">Added. Add another below.</span>}
      </div>
    </form>
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
