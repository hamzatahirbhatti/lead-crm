import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LeadDetail from "./LeadDetail";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = me?.role === "admin";

  const { data: lead } = await supabase
    .from("leads")
    .select("*, assigned:assigned_to(id, full_name)")
    .eq("id", params.id)
    .single();

  if (!lead) notFound();

  const { data: notes = [] } = await supabase
    .from("notes")
    .select("*, author:author_id(full_name), reactions:note_reactions(user_id)")
    .eq("lead_id", params.id)
    .order("created_at", { ascending: false });

  const { data: team = [] } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");

  return (
    <>
      <div className="border-b border-line px-8 py-4">
        <Link href="/leads" className="text-sm text-muted hover:text-ink">
          ← Back to leads
        </Link>
      </div>
      <LeadDetail
        lead={lead}
        initialNotes={notes || []}
        team={team || []}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </>
  );
}
