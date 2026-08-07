"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/constants";

const CATEGORIES = ["Pitch Deck", "Portfolio", "Sales Kit", "General"];

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Resources({ initialDocs, isAdmin, currentUserId }) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef(null);

  const [docs, setDocs] = useState(initialDocs);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Pitch Deck");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function upload(e) {
    e.preventDefault();
    if (!file) return alert("Choose a file first.");
    setUploading(true);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });

    if (upErr) {
      setUploading(false);
      return alert("Upload failed: " + upErr.message);
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: title.trim() || file.name,
        category,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: currentUserId,
      })
      .select("*, uploader:uploaded_by(full_name)")
      .single();

    setUploading(false);
    if (error) return alert("File saved, but recording it failed: " + error.message);

    setDocs((prev) => [data, ...prev]);
    setTitle("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function download(doc) {
    setBusyId(doc.id);
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 3600, { download: doc.file_name || true });
    setBusyId(null);
    if (error || !data?.signedUrl) return alert("Could not open file: " + (error?.message || "unknown error"));
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function remove(doc) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setBusyId(doc.id);
    await supabase.storage.from("documents").remove([doc.file_path]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    setBusyId(null);
    if (error) return alert("Could not delete: " + error.message);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  }

  const nonEmpty = CATEGORIES.map((c) => ({ category: c, items: docs.filter((d) => d.category === c) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <div className="max-w-4xl space-y-8">
      {isAdmin && (
        <form onSubmit={upload} className="card space-y-4 p-6">
          <h2 className="text-sm font-semibold text-ink">Upload a document</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Title</span>
              <input
                className="field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Company Pitch Deck 2026"
              />
            </label>
            <label className="block">
              <span className="label">Category</span>
              <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="label">File</span>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="field cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-primary-soft file:px-3 file:py-1 file:text-primary"
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <span className="text-xs text-muted">PDF, PowerPoint, Word, images, etc. Up to 50 MB per file.</span>
          </div>
        </form>
      )}

      {docs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-muted">
            {isAdmin
              ? "No documents yet. Upload your first deck or sales kit above."
              : "No documents have been shared yet. Check back soon."}
          </p>
        </div>
      ) : (
        nonEmpty.map((group) => (
          <section key={group.category}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">{group.category}</h2>
              <span className="figure text-xs text-muted">{group.items.length}</span>
            </div>
            <div className="card divide-y divide-line">
              {group.items.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center gap-4 px-5 py-4 ${busyId === doc.id ? "opacity-60" : ""}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinejoin="round" />
                      <path d="M14 2v6h6" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{doc.title}</p>
                    <p className="truncate text-xs text-muted">
                      {doc.file_name}
                      {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ""} · added {formatDate(doc.created_at)}
                      {doc.uploader?.full_name ? ` by ${doc.uploader.full_name}` : ""}
                    </p>
                  </div>
                  <button className="btn-ghost" onClick={() => download(doc)} disabled={busyId === doc.id}>
                    Download
                  </button>
                  {isAdmin && (
                    <button
                      className="text-sm text-muted hover:text-red-600"
                      onClick={() => remove(doc)}
                      disabled={busyId === doc.id}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
