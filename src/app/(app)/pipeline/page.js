import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import Board from "./Board";

export const dynamic = "force-dynamic";

export default async function PipelinePage({ searchParams }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = me?.role === "admin";

  const { data: leads = [] } = await supabase
    .from("leads")
    .select("id, name, company, status, value, assigned_to, assigned:assigned_to(id, full_name)")
    .order("created_at", { ascending: false });

  const { data: team = [] } = await supabase.from("profiles").select("id, full_name").order("full_name");

  return (
    <>
      <PageHeader title="Pipeline" subtitle="Every lead by stage, and who's working it." />
      <div className="p-8">
        <Board
          leads={leads || []}
          team={team || []}
          isAdmin={isAdmin}
          initialAssignee={searchParams?.assignee || ""}
        />
      </div>
    </>
  );
}
